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

import {
  ActionResponse,
  dispatchRpc,
  PbPlayerStatus,
  type RpcMethod,
  type PbGameState,
  type PbPlayerState,
  type RpcDispatcher,
} from "@gi-tcg/typings";
import { batch, createSignal, type ComponentProps, type JSX } from "solid-js";
import {
  Chessboard,
  type AnimatingCardInfo,
  type ChessboardData,
  type DamageInfo,
  type NotificationBoxInfo,
  type ReactionInfo,
  type StepActionStateHandler,
} from "./components/Chessboard";
import type { ChooseActiveResponse, PlayerIO, RpcResponsePayloadOf } from "@gi-tcg/core";
import { AsyncQueue } from "./async_queue";
import { parseMutations } from "./mutations";
import { UiContext } from "./hooks/context";
import { createActionState, createChooseActiveState, type ActionState } from "./action";

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
  assetsApiEndPoint?: string;
}

export interface PlayerIOWithCancellation extends PlayerIO {
  cancelRpc: () => void;
}

export type Client = [
  io: PlayerIOWithCancellation,
  Chessboard: (props: ComponentProps<"div">) => JSX.Element,
];

export function createClient(who: 0 | 1, option: ClientOption = {}): Client {
  const [data, setData] = createSignal<ChessboardData>({
    roundAndPhase: {
      showRound: false,
      who: null,
      value: null,
    },
    state: EMPTY_GAME_STATE,
    previousState: EMPTY_GAME_STATE,
    playerStatus: [null, null],
    animatingCards: [],
    playingCard: null,
    enteringEntities: [],
    disposingEntities: [],
    triggeringEntities: [],
    damages: [],
    notificationBox: null,
    reactions: [],
  });
  const [actionState, setActionState] = createSignal<ActionState | null>(null);

  const uiQueue = new AsyncQueue();
  let savedState: PbGameState | undefined = void 0;

  const actionResolvers: {
    [K in RpcMethod]: PromiseWithResolvers<RpcResponsePayloadOf<K>> | null;
  } = {
    selectCard: null,
    chooseActive: null,
    rerollDice: null,
    switchHands: null,
    action: null,
  };

  const dispatcher: RpcDispatcher = {
    selectCard: async ({ candidateDefinitionIds }) => ({
      selectedDefinitionId: candidateDefinitionIds[0],
    }),
    chooseActive: async ({ candidateIds }) => {
      const resolver = Promise.withResolvers<ChooseActiveResponse>();
      actionResolvers.chooseActive = resolver;
      const acState = createChooseActiveState(candidateIds);
      setActionState(acState);
      const response = await resolver.promise;
      setActionState(null);
      return response;
    },
    rerollDice: async () => ({
      diceToReroll: [],
    }),
    switchHands: async () => ({
      removedHandIds: [],
    }),
    action: async ({ action }) => {
      const resolver = Promise.withResolvers<ActionResponse>();
      actionResolvers.action = resolver;
      const acState = createActionState(action);
      setActionState(acState);
      const response = await resolver.promise;
      setActionState(null);
      return response;
    },
  };

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
    rpc: dispatchRpc(dispatcher),
  };

  const onStepActionState: StepActionStateHandler = (step, dice) => {
    const currentActionState = actionState();
    if (!currentActionState) {
      return;
    }
    const result = currentActionState.step(step, dice);
    switch (result.type) {
      case "newState": {
        setActionState(result.newState);
        break;
      }
      case "actionCommitted": {
        actionResolvers.action?.resolve(result);
        break;
      }
      case "chooseActiveCommitted": {
        actionResolvers.chooseActive?.resolve(result);
        break;
      }
    }
  };

  const Wrapper = (props: ComponentProps<"div">) => (
    <UiContext.Provider value={{ assetsApiEndPoint: option.assetsApiEndPoint }}>
      <Chessboard
        who={/*@once*/ who}
        data={data()}
        actionState={actionState()}
        onStepActionState={onStepActionState}
        class="h-0"
        {...props}
      />
    </UiContext.Provider>
  );

  return [io, Wrapper];
}
