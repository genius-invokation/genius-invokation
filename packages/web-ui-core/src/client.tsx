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
  PbPlayerStatus,
} from "@gi-tcg/typings";
import { createSignal, type ComponentProps, type JSX } from "solid-js";
import {
  Chessboard,
  type ChessboardViewType,
  type ChessboardData,
  type StepActionStateHandler,
  type Rotation,
  type RpcTimer,
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
import { updateHistory, type HistoryData } from "./history/parser";
import { createStore, produce } from "solid-js/store";

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
  status: PbPlayerStatus.UNSPECIFIED,
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
  disableAction?: boolean;
}

export interface PlayerIOWithCancellation extends PlayerIO {
  cancelRpc: () => void;
}

export type Client = [
  io: PlayerIOWithCancellation,
  Chessboard: (props: ClientChessboardProps) => JSX.Element,
];

export interface PlayerInfo {
  avatarUrl?: string;
  name?: string;
}

export interface ClientChessboardProps extends ComponentProps<"div"> {
  rotation?: Rotation;
  autoHeight?: boolean;
  timer?: RpcTimer | null;
  myPlayerInfo?: PlayerInfo;
  oppPlayerInfo?: PlayerInfo;
  gameEndExtra?: JSX.Element;
}

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
  const [doingRpc, setDoingRpc] = createSignal(false);
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
      try {
        return await resolver.promise;
      } finally {
        setActionState(null);
      }
    },
    action: async ({ action }) => {
      const resolver = Promise.withResolvers<ActionResponse>();
      actionResolvers.action = resolver;
      const acState = createActionState(assetsManager, action);
      setActionState(acState);
      try {
        return await resolver.promise;
      } finally {
        setActionState(null);
      }
    },
    switchHands: async () => {
      if (savedState && savedState.phase >= PbPhaseType.INIT_ACTIVES) {
        // 草与智慧：等待当前的 ui 动画渲染完成，但不阻塞后续 ui 更新
        await uiQueue.push(async () => {});
      }
      const resolver = Promise.withResolvers<SwitchHandsResponse>();
      actionResolvers.switchHands = resolver;
      // return { removedHandIds: [] };
      setViewType("switchHands");
      let result: SwitchHandsResponse | null = null;
      try {
        result = await resolver.promise;
        return result;
      } finally {
        if (result && result.removedHandIds.length > 0) {
          setViewType("switchHandsEnd");
          setTimeout(() => {
            setViewType((t) => (t === "switchHandsEnd" ? "normal" : t));
            forceRefreshData();
          }, 1200);
        } else {
          setViewType("normal");
        }
      }
    },
    selectCard: async ({ candidateDefinitionIds }) => {
      const resolver = Promise.withResolvers<SelectCardResponse>();
      actionResolvers.selectCard = resolver;
      setSelectCardCandidates(candidateDefinitionIds);
      setViewType("selectCard");
      try {
        return await resolver.promise;
      } finally {
        setViewType("normal");
      }
    },
    rerollDice: async () => {
      // 等待当前的 ui 动画渲染完成，但不阻塞后续 ui 更新
      await uiQueue.push(async () => {});
      const resolver = Promise.withResolvers<RerollDiceResponse>();
      actionResolvers.rerollDice = resolver;
      setViewType("rerollDice");
      try {
        return await resolver.promise;
      } finally {
        setViewType("rerollDiceEnd");
        setTimeout(
          () => setViewType((t) => (t === "rerollDiceEnd" ? "normal" : t)),
          500,
        );
      }
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

  const [history, setHistory] = createStore<HistoryData>({
    blocks: [],
    currentIndent: 0,
  });

  const io: PlayerIOWithCancellation = {
    cancelRpc,
    notify: ({ mutation, state }) => {
      if (!state) {
        return;
      }
      uiQueue.push(async () => {
        who === 0 &&
          console.log(...mutation.map(({ mutation }) => mutation?.$case));
        const parsed = parseMutations(mutation);
        setHistory(
          produce((history) => updateHistory(savedState, mutation, history)),
        );
        const { promise, resolve } = Promise.withResolvers<void>();
        setData({
          previousState: savedState ?? state,
          state,
          onAnimationFinish: resolve,
          ...parsed,
        } satisfies ChessboardData);
        savedState = state;
        await promise;
      });
    },
    rpc: async (req) => {
      try {
        setDoingRpc(true);
        return await dispatchRpc(dispatcher)(req);
      } finally {
        setDoingRpc(false);
      }
    },
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
        if (option.disableAction) {
          break;
        }
        actionResolvers.action?.resolve(result);
        setActionState(null);
        break;
      }
      case "chooseActiveCommitted": {
        if (option.disableAction) {
          break;
        }
        actionResolvers.chooseActive?.resolve(result);
        setActionState(null);
        break;
      }
    }
  };

  const onRerollDice = (diceToReroll: PbDiceType[]) => {
    if (option.disableAction) {
      return;
    }
    actionResolvers.rerollDice?.resolve({ diceToReroll });
  };
  const onSwitchHands = (removedHandIds: number[]) => {
    if (option.disableAction) {
      return;
    }
    actionResolvers.switchHands?.resolve({ removedHandIds });
  };
  const onSelectCard = (selectedDefinitionId: number) => {
    if (option.disableAction) {
      return;
    }
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
        history={history.blocks}
        viewType={viewType()}
        selectCardCandidates={selectCardCandidates()}
        doingRpc={doingRpc()}
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
