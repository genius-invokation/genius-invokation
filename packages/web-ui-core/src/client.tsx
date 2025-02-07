// Copyright (C) 2025 Guyutongxue
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

import type {
  PbGameState,
  PbPlayerState,
  RpcDispatcher,
} from "@gi-tcg/typings";
import { batch, createSignal, type ComponentProps, type JSX } from "solid-js";
import {
  Chessboard,
  type AnimatingCardInfo,
  type ChessboardData,
  type DamageInfo,
  type NotificationBoxInfo,
  type ReactionInfo,
} from "./components/Chessboard";
import type { PlayerIO } from "@gi-tcg/core";
import { AsyncQueue } from "./async_queue";
import { parseMutations } from "./mutations";

const EMPTY_PLAYER_DATA: PbPlayerState = {
  activeCharacterId: 0,
  dice: [],
  pileCard: [],
  handCard: [],
  character: [],
  combatStatus: [],
  summon: [],
  support: [],
  initiativeSkill: [],
  declaredEnd: false,
  legendUsed: false,
};

const EMPTY_GAME_STATE: PbGameState = {
  currentTurn: 0,
  phase: 0 /* PbPhaseType.PHASE_INIT_HANDS */,
  roundNumber: 0,
  player: [EMPTY_PLAYER_DATA, EMPTY_PLAYER_DATA],
};

export interface ClientOption {
  onGiveUp?: () => void;
  rpc?: Partial<RpcDispatcher>;
  assetsApiEndpoint?: string;
}

export interface PlayerIOWithCancellation extends PlayerIO {
  cancelRpc: () => void;
}

export type Client = [
  io: PlayerIOWithCancellation,
  Chessboard: (props: ComponentProps<"div">) => JSX.Element,
];

export function createClient(who: 0 | 1): Client {
  const [data, setData] = createSignal<ChessboardData>({
    state: EMPTY_GAME_STATE,
    previousState: EMPTY_GAME_STATE,
    animatingCards: [],
    damages: [],
    notificationBox: [],
    reactions: [],
  });

  const uiQueue = new AsyncQueue();
  let savedState: PbGameState | undefined = void 0;

  const io: PlayerIOWithCancellation = {
    cancelRpc: () => {
      throw new Error();
    },
    notify: ({ mutation, state }) => {
      uiQueue.push(async () => {
        const parsed = parseMutations(mutation);
        const { promise, resolve } = Promise.withResolvers<void>();
        // console.log(parsed);
        setData({
          previousState: savedState!,
          state: state!,
          onAnimationFinish: resolve,
          ...parsed,
        } satisfies ChessboardData);
        savedState = state;
        await promise;
      });
    },
    rpc: () => {
      throw new Error();
    },
  };

  const Wrapper = (props: ComponentProps<"div">) => (
    <Chessboard who={/*@once*/ who} data={data()} class="h-0" {...props} />
  );

  return [io, Wrapper];
}
