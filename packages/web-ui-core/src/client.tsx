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
  type RpcMethod,
  type PbGameState,
  type PbPlayerState,
  type RpcDispatcher,
  SwitchHandsResponse,
  SelectCardResponse,
  RerollDiceResponse,
  PbPhaseType,
} from "@gi-tcg/typings";
import { createSignal, type ComponentProps, type JSX } from "solid-js";
import {
  Chessboard,
  type ChessboardViewType,
  type ChessboardData,
  type StepActionStateHandler,
} from "./components/Chessboard";
import type {
  ChooseActiveResponse,
  PbDiceType,
  PlayerIO,
  RpcResponsePayloadOf,
} from "@gi-tcg/core";
import { AsyncQueue } from "./async_queue";
import { parseMutations } from "./mutations";
import { UiContext } from "./hooks/context";
import {
  createActionState,
  createChooseActiveState,
  type ActionState,
} from "./action";
import { AssetsManager, DEFAULT_ASSETS_MANAGER } from "@gi-tcg/assets-manager";

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

export const EMPTY_GAME_STATE: PbGameState = {
  currentTurn: 0,
  phase: PbPhaseType.INIT_HANDS,
  roundNumber: 0,
  player: [EMPTY_PLAYER_DATA, EMPTY_PLAYER_DATA],
};

export interface ClientOption {
  onGiveUp?: () => void;
  rpc?: Partial<RpcDispatcher>;
  assetsManager?: AssetsManager;
  disableDelicateUi?: boolean;
}

export interface PlayerIOWithCancellation extends PlayerIO {
  cancelRpc: () => void;
}

export type Client = [
  io: PlayerIOWithCancellation,
  Chessboard: (props: ComponentProps<"div">) => JSX.Element,
];

export function createClient(who: 0 | 1, option: ClientOption = {}): Client {
  const assetsManager = option.assetsManager ?? DEFAULT_ASSETS_MANAGER;
  const [data, setData] = createSignal<ChessboardData>({
    raw: [],
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
  const [viewType, setViewType] = createSignal<ChessboardViewType>("normal");
  const [selectCardCandidates, setSelectCardCandidates] = createSignal<
    number[]
  >([]);

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
    chooseActive: async ({ candidateIds }) => {
      const resolver = Promise.withResolvers<ChooseActiveResponse>();
      actionResolvers.chooseActive = resolver;
      const acState = createChooseActiveState(candidateIds);
      setActionState(acState);
      const response = await resolver.promise;
      setActionState(null);
      return response;
    },
    action: async ({ action }) => {
      const resolver = Promise.withResolvers<ActionResponse>();
      actionResolvers.action = resolver;
      const acState = createActionState(assetsManager, action);
      setActionState(acState);
      const response = await resolver.promise;
      setActionState(null);
      return response;
    },
    switchHands: async () => {
      const resolver = Promise.withResolvers<SwitchHandsResponse>();
      actionResolvers.switchHands = resolver;
      // return { removedHandIds: [] };
      setViewType("switchHands");
      const result = await resolver.promise;
      if (result.removedHandIds.length > 0) {
        setViewType("switchHandsEnd");
        setTimeout(() => {
          setViewType("normal");
          forceRefreshData();
        }, 1200);
      } else {
        setViewType("normal");
      }
      return result;
    },
    selectCard: async ({ candidateDefinitionIds }) => {
      const resolver = Promise.withResolvers<SelectCardResponse>();
      actionResolvers.selectCard = resolver;
      setSelectCardCandidates(candidateDefinitionIds);
      setViewType("selectCard");
      const result = await resolver.promise;
      setViewType("normal");
      return result;
    },
    rerollDice: async () => {
      const response = await uiQueue.push(async () => {
        const resolver = Promise.withResolvers<RerollDiceResponse>();
        actionResolvers.rerollDice = resolver;
        setViewType("rerollDice");
        const result = await resolver.promise;
        setViewType("rerollDiceEnd");
        setTimeout(
          () => setViewType((t) => (t === "rerollDiceEnd" ? "normal" : t)),
          500,
        );
        return result;
      });
      return response;
    },
  };

  const forceRefreshData = () => {
    if (!savedState) {
      return;
    }
    const parsed = parseMutations([]);
    setData({
      previousState: savedState,
      state: savedState,
      ...parsed,
    } satisfies ChessboardData);
  };

  const cancelRpc = () => {
    actionResolvers.action?.reject();
    actionResolvers.chooseActive?.reject();
    actionResolvers.rerollDice?.reject();
    actionResolvers.selectCard?.reject();
    actionResolvers.switchHands?.reject();
  };

  const io: PlayerIOWithCancellation = {
    cancelRpc,
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
        setActionState(null);
        break;
      }
      case "chooseActiveCommitted": {
        actionResolvers.chooseActive?.resolve(result);
        setActionState(null);
        break;
      }
    }
  };

  const onRerollDice = (diceToReroll: PbDiceType[]) => {
    actionResolvers.rerollDice?.resolve({ diceToReroll });
  };
  const onSwitchHands = (removedHandIds: number[]) => {
    actionResolvers.switchHands?.resolve({ removedHandIds });
  };
  const onSelectCard = (selectedDefinitionId: number) => {
    actionResolvers.selectCard?.resolve({ selectedDefinitionId });
  };

  const onGiveUp = () => {
    cancelRpc();
    option.onGiveUp?.();
  };

  const Wrapper = (props: ComponentProps<"div">) => (
    <UiContext.Provider
      value={{
        ...option,
        assetsManager,
      }}
    >
      <Chessboard
        who={who}
        data={data()}
        actionState={actionState()}
        viewType={viewType()}
        selectCardCandidates={selectCardCandidates()}
        onStepActionState={onStepActionState}
        onRerollDice={onRerollDice}
        onSwitchHands={onSwitchHands}
        onSelectCard={onSelectCard}
        onGiveUp={onGiveUp}
        {...props}
      />
    </UiContext.Provider>
  );

  return [io, Wrapper];
}
