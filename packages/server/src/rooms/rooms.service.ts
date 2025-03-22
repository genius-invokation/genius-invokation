// Copyright (C) 2024-2025 Guyutongxue
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  type ActionRequest,
  type ActionResponse,
  type ChooseActiveRequest,
  type ChooseActiveResponse,
  type GameConfig,
  type GameStateLogEntry,
  GiTcgError,
  Game as InternalGame,
  type Notification,
  type PlayerIO,
  type RerollDiceResponse,
  type RpcMethod,
  type RpcRequest,
  type SwitchHandsResponse,
  serializeGameStateLog,
  CORE_VERSION,
  VERSIONS,
  RpcResponse,
  SelectCardResponse,
  CURRENT_VERSION,
  type Version,
} from "@gi-tcg/core";
import { dispatchRpc } from "@gi-tcg/typings";
import getData from "@gi-tcg/data";
import { type Deck, flip } from "@gi-tcg/utils";
import {
  BehaviorSubject,
  Observable,
  Subject,
  concat,
  defer,
  filter,
  interval,
  map,
  mergeWith,
  of,
  startWith,
  takeUntil,
} from "rxjs";
import { createGuestId, DeckVerificationError, verifyDeck } from "../utils";
import type {
  CreateRoomDto,
  GuestCreateRoomDto,
  GuestJoinRoomDto,
  PlayerActionResponseDto,
  UserCreateRoomDto,
} from "./rooms.controller";
import { DecksService } from "../decks/decks.service";
import { UsersService, type UserInfo } from "../users/users.service";
import { GamesService } from "../games/games.service";
import { semver, stringWidth } from "bun";

interface RoomConfig extends Partial<GameConfig> {
  initTotalActionTime: number; // defaults 45
  rerollTime: number; // defaults 40
  roundTotalActionTime: number; // defaults 60
  actionTime: number; // defaults 25
  watchable: boolean; // defaults false
  private: boolean; // defaults false
  allowGuest: boolean; // defaults true
  gameVersion: Version; // defaults latest
}

interface CreateRoomConfig extends RoomConfig {
  hostWho: 0 | 1;
}

interface PlayerIOWithError extends PlayerIO {
  // notify: (notification: NotificationMessage) => void;
  // rpc: (method: RpcMethod, params: RpcRequest[RpcMethod]) => Promise<any>;
  onError: (e: GiTcgError) => void;
}

type PlayerInfo = (
  | {
      isGuest: true;
      id: string;
    }
  | {
      isGuest: false;
      id: number;
    }
) & {
  name: string;
  deck: Deck;
};

export type PlayerId = PlayerInfo["id"];

export interface SSEWaiting {
  type: "waiting";
}

export interface SSEPing {
  type: "ping";
}

export interface SSEInitialized {
  type: "initialized";
  who: 0 | 1;
  config: RoomConfig | null;
  myPlayerInfo: PlayerInfo;
  oppPlayerInfo: PlayerInfo;
}

export interface SSENotification {
  type: "notification";
  data: Notification;
}
export interface SSEError {
  type: "error";
  message: string;
}
export interface SSERpc {
  type: "rpc";
  id: number;
  timeout: number;
  request: RpcRequest;
}

export type SSEPayload =
  | SSEPing
  | SSERpc
  | SSEWaiting
  | SSEInitialized
  | SSENotification
  | SSEError;

interface RpcResolver {
  id: number;
  request: RpcRequest;
  timeout: number;
  resolve: (response: any) => void;
}

const pingInterval = interval(15 * 1000).pipe(
  map((): SSEPing => ({ type: "ping" })),
);

class Player implements PlayerIOWithError {
  private readonly completeSubject = new Subject<void>();

  private readonly notificationSseSource =
    new BehaviorSubject<SSEPayload | null>(null);
  public notificationSse$: Observable<SSEPayload> =
    this.notificationSseSource.pipe(
      filter((data): data is SSEPayload => data !== null),
      startWith<SSEPayload>({ type: "waiting" }),
      mergeWith(pingInterval),
      takeUntil(this.completeSubject),
    );
  private readonly rpcSseSource = new Subject<SSERpc>();
  public rpcSse$: Observable<SSEPayload> = concat(
    defer((): Observable<SSEPayload> => {
      const currentAction = this.currentAction();
      if (currentAction === null) {
        return of({ type: "waiting" });
      } else {
        return of(currentAction);
      }
    }),
    this.rpcSseSource,
  ).pipe(
    mergeWith(
      pingInterval.pipe(map((payload) => this.currentAction() ?? payload)),
    ),
    takeUntil(this.completeSubject),
  );
  constructor(public readonly playerInfo: PlayerInfo) {}

  private _nextRpcId = 0;
  private _rpcResolver: RpcResolver | null = null;
  private _timeoutConfig: RoomConfig | null = null;
  private _roundTimeout = Infinity;
  private _mutationExtraTimeout = 0;

  setTimeoutConfig(config: RoomConfig) {
    this._timeoutConfig = config;
    this._roundTimeout = this._timeoutConfig?.initTotalActionTime ?? Infinity;
  }
  resetRoundTimeout() {
    this._roundTimeout = this._timeoutConfig?.roundTotalActionTime ?? Infinity;
  }
  currentAction(): SSERpc | null {
    if (this._rpcResolver) {
      return {
        type: "rpc",
        id: this._rpcResolver.id,
        timeout: this._rpcResolver.timeout,
        request: this._rpcResolver.request,
      };
    } else {
      return null;
    }
  }

  receiveResponse(response: PlayerActionResponseDto) {
    if (!this._rpcResolver) {
      throw new NotFoundException(`No rpc now`);
    } else if (this._rpcResolver.id !== response.id) {
      console.error(this._rpcResolver, response);
      throw new NotFoundException(`Rpc id not match`);
    }
    this._rpcResolver.resolve(response.response);
  }

  notify(notification: Notification) {
    this.notificationSseSource.next({
      type: "notification",
      data: notification,
    });
    this._mutationExtraTimeout += 0.5 * notification.mutation.length;
  }

  private timeoutRpc(request: RpcRequest): Promise<RpcResponse> {
    return dispatchRpc({
      action: async ({ action }) => {
        const declareEndIdx = action.findIndex(
          (c) => c.action?.$case === "declareEnd",
        );
        return {
          chosenActionIndex: declareEndIdx,
          usedDice: [],
        };
      },
      chooseActive: async ({ candidateIds }) => ({
        activeCharacterId: candidateIds[0]!,
      }),
      rerollDice: async () => ({
        diceToReroll: [],
      }),
      switchHands: async () => ({
        removedHandIds: [],
      }),
      selectCard: async ({ candidateDefinitionIds }) => ({
        selectedDefinitionId: candidateDefinitionIds[0]!,
      }),
    })(request);
  }

  async rpc(request: RpcRequest): Promise<RpcResponse> {
    const id = this._nextRpcId++;
    // 当前回合剩余时间
    const roundTimeout = this._roundTimeout;
    // 本行动可用时间
    let timeout = Math.ceil(this._mutationExtraTimeout);
    // 行动结束后，计算新的回合剩余时间
    let setRoundTimeout: (remained: number) => void;
    if (request.request?.$case === "rerollDice") {
      timeout += this._timeoutConfig?.rerollTime ?? Infinity;
      setRoundTimeout = () => {
        this._mutationExtraTimeout = 0;
      };
    } else {
      timeout += roundTimeout + (this._timeoutConfig?.actionTime ?? Infinity);
      setRoundTimeout = (remain) => {
        this._roundTimeout = Math.min(roundTimeout, remain + 1);
        this._mutationExtraTimeout = 0;
      };
    }
    const payload: SSERpc = { type: "rpc", id, timeout, request };
    this.rpcSseSource.next(payload);
    return new Promise<RpcResponse>((resolve) => {
      const resolver: RpcResolver = {
        id,
        request,
        timeout,
        resolve: (r) => {
          clearInterval(interval);
          setRoundTimeout(resolver.timeout);
          this._rpcResolver = null;
          resolve(r);
        },
      };
      this._rpcResolver = resolver;
      const interval = setInterval(() => {
        resolver.timeout--;
        if (resolver.timeout <= -2) {
          clearInterval(interval);
          setRoundTimeout(0);
          this._rpcResolver = null;
          resolve(this.timeoutRpc(request));
        }
      }, 1000);
    });
  }

  onError(e: GiTcgError) {
    this.notificationSseSource.next({ type: "error", message: e.message });
  }
  onInitialized(who: 0 | 1, opp: PlayerInfo) {
    const initializePayload: SSEPayload = {
      type: "initialized",
      who,
      config: this._timeoutConfig,
      myPlayerInfo: this.playerInfo,
      oppPlayerInfo: opp,
    };
    this.notificationSseSource.next(initializePayload);
    this.notificationSse$ = this.notificationSseSource.pipe(
      filter((data): data is SSEPayload => data !== null),
      startWith(initializePayload),
    );
  }
  complete() {
    this.completeSubject.next();
  }
}

type GameStopHandler = (room: Room, game: InternalGame | null) => void;

interface RoomInfo {
  id: number;
  config: RoomConfig;
  started: boolean;
  watchable: boolean;
  players: PlayerInfo[];
}

class Room {
  public static readonly CORE_VERSION = CORE_VERSION;
  private game: InternalGame | null = null;
  private hostWho: 0 | 1;
  public readonly config: RoomConfig;
  private host: Player | null = null;
  private participant: Player | null = null;
  private stateLog: GameStateLogEntry[] = [];
  private terminated = false;
  private onStopHandlers: GameStopHandler[] = [];

  constructor(
    public readonly id: number,
    createRoomConfig: CreateRoomConfig,
  ) {
    const { hostWho, ...config } = createRoomConfig;
    this.hostWho = hostWho;
    this.config = config;
  }
  getHost() {
    return this.host;
  }
  getParticipant() {
    return this.participant;
  }
  private get players(): [Player | null, Player | null] {
    return this.hostWho === 0
      ? [this.host, this.participant]
      : [this.participant, this.host];
  }
  getPlayer(who: 0 | 1): Player | null {
    return this.players[who];
  }
  getPlayers(): Player[] {
    return this.players.filter((player): player is Player => player !== null);
  }
  get started() {
    return this.game !== null;
  }

  setHost(player: Player) {
    if (this.host !== null) {
      throw new ConflictException("host already set");
    }
    this.host = player;
    return this.hostWho;
  }
  setParticipant(player: Player) {
    if (this.participant !== null) {
      throw new ConflictException("participant already set");
    }
    this.participant = player;
    return flip(this.hostWho);
  }
  start() {
    if (this.terminated) {
      throw new ConflictException("room terminated");
    }
    const [player0, player1] = this.players;
    if (player0 === null || player1 === null) {
      throw new ConflictException("player not ready");
    }
    player0.setTimeoutConfig(this.config);
    player1.setTimeoutConfig(this.config);
    const state = InternalGame.createInitialState({
      decks: [player0.playerInfo.deck, player1.playerInfo.deck],
      data: getData(this.config.gameVersion),
    });
    const game = new InternalGame(state);
    game.onPause = async (state, mutations, canResume) => {
      this.stateLog.push({ state, canResume });
      for (const mut of mutations) {
        if (mut.type === "changePhase" && mut.newPhase === "roll") {
          player0.resetRoundTimeout();
          player1.resetRoundTimeout();
        }
      }
    };
    game.onIoError = (e) => {
      player0.onError(e);
      player1.onError(e);
    };
    game.players[0].io = player0;
    game.players[1].io = player1;
    player0.onInitialized(0, player1.playerInfo);
    player1.onInitialized(1, player0.playerInfo);
    (async () => {
      try {
        this.game = game;
        await game.start();
      } catch (e) {
        if (e instanceof GiTcgError) {
          player0.onError(e);
          player1.onError(e);
        } else {
          throw e;
        }
      } finally {
        this.stop();
      }
    })();
  }

  giveUp(userId: PlayerId) {
    if (this.players[0]?.playerInfo.id === userId) {
      this.game?.giveUp(0);
    } else if (this.players[1]?.playerInfo.id === userId) {
      this.game?.giveUp(1);
    } else {
      throw new NotFoundException(`Player ${userId} not found`);
    }
  }

  stop() {
    this.players[0]?.complete();
    this.players[1]?.complete();
    for (const cb of this.onStopHandlers) {
      cb(this, this.game);
    }
  }

  onStop(cb: GameStopHandler) {
    this.onStopHandlers.push(cb);
  }

  getStateLog() {
    return serializeGameStateLog(this.stateLog);
  }

  getRoomInfo(): RoomInfo {
    return {
      id: this.id,
      config: this.config,
      started: this.started,
      watchable: this.config.watchable,
      players: this.getPlayers().map((player) => player.playerInfo),
    };
  }
}

function toShuffled<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i]!, result[j]!] = [result[j]!, result[i]!];
  }
  return result;
}

@Injectable()
export class RoomsService {
  private logger = new Logger(RoomsService.name);

  private roomIdPool = toShuffled(Array.from({ length: 10000 }, (_, i) => i));
  private rooms = new Map<number, Room>();
  private shutdownResolvers: PromiseWithResolvers<void> | null = null;

  constructor(
    private users: UsersService,
    private decks: DecksService,
    private games: GamesService,
  ) {
    const onShutdown = async () => {
      console.log(`Waiting for ${this.rooms.size} rooms to stop...`);
      if (!this.shutdownResolvers && this.rooms.size !== 0) {
        this.shutdownResolvers = Promise.withResolvers();
      }
      await this.shutdownResolvers?.promise;
      process.exit();
    };
    process.on("SIGINT", onShutdown);
    process.on("SIGTERM", onShutdown);
    process.on("SIGQUIT", onShutdown);
  }

  currentRoom(playerId: PlayerId) {
    for (const room of this.rooms.values()) {
      if (
        room.getPlayers().some((player) => player.playerInfo.id === playerId)
      ) {
        return room.getRoomInfo();
      }
    }
    return null;
  }

  async createRoomFromUser(userId: number, params: UserCreateRoomDto) {
    const user = await this.users.findById(userId);
    if (user === null) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    if (this.currentRoom(userId) !== null) {
      throw new ConflictException(`User ${userId} is already in a room`);
    }
    const deck = await this.decks.getDeck(userId, params.hostDeckId);
    if (deck === null) {
      throw new NotFoundException(`Deck ${params.hostDeckId} not found`);
    }
    const playerInfo: PlayerInfo = {
      isGuest: false,
      id: userId,
      name: user.name ?? user.login,
      deck,
    };
    const room = await this.createRoom(playerInfo, params);
    return { room };
  }

  async createRoomFromGuest(params: GuestCreateRoomDto) {
    const playerId = createGuestId();
    const playerInfo: PlayerInfo = {
      isGuest: true,
      id: playerId,
      name: params.name,
      deck: params.deck,
    };
    const room = await this.createRoom(playerInfo, params);
    return {
      playerId,
      room,
    };
  }

  private async createRoom(playerInfo: PlayerInfo, params: CreateRoomDto) {
    if (this.shutdownResolvers) {
      throw new ConflictException(
        "Creating room is disabled now; we are planning a maintenance",
      );
    }

    const hostWho =
      typeof params.hostFirst === "undefined"
        ? Math.random() > 0.5
          ? 0
          : 1
        : params.hostFirst
          ? 0
          : 1;

    const roomConfig: CreateRoomConfig = {
      hostWho,
      randomSeed: params.randomSeed,
      gameVersion: params.gameVersion
        ? VERSIONS[params.gameVersion]!
        : CURRENT_VERSION,
      initTotalActionTime: params.initTotalActionTime ?? 45,
      rerollTime: params.rerollTime ?? 40,
      roundTotalActionTime: params.roundTotalActionTime ?? 60,
      actionTime: params.actionTime ?? 25,
      watchable: params.watchable ?? false,
      private: params.private ?? false,
      allowGuest: params.allowGuest ?? true,
    };

    try {
      const version = verifyDeck(playerInfo.deck);
      if (semver.order(version, roomConfig.gameVersion) > 0) {
        throw new BadRequestException(
          `Deck version required ${version}, it's higher game version ${roomConfig.gameVersion}`,
        );
      }
    } catch (e) {
      if (e instanceof DeckVerificationError) {
        throw new BadRequestException(`Deck verification failed: ${e.message}`);
      } else {
        throw e;
      }
    }

    const roomId = this.roomIdPool[0];
    if (typeof roomId === "undefined") {
      throw new InternalServerErrorException("no room available");
    }
    const room = new Room(roomId, roomConfig);
    this.rooms.set(roomId, room);
    this.roomIdPool.shift();

    room.onStop(() => {
      this.rooms.delete(room.id);
      this.roomIdPool.push(room.id);
      if (this.rooms.size === 0) {
        this.shutdownResolvers?.resolve();
      }
    });

    room.setHost(new Player(playerInfo));
    // 闲置五分钟后删除房间
    setTimeout(
      () => {
        if (!room.started) {
          room.stop();
        }
      },
      5 * 60 * 1000,
    );
    return room.getRoomInfo();
  }

  deleteRoom(playerId: PlayerId, roomId: number) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }
    if (room.started) {
      throw new ConflictException(`Room ${roomId} already started`);
    }
    if (room.getHost()?.playerInfo.id !== playerId) {
      throw new UnauthorizedException(`You are not the host of room ${roomId}`);
    }
    room.stop();
  }

  async joinRoomFromUser(userId: number, roomId: number, deckId: number) {
    const user = await this.users.findById(userId);
    if (user === null) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    const deck = await this.decks.getDeck(userId, deckId);
    if (deck === null) {
      throw new NotFoundException(`Deck ${deckId} not found`);
    }
    const playerInfo: PlayerInfo = {
      isGuest: false,
      id: userId,
      name: user.name ?? user.login,
      deck,
    };
    return this.joinRoom(playerInfo, roomId);
  }

  async joinRoomFromGuest(roomId: number, params: GuestJoinRoomDto) {
    const playerId = createGuestId();
    const playerInfo: PlayerInfo = {
      isGuest: true,
      id: playerId,
      name: params.name,
      deck: params.deck,
    };
    await this.joinRoom(playerInfo, roomId);
    return { playerId };
  }

  private async joinRoom(playerInfo: PlayerInfo, roomId: number) {
    const allRooms = this.getAllRooms(true);
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }
    if (room.started) {
      throw new ConflictException(`Room ${roomId} already started`);
    }
    if (playerInfo.isGuest && !room.config.allowGuest) {
      throw new UnauthorizedException(`Room ${roomId} does not allow guest`);
    }
    if (
      allRooms.some((room) => room.players.some((p) => p.id === playerInfo.id))
    ) {
      throw new ConflictException(
        `Player ${playerInfo.id} is already in a room`,
      );
    }

    try {
      const version = verifyDeck(playerInfo.deck);
      if (semver.order(version, room.config.gameVersion) > 0) {
        throw new BadRequestException(
          `Deck version required ${version}, it's higher game version ${room.config.gameVersion}`,
        );
      }
    } catch (e) {
      if (e instanceof DeckVerificationError) {
        throw new BadRequestException(`Deck verification failed: ${e.message}`);
      } else {
        throw e;
      }
    }

    room.setParticipant(new Player(playerInfo));
    // Add to game database when room stopped
    room.onStop((room, game) => {
      if (!game) {
        return;
      }
      const players = room.getPlayers();
      if (players.some((p) => p.playerInfo.isGuest)) {
        return;
      }
      const playerIds = players.map(
        (player) => player.playerInfo.id,
      ) as number[];
      const winnerWho = game.state.winner;
      const winnerId = winnerWho === null ? null : playerIds[winnerWho]!;
      this.games.addGame({
        coreVersion: Room.CORE_VERSION,
        gameVersion: game.gameVersion,
        data: JSON.stringify(room.getStateLog()),
        winnerId,
        playerIds,
      });
    });
    room.start();
  }

  getRoom(roomId: number): RoomInfo {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new NotFoundException(`Room not found`);
    }
    return room.getRoomInfo();
  }

  getAllRooms(guest: boolean): RoomInfo[] {
    const result: RoomInfo[] = [];
    for (const room of this.rooms.values()) {
      if (room.config.private) {
        continue;
      }
      if (guest && !room.config.allowGuest) {
        continue;
      }
      result.push(room.getRoomInfo());
    }
    return result;
  }

  playerNotification(
    roomId: number,
    visitorPlayerId: PlayerId | null,
    watchingPlayerId: PlayerId,
  ): Observable<{ data: SSEPayload }> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new NotFoundException(`Room not found`);
    }
    const players = room.getPlayers();
    const playerUserIds = players.map((player) => player.playerInfo.id);
    if (!playerUserIds.includes(watchingPlayerId)) {
      throw new NotFoundException(`Player ${watchingPlayerId} not in room`);
    }
    if (!room.config.watchable && visitorPlayerId !== watchingPlayerId) {
      throw new UnauthorizedException(
        `Room ${roomId} cannot be watched by other`,
      );
    }
    if (
      (playerUserIds as (PlayerId | null)[]).includes(visitorPlayerId) &&
      visitorPlayerId !== watchingPlayerId
    ) {
      throw new UnauthorizedException(
        `You cannot watch ${watchingPlayerId}, he is your opponent!`,
      );
    }
    for (const player of players) {
      if (player.playerInfo.id === watchingPlayerId) {
        const observable = player.notificationSse$;
        return observable.pipe(map((data) => ({ data })));
      }
    }
    throw new InternalServerErrorException("unreachable");
  }

  playerAction(
    roomId: number,
    playerId: PlayerId,
  ): Observable<{ data: SSEPayload }> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new NotFoundException(`Room not found`);
    }
    const players = room.getPlayers();
    for (const player of players) {
      if (player.playerInfo.id === playerId) {
        return player.rpcSse$.pipe(map((data) => ({ data })));
      }
    }
    throw new NotFoundException(`Player ${playerId} not in room`);
  }

  receivePlayerResponse(
    roomId: number,
    playerId: PlayerId,
    response: PlayerActionResponseDto,
  ) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new NotFoundException(`Room not found`);
    }
    const players = room.getPlayers();
    for (const player of players) {
      if (player.playerInfo.id === playerId) {
        player.receiveResponse(response);
        return;
      }
    }
    throw new NotFoundException(`Player ${playerId} not in room`);
  }

  receivePlayerGiveUp(roomId: number, playerId: PlayerId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new NotFoundException(`Room not found`);
    }
    room.giveUp(playerId);
  }
}
