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
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { checkDice, Deck, diceToMap, flip } from "@gi-tcg/utils";
import {
  DiceType,
  ExposedMutation,
  RpcMethod,
  RpcRequest,
  RpcResponse,
  DiceRequirement,
  PbActionType,
} from "@gi-tcg/typings";
import {
  AnyState,
  CardState,
  CharacterState,
  ExtensionState,
  GameConfig,
  GameState,
  PlayerState,
} from "./base/state";
import { Mutation } from "./base/mutation";
import {
  IoErrorHandler,
  PauseHandler,
  exposeAction,
  exposeMutation,
  exposeState,
  verifyRpcResponse,
} from "./io";
import {
  elementOfCharacter,
  getActiveCharacterIndex,
  findReplaceAction,
  shuffle,
  sortDice,
  isSkillDisabled,
  initiativeSkillsOfPlayer,
  getEntityArea,
  playSkillOfCard,
  Writable,
} from "./utils";
import { GameData } from "./builder/registry";
import {
  ActionEventArg,
  ActionInfo,
  DisposeOrTuneCardEventArg,
  HandCardInsertedEventArg,
  ElementalTuningInfo,
  EventAndRequest,
  EventArg,
  ModifyRollEventArg,
  PlayCardEventArg,
  PlayerEventArg,
  SkillInfo,
  SwitchActiveEventArg,
  SwitchActiveInfo,
  UseSkillEventArg,
  InitiativeSkillEventArg,
  defineSkillInfo,
} from "./base/skill";
import { CardDefinition } from "./base/card";
import { executeQueryOnState } from "./query";
import {
  GiTcgCoreInternalError,
  GiTcgDataError,
  GiTcgError,
  GiTcgIoError,
} from "./error";
import { DetailLogType, DetailLogger } from "./log";
import { randomSeed } from "./random";
import { GeneralSkillArg, SkillExecutor } from "./skill_executor";
import {
  InternalNotifyOption,
  InternalPauseOption,
  MutatorConfig,
  StateMutator,
} from "./mutator";
import { ActionInfoWithModification, ActionPreviewer } from "./preview";
import { Version } from "./base/version";
import { Player } from "./player";
import { CharacterDefinition } from "./base/character";

export interface DeckConfig extends Deck {
  noShuffle?: boolean;
}

/** A helper class to iterate id when constructing initial state */
class IdIter {
  static readonly INITIAL_ID = -500000;
  #id = IdIter.INITIAL_ID;
  get id() {
    return this.#id--;
  }
}

/** 根据 deck 初始化玩家状态 */
function initPlayerState(
  data: GameData,
  deck: DeckConfig,
  idIter: IdIter,
): PlayerState {
  let initialPile: readonly CardDefinition[] = deck.cards.map((id) => {
    const def = data.cards.get(id);
    if (typeof def === "undefined") {
      throw new GiTcgDataError(`Unknown card id ${id}`);
    }
    return def;
  });
  const characterDefs: readonly CharacterDefinition[] = deck.characters.map(
    (id) => {
      const def = data.characters.get(id);
      if (typeof def === "undefined") {
        throw new GiTcgDataError(`Unknown character id ${id}`);
      }
      return def;
    },
  );
  if (!deck.noShuffle) {
    initialPile = shuffle(initialPile);
  }
  // 将秘传牌放在最前面
  const compFn = (def: CardDefinition) => {
    if (def.tags.includes("legend")) {
      return 0;
    } else {
      return 1;
    }
  };
  initialPile = initialPile.toSortedBy(compFn);
  const characters: CharacterState[] = [];
  const pile: CardState[] = [];
  for (const definition of characterDefs) {
    characters.push({
      id: idIter.id,
      definition,
      variables: Object.fromEntries(
        Object.entries(definition.varConfigs).map(
          ([name, { initialValue }]) => [name, initialValue],
        ),
      ) as any,
      entities: [],
    });
  }
  for (const definition of initialPile) {
    pile.push({
      id: idIter.id,
      definition,
      variables: {},
    });
  }
  return {
    activeCharacterId: 0,
    characters,
    initialPile,
    pile,
    hands: [],
    dice: [],
    combatStatuses: [],
    summons: [],
    supports: [],
    declaredEnd: false,
    canCharged: false,
    canPlunging: false,
    hasDefeated: false,
    legendUsed: false,
    skipNextTurn: false,
    roundSkillLog: new Map(),
    removedEntities: [],
  };
}

export interface CreateInitialStateConfig
  extends Writable<Partial<GameConfig>> {
  decks: readonly [DeckConfig, DeckConfig];
  data: GameData;
}

const VOID_1_DICE_REQUIREMENT: DiceRequirement = new Map([[DiceType.Void, 1]]);
const EMPTY_DICE_REQUIREMENT: DiceRequirement = new Map();

export class Game {
  private readonly logger: DetailLogger;

  private _terminated = false;
  private finishResolvers: PromiseWithResolvers<0 | 1 | null> | null = null;

  private readonly mutator: StateMutator;
  private readonly mutatorConfig: MutatorConfig;
  readonly players: readonly [Player, Player];

  public onPause: PauseHandler | null = null;
  public onIoError: IoErrorHandler | null = null;

  constructor(initialState: GameState) {
    this.logger = new DetailLogger();
    this.mutatorConfig = {
      logger: this.logger,
      onNotify: (opt) => this.mutatorNotifyHandler(opt),
      onPause: (opt) => this.mutatorPauseHandler(opt),
      howToChooseActive: (who, chs) => this.rpcChooseActive(who, chs),
      howToReroll: (who) => this.rpcReroll(who),
      howToSwitchHands: (who) => this.rpcSwitchHands(who),
      howToSelectCard: (who, cards) => this.rpcSelectCard(who, cards),
    };
    this.mutator = new StateMutator(initialState, this.mutatorConfig);
    this.players = [new Player(), new Player()];
    // this.initPlayerCards(0);
    // this.initPlayerCards(1);
  }

  static createInitialState(opt: CreateInitialStateConfig): GameState {
    const { decks, data, ...partialConfig } = opt;
    const extensions = data.extensions
      .values()
      .map<ExtensionState>((v) => ({
        definition: v,
        state: v.initialState,
      }))
      .toArray();
    const config = mergeGameConfigWithDefault(partialConfig);
    const idIter = new IdIter();
    const state: GameState = {
      data,
      config,
      players: [
        initPlayerState(data, decks[0], idIter),
        initPlayerState(data, decks[1], idIter),
      ],
      iterators: {
        random: config.randomSeed,
        id: idIter.id,
      },
      phase: "initHands",
      currentTurn: 0,
      roundNumber: 0,
      winner: null,
      extensions,
    };
    return state;
  }

  get config() {
    return this.state.config;
  }

  get gameVersion(): Version {
    return this.state.data.version;
  }

  get detailLog() {
    return this.logger.getLogs();
  }

  get state() {
    return this.mutator.state;
  }

  mutate(mutation: Mutation) {
    if (!this._terminated) {
      this.mutator.mutate(mutation);
    }
  }

  query(who: 0 | 1, query: string): AnyState[] {
    return executeQueryOnState(this.state, who, query);
  }

  // private lastNotifiedState: [string, string] = ["", ""];
  private notifyOneImpl(who: 0 | 1, opt: InternalNotifyOption) {
    const playerIo = this.players[who].io;
    const stateMutations = opt.stateMutations
      .map((m) => exposeMutation(who, m))
      .filter((em): em is ExposedMutation => !!em);
    const state = exposeState(who, opt.state);
    const mutation = [...stateMutations, ...opt.exposedMutations];
    // const newStateStr = JSON.stringify(newState);
    // if (mutations.length > 0 || newStateStr !== this.lastNotifiedState[who]) {
    playerIo.notify({ mutation, state });
    // this.lastNotifiedState[who] = newStateStr;
    // }
  }
  private notifyOne(who: 0 | 1, mutation?: ExposedMutation, state?: GameState) {
    this.notifyOneImpl(who, {
      state: state ?? this.state,
      canResume: false,
      stateMutations: [],
      exposedMutations: mutation ? [mutation] : [],
    });
  }

  private async mutatorNotifyHandler(opt: InternalNotifyOption) {
    if (this._terminated) {
      return;
    }
    for (const i of [0, 1] as const) {
      this.notifyOneImpl(i, opt);
    }
  }
  private async mutatorPauseHandler(opt: InternalPauseOption) {
    if (this._terminated) {
      return;
    }
    const { state, canResume, stateMutations } = opt;
    await this.onPause?.(state, [...stateMutations], canResume);
    if (state.phase === "gameEnd") {
      this.gotWinner(state.winner);
    }
  }

  async start(): Promise<0 | 1 | null> {
    if (this.finishResolvers !== null) {
      throw new GiTcgCoreInternalError(
        `Game already started. Please use a new Game instance instead of start multiple time.`,
      );
    }
    this.finishResolvers = Promise.withResolvers();
    this.logger.clearLogs();
    (async () => {
      try {
        await this.mutator.notifyAndPause({ force: true, canResume: true });
        while (!this._terminated) {
          switch (this.state.phase) {
            case "initHands":
              await this.initHands();
              break;
            case "initActives":
              await this.initActives();
              break;
            case "roll":
              await this.rollPhase();
              break;
            case "action":
              await this.actionPhase();
              break;
            case "end":
              await this.endPhase();
              break;
            default:
              break;
          }
          this.mutate({ type: "clearRemovedEntities" });
          await this.mutator.notifyAndPause({ canResume: true });
        }
      } catch (e) {
        if (e instanceof GiTcgIoError) {
          this.onIoError?.(e);
          await this.gotWinner(flip(e.who));
        } else if (e instanceof GiTcgError) {
          this.finishResolvers?.reject(e);
        } else {
          let message = String(e);
          if (e instanceof Error) {
            message = e.message;
            if (e.stack) {
              message += "\n" + e.stack;
            }
          }
          this.finishResolvers?.reject(
            new GiTcgCoreInternalError(`Unexpected error: ` + message),
          );
        }
      }
    })();
    return this.finishResolvers.promise;
  }

  giveUp(who: 0 | 1) {
    this.gotWinner(flip(who));
  }

  /** 胜负已定，切换到 gameEnd 阶段 */
  private async gotWinner(winner: 0 | 1 | null) {
    if (this.state.phase !== "gameEnd") {
      this.mutate({
        type: "changePhase",
        newPhase: "gameEnd",
      });
      if (winner !== null) {
        this.mutate({
          type: "setWinner",
          winner,
        });
      }
      await this.mutator.notifyAndPause();
    }
    this.finishResolvers?.resolve(winner);
    if (!this._terminated) {
      this._terminated = true;
      Object.freeze(this);
    }
  }
  /** 强制终止游戏，不再进行额外改动 */
  terminate() {
    this.finishResolvers?.reject(
      new GiTcgCoreInternalError("User call terminate."),
    );
    if (!this._terminated) {
      this._terminated = true;
      Object.freeze(this);
    }
  }

  private async rpc<M extends RpcMethod>(
    who: 0 | 1,
    method: M,
    request: RpcRequest[M],
  ): Promise<Required<RpcResponse>[M]> {
    if (this._terminated) {
      throw new GiTcgCoreInternalError(`Game has been terminated`);
    }
    try {
      const resp = await this.players[who].io.rpc({ [method]: request });
      if (!(method in resp)) {
        throw new GiTcgIoError(
          who,
          `Invalid response format: expect ${method} in response`,
        );
      }
      verifyRpcResponse(method, resp[method]);
      return resp[method];
    } catch (e) {
      if (e instanceof Error) {
        throw new GiTcgIoError(who, e.message, { cause: e?.cause });
      } else {
        throw new GiTcgIoError(who, String(e));
      }
    }
  }

  private async initHands() {
    using l = this.mutator.subLog(DetailLogType.Phase, `In initHands phase:`);
    for (let who of [0, 1] as const) {
      for (let i = 0; i < this.config.initialHandsCount; i++) {
        this.mutator.drawCard(who);
      }
    }
    await this.mutator.notifyAndPause();
    await Promise.all([
      this.mutator.switchHands(0),
      this.mutator.switchHands(1),
    ]);
    this.mutate({
      type: "changePhase",
      newPhase: "initActives",
    });
  }

  private async initActives() {
    using l = this.mutator.subLog(DetailLogType.Phase, `In initActive phase:`);
    const [a0, a1] = await Promise.all([
      this.mutator.chooseActive(0),
      this.mutator.chooseActive(1),
    ]);
    this.mutate({
      type: "switchActive",
      who: 0,
      value: a0,
    });
    this.mutate({
      type: "switchActive",
      who: 1,
      value: a1,
    });
    await this.handleEvent("onBattleBegin", new EventArg(this.state));
    this.mutate({
      type: "changePhase",
      newPhase: "roll",
    });
    this.mutate({
      type: "stepRound",
    });
  }

  private async rpcChooseActive(
    who: 0 | 1,
    candidateIds: number[],
  ): Promise<number> {
    const { activeCharacterId } = await this.rpc(who, "chooseActive", {
      candidateIds,
    });
    if (!candidateIds.includes(activeCharacterId)) {
      throw new GiTcgIoError(
        who,
        `Invalid active character id ${activeCharacterId}`,
      );
    }
    return activeCharacterId;
  }

  private async rollPhase() {
    using l = this.mutator.subLog(
      DetailLogType.Phase,
      `In roll phase (round ${this.state.roundNumber}):`,
    );
    // onRoll event
    interface RollParams {
      fixed: readonly DiceType[];
      count: number;
    }
    const rollParams: RollParams[] = [];
    for (const who of [0, 1] as const) {
      const rollModifier = new ModifyRollEventArg(this.state, who);
      await this.handleEvent("modifyRoll", rollModifier);
      rollParams.push({
        fixed: rollModifier._fixedDice,
        count: 1 + rollModifier._extraRerollCount,
      });
    }

    await Promise.all(
      ([0, 1] as const).map(async (who) => {
        const { fixed, count } = rollParams[who];
        const initDice = sortDice(this.state.players[who], [
          ...fixed,
          ...this.mutator.randomDice(
            Math.max(0, this.config.initialDiceCount - fixed.length),
            this.players[who].config.alwaysOmni,
          ),
        ]);
        this.mutate({
          type: "resetDice",
          who,
          value: initDice,
        });
        this.notifyOne(who);
        await this.mutator.reroll(who, count);
      }),
    );
    // Change to action phase:
    // - do `changePhase`
    // - clean `hasDefeated`
    // - clean `declaredEnd`
    // - emit event `actionPhase`
    this.mutate({
      type: "changePhase",
      newPhase: "action",
    });
    await this.handleEvent("onActionPhase", new EventArg(this.state));
  }
  private async actionPhase() {
    const who = this.state.currentTurn;
    // 使用 getter 防止状态变化后原有 player 过时的问题
    const player = () => this.state.players[who];
    const activeCh = () =>
      player().characters[getActiveCharacterIndex(player())];
    this.mutate({
      type: "setPlayerFlag",
      who,
      flagName: "canCharged",
      value: player().dice.length % 2 === 0,
    });
    let replaceAction: SkillInfo | null;
    if (player().declaredEnd) {
      this.mutate({
        type: "switchTurn",
      });
    } else if (player().skipNextTurn) {
      this.mutate({
        type: "setPlayerFlag",
        who,
        flagName: "skipNextTurn",
        value: false,
      });
      this.mutate({
        type: "switchTurn",
      });
    } else if (
      (replaceAction = findReplaceAction(activeCh())) &&
      !isSkillDisabled(activeCh())
    ) {
      using l = this.mutator.subLog(
        DetailLogType.Phase,
        `In action phase (round ${this.state.roundNumber}, turn ${this.state.currentTurn}) (replaced action):`,
      );
      await this.executeSkill(replaceAction, new EventArg(this.state));
      this.mutate({
        type: "switchTurn",
      });
    } else {
      using l = this.mutator.subLog(
        DetailLogType.Phase,
        `In action phase (round ${this.state.roundNumber}, turn ${this.state.currentTurn}):`,
      );
      await this.handleEvent(
        "onBeforeAction",
        new PlayerEventArg(this.state, who),
      );
      const actions = await this.availableActions();
      // TODO
      // this.notifyOne(flip(who), {
      //   type: "oppAction",
      // });
      const { chosenActionIndex, usedDice } = await this.rpc(who, "action", {
        action: actions.map(exposeAction),
      });
      if (chosenActionIndex < 0 || chosenActionIndex >= actions.length) {
        throw new GiTcgIoError(who, `User chosen index out of range`);
      }
      const actionInfo = actions[chosenActionIndex];
      await this.handleEvent("modifyAction0", actionInfo.eventArg);
      await this.handleEvent("modifyAction1", actionInfo.eventArg);
      await this.handleEvent("modifyAction2", actionInfo.eventArg);
      await this.handleEvent("modifyAction3", actionInfo.eventArg);

      // 检查骰子
      if (!checkDice(actionInfo.cost, usedDice as DiceType[])) {
        throw new GiTcgIoError(
          who,
          `Selected dice doesn't meet requirement:\nRequired: ${JSON.stringify(
            Object.fromEntries(actionInfo.cost.entries()),
          )}, selected: ${JSON.stringify(usedDice)}`,
        );
      }
      if (
        !this.players[who].config.allowTuningAnyDice &&
        actionInfo.type === "elementalTuning" &&
        (usedDice[0] === DiceType.Omni || usedDice[0] === actionInfo.result)
      ) {
        throw new GiTcgIoError(
          who,
          `Elemental tunning cannot use omni dice or active character's element`,
        );
      }
      // 消耗骰子
      const operatingDice = [...player().dice];
      for (const type of usedDice) {
        const idx = operatingDice.indexOf(type as DiceType);
        if (idx === -1) {
          throw new GiTcgIoError(
            who,
            `Selected dice ${type} doesn't found in player`,
          );
        }
        operatingDice.splice(idx, 1);
      }
      this.mutate({
        type: "resetDice",
        who,
        value: operatingDice,
      });
      // 消耗能量
      const requiredEnergy = actionInfo.cost.get(DiceType.Energy) ?? 0;
      const currentEnergy = activeCh().variables.energy;
      if (requiredEnergy > 0) {
        if (currentEnergy < requiredEnergy) {
          throw new GiTcgIoError(
            who,
            `Active character does not have enough energy`,
          );
        }
        this.mutate({
          type: "modifyEntityVar",
          state: activeCh(),
          varName: "energy",
          value: currentEnergy - requiredEnergy,
        });
      }

      switch (actionInfo.type) {
        case "useSkill": {
          this.mutator.notify({
            mutations: [
              {
                actionDone: {
                  who,
                  actionType: PbActionType.ACTION_PLAY_CARD,
                  characterOrCardId: actionInfo.skill.caller.id,
                  characterDefinitionId: actionInfo.skill.caller.definition.id,
                  skillOrCardDefinitionId: actionInfo.skill.definition.id,
                },
              },
            ],
          });
          const callerArea = getEntityArea(this.state, activeCh().id);
          await this.handleEvent(
            "onBeforeUseSkill",
            new UseSkillEventArg(this.state, callerArea, actionInfo.skill),
          );
          await this.executeSkill(actionInfo.skill, {
            targets: actionInfo.targets,
          });
          await this.handleEvent(
            "onUseSkill",
            new UseSkillEventArg(this.state, callerArea, actionInfo.skill),
          );
          break;
        }
        case "playCard": {
          const card = actionInfo.skill.caller;
          this.mutator.notify({
            mutations: [
              {
                actionDone: {
                  who,
                  actionType: PbActionType.ACTION_PLAY_CARD,
                  characterOrCardId: card.id,
                  skillOrCardDefinitionId: card.definition.id,
                },
              },
            ],
          });
          if (card.definition.tags.includes("legend")) {
            this.mutate({
              type: "setPlayerFlag",
              who,
              flagName: "legendUsed",
              value: true,
            });
          }
          await this.handleEvent(
            "onBeforePlayCard",
            new PlayCardEventArg(this.state, actionInfo),
          );
          // 应用“禁用事件牌”效果
          if (
            player().combatStatuses.find((st) =>
              st.definition.tags.includes("disableEvent"),
            ) &&
            card.definition.cardType === "event"
          ) {
            this.mutate({
              type: "removeCard",
              who,
              where: "hands",
              oldState: card,
              reason: "disabled",
            });
          } else {
            this.mutate({
              type: "removeCard",
              who,
              where: "hands",
              oldState: card,
              reason: "play",
            });
            await this.executeSkill(actionInfo.skill, {
              targets: actionInfo.targets,
            });
          }
          await this.handleEvent(
            "onPlayCard",
            new PlayCardEventArg(this.state, actionInfo),
          );
          break;
        }
        case "switchActive": {
          await this.switchActive(who, actionInfo.to);
          break;
        }
        case "elementalTuning": {
          const tuneCardEventArg = new DisposeOrTuneCardEventArg(
            this.state,
            actionInfo.card,
            "elementalTuning",
          );
          this.mutate({
            type: "removeCard",
            who,
            where: "hands",
            oldState: actionInfo.card,
            reason: "elementalTuning",
          });
          this.mutate({
            type: "resetDice",
            who,
            value: sortDice(player(), [
              ...player().dice,
              elementOfCharacter(activeCh().definition),
            ]),
          });
          await this.handleEvent("onDisposeOrTuneCard", tuneCardEventArg);
          break;
        }
        case "declareEnd": {
          this.mutator.notify({
            mutations: [
              {
                actionDone: {
                  who,
                  actionType: PbActionType.ACTION_DECLARE_END,
                },
              },
            ],
          });
          this.mutate({
            type: "setPlayerFlag",
            who,
            flagName: "declaredEnd",
            value: true,
          });
          break;
        }
      }
      await this.handleEvent(
        "onAction",
        new ActionEventArg(this.state, actionInfo),
      );
      if (!actionInfo.fast) {
        this.mutate({
          type: "switchTurn",
        });
      }
      this.mutate({
        type: "setPlayerFlag",
        who,
        flagName: "canPlunging",
        value: actionInfo.type === "switchActive",
      });
    }
    if (
      this.state.players[0].declaredEnd &&
      this.state.players[1].declaredEnd
    ) {
      this.mutate({
        type: "changePhase",
        newPhase: "end",
      });
    }
  }
  private async endPhase() {
    using l = this.mutator.subLog(
      DetailLogType.Phase,
      `In end phase (round ${this.state.roundNumber}, turn ${this.state.currentTurn}):`,
    );
    await this.handleEvent("onEndPhase", new EventArg(this.state));
    for (const who of [this.state.currentTurn, flip(this.state.currentTurn)]) {
      const cards: CardState[] = [];
      for (let i = 0; i < 2; i++) {
        const card = this.mutator.drawCard(who);
        if (card) {
          cards.push(card);
        }
      }
      for (const card of cards) {
        await this.handleEvent(
          "onHandCardInserted",
          new HandCardInsertedEventArg(this.state, who, card, "drawn"),
        );
      }
    }
    await this.handleEvent("onRoundEnd", new EventArg(this.state));
    this.mutate({
      type: "setPlayerFlag",
      who: 0,
      flagName: "hasDefeated",
      value: false,
    });
    this.mutate({
      type: "setPlayerFlag",
      who: 1,
      flagName: "hasDefeated",
      value: false,
    });
    this.mutate({
      type: "setPlayerFlag",
      who: 0,
      flagName: "declaredEnd",
      value: false,
    });
    this.mutate({
      type: "setPlayerFlag",
      who: 1,
      flagName: "declaredEnd",
      value: false,
    });
    this.mutate({
      type: "clearRoundSkillLog",
      who: 0,
    });
    this.mutate({
      type: "clearRoundSkillLog",
      who: 1,
    });
    this.mutate({
      type: "stepRound",
    });
    if (this.state.roundNumber >= this.config.maxRoundsCount) {
      this.gotWinner(null);
    } else {
      this.mutate({
        type: "changePhase",
        newPhase: "roll",
      });
    }
  }

  async availableActions(): Promise<ActionInfoWithModification[]> {
    const who = this.state.currentTurn;
    const player = this.state.players[who];
    const activeCh = player.characters[getActiveCharacterIndex(player)];
    const result: ActionInfo[] = [];

    // Skills
    if (isSkillDisabled(activeCh)) {
      // Use skill is disabled, skip
    } else {
      for (const { caller, skill } of initiativeSkillsOfPlayer(player)) {
        const skillType = skill.initiativeSkillConfig.skillType;
        const charged = skillType === "normal" && player.canCharged;
        const plunging =
          skillType === "normal" &&
          (player.canPlunging ||
            activeCh.entities.some((et) =>
              et.definition.tags.includes("normalAsPlunging"),
            ));
        const skillInfo = defineSkillInfo({
          caller,
          definition: skill,
          charged,
          plunging,
        });
        const allTargets = (0, skill.initiativeSkillConfig.getTarget)(
          this.state,
          skillInfo,
        );
        for (const arg of allTargets) {
          if (!(0, skill.filter)(this.state, skillInfo, arg)) {
            continue;
          }
          const actionInfo: ActionInfo = {
            type: "useSkill",
            who,
            skill: skillInfo,
            targets: arg.targets,
            fast: false,
            cost: skill.initiativeSkillConfig.requiredCost,
          };
          result.push(actionInfo);
        }
      }
    }

    // Cards
    for (const card of player.hands) {
      let allTargets: InitiativeSkillEventArg[];
      const skillDef = playSkillOfCard(card.definition);
      const skillInfo = defineSkillInfo({
        caller: card,
        definition: skillDef,
      });
      // 当支援区满时，卡牌目标为“要离场的支援牌”
      if (
        card.definition.cardType === "support" &&
        player.supports.length === this.state.config.maxSupportsCount
      ) {
        allTargets = player.supports.map((st) => ({ targets: [st] }));
      } else {
        allTargets = (0, skillDef.initiativeSkillConfig.getTarget)(
          this.state,
          skillInfo,
        );
      }
      for (const arg of allTargets) {
        if ((0, skillDef.filter)(this.state, skillInfo, arg)) {
          const actionInfo: ActionInfo = {
            type: "playCard",
            who,
            skill: skillInfo,
            targets: arg.targets,
            cost: skillDef.initiativeSkillConfig.requiredCost,
            fast: !card.definition.tags.includes("action"),
          };
          result.push(actionInfo);
        }
      }
    }

    // Switch Active
    result.push(
      ...player.characters
        .filter((ch) => ch.variables.alive && ch.id !== activeCh.id)
        .map<SwitchActiveInfo>((ch) => ({
          type: "switchActive",
          who,
          from: activeCh,
          to: ch,
          fromReaction: false,
        }))
        .map((s) => ({
          ...s,
          fast: false,
          cost: VOID_1_DICE_REQUIREMENT,
        })),
    );

    // Elemental Tuning
    const resultDiceType = elementOfCharacter(activeCh.definition);
    result.push(
      ...player.hands
        .filter((c) => !c.definition.tags.includes("noTuning"))
        .map<ElementalTuningInfo>((c) => ({
          type: "elementalTuning",
          card: c,
          who,
          result: resultDiceType,
        }))
        .map((s) => ({
          ...s,
          fast: true,
          cost: VOID_1_DICE_REQUIREMENT,
        })),
    );

    // Declare End
    result.push({
      type: "declareEnd",
      who,
      fast: false,
      cost: EMPTY_DICE_REQUIREMENT,
    });
    // Add preview and apply modifyAction
    const previewer = new ActionPreviewer(this.state, who);
    return await Promise.all(result.map((a) => previewer.modifyAndPreview(a)));
  }

  private async rpcSwitchHands(who: 0 | 1) {
    const { removedHandIds } = await this.rpc(who, "switchHands", {});
    return removedHandIds;
  }

  private async rpcReroll(who: 0 | 1) {
    const { diceToReroll } = await this.rpc(who, "rerollDice", {});
    return diceToReroll;
  }

  private async rpcSelectCard(who: 0 | 1, candidateDefinitionIds: number[]) {
    const { selectedDefinitionId } = await this.rpc(who, "selectCard", {
      candidateDefinitionIds,
    });
    if (!candidateDefinitionIds.includes(selectedDefinitionId)) {
      throw new GiTcgIoError(who, `Selected card not in candidates`);
    }
    return selectedDefinitionId;
  }

  private async switchActive(who: 0 | 1, to: CharacterState) {
    const player = this.state.players[who];
    const from = player.characters[getActiveCharacterIndex(player)];
    const oldState = this.state;
    this.mutate({
      type: "switchActive",
      who,
      value: to,
    });
    this.mutator.notify({
      mutations: [
        {
          switchActive: {
            who,
            characterId: to.id,
            characterDefinitionId: to.definition.id,
          },
        },
      ],
    });
    await this.handleEvent(
      "onSwitchActive",
      new SwitchActiveEventArg(oldState, {
        type: "switchActive",
        who,
        from,
        to,
        fromReaction: false,
      }),
    );
  }

  private async executeSkill(skillInfo: SkillInfo, arg: GeneralSkillArg) {
    await SkillExecutor.executeSkill(this.mutator, skillInfo, arg);
  }
  private async handleEvent(...args: EventAndRequest) {
    await SkillExecutor.handleEvent(this.mutator, ...args);
  }
}

export function mergeGameConfigWithDefault(
  config?: Partial<GameConfig>,
): GameConfig {
  config = JSON.parse(JSON.stringify(config ?? {}));
  return {
    initialDiceCount: 8,
    initialHandsCount: 5,
    maxDiceCount: 16,
    maxHandsCount: 10,
    maxRoundsCount: 15,
    maxSummonsCount: 4,
    maxSupportsCount: 4,
    randomSeed: randomSeed(),
    ...config,
  };
}
