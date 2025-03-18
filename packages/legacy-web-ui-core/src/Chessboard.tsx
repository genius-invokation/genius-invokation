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

import {
  JSX,
  createContext,
  createEffect,
  createSignal,
  useContext,
  splitProps,
  Show,
  For,
  ComponentProps,
  Accessor,
  onMount,
  untrack,
} from "solid-js";
import {
  type DiceType,
  type ActionRequest,
  type ActionResponse,
  type ChooseActiveRequest,
  type ChooseActiveResponse,
  type Notification,
  type PbPlayerState,
  type RerollDiceResponse,
  type PbGameState,
  type SwitchHandsResponse,
  type PlayCardAction,
  type DamageEM,
  type ExposedMutation,
  type UseSkillAction,
  type SelectCardResponse,
  type SelectCardRequest,
  type PreviewData,
  dispatchRpc,
  flattenPbOneof,
  ActionValidity,
} from "@gi-tcg/typings";
import type {
  PbDiceRequirement,
  PbDiceType,
  PbExposedMutation,
  PlayerIO,
  RpcResponse,
} from "@gi-tcg/core";

import { PlayerArea } from "./PlayerArea";
import { DiceSelect, DiceSelectProps } from "./DiceSelect";
import { createStore, produce } from "solid-js/store";
import { groupBy, createWaitNotify } from "./utils";
import { RerollView } from "./RerollView";
import { Dice } from "./Dice";
import { SwitchHandsView } from "./SwitchHandsView";
import { SkillButton } from "./SkillButton";
import { AsyncQueue } from "./async_queue";
import { SelectCardView } from "./SelectCardView";
import { MutationAnnouncer } from "./MutationAnnouncer";
import { hintTexts } from "./CardDescription";
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
  phase: 0 /* PbPhaseType.PHASE_INIT_HANDS */,
  roundNumber: 0,
  player: [EMPTY_PLAYER_DATA, EMPTY_PLAYER_DATA],
};

/** 点击“宣布结束”的行为 ID */
export const DECLARE_END_ID = 0;
/**  将卡牌作为元素调和素材时的点击行为 ID*/
export const ELEMENTAL_TUNING_OFFSET = -11072100;

type ClickableActionWithIndex = (PlayCardAction | UseSkillAction) & {
  requiredCost: readonly PbDiceRequirement[];
  index: number;
};
type PartialDiceSelectProp = Omit<DiceSelectProps, "value">;
type DiceAndSelectionState = PartialDiceSelectProp & {
  actionIndex?: number;
  clickable?: Map<number, DiceAndSelectionState>;
  selected: number[];
  depth: number;
  hintText?: string;
};

/**
 * 构建单个行动入口的状态转移图
 * @param selected 标记为“已选择”的实体列表
 * @param actions 待处理的事件列表
 * @returns
 */
function buildClickableTransferIter(
  selected: number[],
  actions: ClickableActionWithIndex[],
  depth: number,
  hintTexts: string[],
): DiceAndSelectionState {
  switch (actions[0].targetIds.length) {
    case 0: {
      // 不再需要选择，进入选骰界面
      return {
        actionIndex: actions[0].index,
        required: actions[0].requiredCost,
        depth,
        hintText: hintTexts?.[depth],
        selected,
      };
    }
    case 1: {
      // 还差一层选择
      if (actions.length === 1) {
        // 如果只有一种可选行动，直接选中它
        return {
          actionIndex: actions[0].index,
          required: actions[0].requiredCost,
          depth,
          hintText: hintTexts?.[depth],
          selected: [...selected, actions[0].targetIds[0]],
        };
      } else {
        // 否则将所有可选行动加入 clickable
        // 只差一层选择的时候，点击这一层之后还可以切换到同层的其他目标
        const clickable = new Map<number, DiceAndSelectionState>();
        const root: DiceAndSelectionState = {
          disableConfirm: true,
          clickable,
          selected,
          depth,
          hintText: hintTexts?.[depth] ?? `请选择第 ${depth + 1} 个目标`,
        };
        for (const a of actions) {
          clickable.set(a.targetIds[0], {
            clickable,
            actionIndex: a.index,
            required: a.requiredCost,
            depth: depth + 1,
            hintText: hintTexts?.[depth] ?? `请选择第 ${depth + 1} 个目标`,
            selected: [...selected, a.targetIds[0]],
          });
        }
        return root;
      }
    }
    default: {
      const groupByFirst = groupBy(actions, (a) => a.targetIds[0]);
      const clickable = new Map<number, DiceAndSelectionState>();
      for (const [k, v] of groupByFirst) {
        const newV = v.map((v) => ({
          ...v,
          targets: v.targetIds.toSpliced(0, 1),
        }));
        clickable.set(
          k,
          buildClickableTransferIter(
            [...selected, k],
            newV,
            depth + 1,
            hintTexts,
          ),
        );
      }
      return {
        disableConfirm: true,
        clickable,
        selected,
        depth,
        hintText: hintTexts?.[depth] ?? `请选择第 ${depth + 1} 个目标`,
      };
    }
  }
}

/**
 * 构建所有使用卡牌的“可点击”状态转移图
 * @param cardAction 所有使用卡牌的事件
 * @returns 状态转移图的初始状态结点
 */
function buildClickableTransferState(
  cardAction: ClickableActionWithIndex[],
): Map<number, DiceAndSelectionState> {
  const grouped = groupBy(cardAction, (v) =>
    "skillDefinitionId" in v ? v.skillDefinitionId : v.cardId,
  );
  const result = new Map<number, DiceAndSelectionState>();
  for (const [k, v] of grouped) {
    const hintText = hintTexts.get(k) ?? [];
    result.set(k, buildClickableTransferIter([k], v, 0, hintText));
  }
  return result;
}

export interface AgentActions {
  onNotify?: (msg: Notification) => void;
  onSwitchHands: () => Promise<SwitchHandsResponse>;
  onChooseActive: (req: ChooseActiveRequest) => Promise<ChooseActiveResponse>;
  onRerollDice: () => Promise<RerollDiceResponse>;
  onSelectCard: (req: SelectCardRequest) => Promise<SelectCardResponse>;
  onAction: (req: ActionRequest) => Promise<ActionResponse>;
}

export interface PlayerContextValue {
  readonly allClickable: readonly number[];
  readonly allSelected: readonly number[];
  readonly allCosts: Readonly<Record<number, readonly PbDiceRequirement[]>>;
  readonly onClick: (id: number) => void;
  readonly setPrepareTuning: (value: boolean) => void;
  readonly assetsManager: AssetsManager;
}

export interface EventContextValue {
  readonly allDamages: Accessor<readonly DamageEM[]>;
  readonly previewData: Accessor<readonly PreviewData[]>;
  readonly focusing: Accessor<number | null>;
}

const PlayerContext = createContext<PlayerContextValue>();
export function usePlayerContext(): Readonly<PlayerContextValue> {
  return useContext(PlayerContext)!;
}
const EventContext = createContext<EventContextValue>();
export function useEventContext(): Readonly<EventContextValue> {
  return useContext(EventContext)!;
}

export interface WebUiOption {
  onGiveUp?: () => void;
  alternativeAction?: AgentActions;
  assetsManager?: AssetsManager;
}

export interface PlayerIOWithCancellation extends PlayerIO {
  cancelRpc: () => void;
}

export function createPlayer(
  who: 0 | 1,
  opt: WebUiOption = {},
): [
  io: PlayerIOWithCancellation,
  Chessboard: (props: ComponentProps<"div">) => JSX.Element,
] {
  const [gameState, setGameState] = createSignal(EMPTY_GAME_STATE);
  const [previewData, setPreviewData] = createSignal<PreviewData[]>([]);
  const [previewing, setPreviewing] = createSignal(false);
  const [mutations, setMutations] = createSignal<PbExposedMutation[]>([]);
  const [giveUp, setGiveUp] = createSignal(false);
  const [rerolling, waitReroll, notifyRerolled] =
    createWaitNotify<PbDiceType[]>();
  const [handSwitching, waitHandSwitch, notifyHandSwitched] =
    createWaitNotify<number[]>();
  const [cardSelecting, waitCardSelect, notifyCardSelected] =
    createWaitNotify<number>();
  const [cardToSelect, setCardToSelect] = createSignal<readonly number[]>([]);
  const [hintText, setHintText] = createSignal("");
  const [, waitDiceSelect, notifyDiceSelected] = createWaitNotify<
    DiceType[] | undefined
  >();
  const [diceSelectProp, setDiceSelectProp] =
    createSignal<PartialDiceSelectProp>();

  const [allClickable, setClickable] = createStore<number[]>([]);
  const [allSelected, setSelected] = createStore<number[]>([]);
  const [, waitElementClick, notifyElementClicked] = createWaitNotify<number>();
  const [, waitChessboardClick, notifyChessboardClicked] =
    createWaitNotify<void>();

  const [allCosts, setAllCosts] = createStore<
    Record<number, readonly PbDiceRequirement[]>
  >({});
  const [prepareTuning, setPrepareTuning] = createSignal(false);

  const clearIo = () => {
    setClickable([]);
    setSelected([]);
    setHintText("");
    setAllCosts({});
    setDiceSelectProp();
    notifyHandSwitched([]);
    notifyDiceSelected([]);
    notifyRerolled([]);
    notifyElementClicked(0);
  };
  let rejectRpc: (e: Error) => void = () => {
    clearIo();
  };

  const action = opt.alternativeAction ?? {
    onNotify: void 0,
    onSwitchHands: async (): Promise<SwitchHandsResponse> => {
      return { removedHandIds: await waitHandSwitch() };
    },
    onRerollDice: async (): Promise<RerollDiceResponse> => {
      return { diceToReroll: await waitReroll() };
    },
    onSelectCard: async ({
      candidateDefinitionIds,
    }): Promise<SelectCardResponse> => {
      setCardToSelect(candidateDefinitionIds);
      return { selectedDefinitionId: await waitCardSelect() };
    },
    onChooseActive: async ({ candidateIds }): Promise<ChooseActiveResponse> => {
      let activeCharacterId = candidateIds[0];
      setClickable([...candidateIds]);
      setHintText("请选择出战角色");
      setDiceSelectProp({
        confirmOnly: true,
        disableConfirm: true,
      });
      const nextProp: PartialDiceSelectProp = {
        confirmOnly: true,
      };
      for (;;) {
        const result = await Promise.race([
          waitElementClick(),
          waitDiceSelect(),
        ]);
        if (Array.isArray(result)) {
          // 点击了确认
          break;
        }
        if (typeof result === "number") {
          // 点击了角色
          activeCharacterId = result;
          setSelected([activeCharacterId]);
        }
        setDiceSelectProp(nextProp);
      }
      setDiceSelectProp();
      setClickable([]);
      setSelected([]);
      setHintText("");
      return { activeCharacterId };
    },
    onAction: async ({ action: actions }): Promise<ActionResponse> => {
      const player = myPlayer();
      const currentEnergy =
        player.character.find((ch) => ch.id === player.activeCharacterId)
          ?.energy ?? 0;
      const clickableInfos: ClickableActionWithIndex[] = [];
      const initialClickable = new Map<number, DiceAndSelectionState>();
      const newAllCosts: Record<number, readonly PbDiceRequirement[]> = {};
      for (const [actionObj, i] of actions.map((v, i) => [v, i] as const)) {
        if (actionObj.validity !== ActionValidity.VALID) {
          continue;
        }
        const action = flattenPbOneof(actionObj.action!);
        if (action.$case === "useSkill") {
          const energyReq = actionObj.requiredCost.find(
            ({ type }) => type === 9 /* energy */,
          );
          if (energyReq && currentEnergy < energyReq.count) {
            continue;
          }
          clickableInfos.push({
            ...action,
            index: i,
            requiredCost: actionObj.requiredCost,
          });
          newAllCosts[action.skillDefinitionId] = actionObj.requiredCost;
        } else if (action.$case === "playCard") {
          const energyReq = actionObj.requiredCost.find(
            ({ type }) => type === 9 /* energy */,
          );
          if (energyReq && currentEnergy < energyReq.count) {
            continue;
          }
          clickableInfos.push({
            ...action,
            index: i,
            requiredCost: actionObj.requiredCost,
          });
          newAllCosts[action.cardId] = actionObj.requiredCost;
        } else if (action.$case === "switchActive") {
          initialClickable.set(action.characterId, {
            actionIndex: i,
            required: actionObj.requiredCost,
            selected: [action.characterId],
            hintText: "切换出战角色",
            depth: 0,
          });
          newAllCosts[action.characterId] = actionObj.requiredCost;
        } else if (action.$case === "elementalTuning") {
          initialClickable.set(action.removedCardId + ELEMENTAL_TUNING_OFFSET, {
            actionIndex: i,
            disabledDice: [8 /* omni */, action.targetDice],
            required: [{ type: 0 /* void */, count: 1 }],
            selected: [action.removedCardId],
            hintText: "元素调和",
            depth: 0,
          });
        } else if (action.$case === "declareEnd") {
          initialClickable.set(0, {
            actionIndex: i,
            required: [],
            selected: [],
            depth: 0,
          });
        }
      }
      for (const [k, v] of buildClickableTransferState(clickableInfos)) {
        initialClickable.set(k, v);
      }
      setAllCosts(newAllCosts);

      let result: ActionResponse;
      let state: DiceAndSelectionState = {
        clickable: initialClickable,
        selected: [],
        depth: 0,
      };
      for (;;) {
        while (!("actionIndex" in state)) {
          setClickable([...(state.clickable?.keys() ?? [])]);
          setSelected([...state.selected]);
          setHintText(state.hintText ?? "");
          const val = await Promise.race([
            waitElementClick(),
            waitChessboardClick(),
          ]);
          if (typeof val === "undefined") {
            state = {
              clickable: initialClickable,
              selected: [],
              depth: 0,
            };
          } else {
            if (!state.clickable?.has(val)) {
              throw new Error(`Click event emitted with an invalid value`);
            }
            state = state.clickable.get(val)!;
          }
        }
        setClickable([...(state.clickable?.keys() ?? [])]);
        setHintText(state.hintText ?? "");
        setSelected([...state.selected]);
        const chosenActionIndex = state.actionIndex!;
        setPreviewData(actions[chosenActionIndex].preview);

        if (actions[chosenActionIndex].action?.$case === "declareEnd") {
          setClickable([]);
          setSelected([]);
          setHintText("");
          result = {
            chosenActionIndex,
            usedDice: [],
          };
          break;
        }

        setDiceSelectProp(state);
        const r = await Promise.race([
          waitDiceSelect(),
          waitElementClick(),
          waitChessboardClick(),
        ]);
        if (Array.isArray(r) || typeof r === "undefined") {
          setDiceSelectProp();
          if (Array.isArray(r)) {
            result = {
              chosenActionIndex,
              usedDice: r as PbDiceType[],
            };
            break;
          }
          state = {
            clickable: initialClickable,
            selected: [],
            depth: 0,
          };
        } else {
          state = state.clickable!.get(r)!;
        }
      }
      setClickable([]);
      setSelected([]);
      setHintText("");
      setAllCosts({});
      setPreviewData([]);
      return result;
    },
  };
  const renderQueue = new AsyncQueue();
  const io: PlayerIOWithCancellation = {
    notify: (msg) => {
      renderQueue.push(async () => {
        setGameState(msg.state!);
        setMutations(msg.mutation);
        if (action.onNotify) {
          action.onNotify(msg);
        }
        if (import.meta.env.DEV && who === 0) {
          console.log(msg);
        }
        if (
          msg.mutation.filter(
            ({ mutation }) =>
              mutation?.$case === "damage" || mutation?.$case === "skillUsed",
          ).length > 0
        ) {
          await new Promise<void>((resolve) => setTimeout(resolve, 500));
        }
      });
    },
    rpc: async (request) => {
      await renderQueue.push(async () => {});
      return new Promise<RpcResponse>((resolve, reject) => {
        rejectRpc = (e) => {
          reject(e);
          clearIo();
        };
        return dispatchRpc({
          action: action.onAction,
          rerollDice: action.onRerollDice,
          chooseActive: action.onChooseActive,
          switchHands: action.onSwitchHands,
          selectCard: action.onSelectCard,
        })(request).then(resolve, reject);
      });
    },
    cancelRpc: () => {
      rejectRpc(new Error("User canceled the request"));
    },
  };
  createEffect(() => {
    if (giveUp()) {
      opt.onGiveUp?.();
      rejectRpc(new Error("User give up when rpc"));
    }
  });

  const myPlayer = () => gameState().player[who];

  const tuningDragEnter = (e: DragEvent) => {
    e.preventDefault();
  };
  const tuningDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = "move";
  };
  const tuningDragLeave = (e: DragEvent) => {
    e.preventDefault();
  };
  const tuningDrop = (e: DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer!.getData("text/plain");
    const cardId = parseInt(data);
    notifyElementClicked(cardId + ELEMENTAL_TUNING_OFFSET);
    setPrepareTuning(false);
  };
  const playerContextValue: PlayerContextValue = {
    allClickable,
    allSelected,
    allCosts,
    onClick: notifyElementClicked,
    setPrepareTuning,
    assetsManager: opt.assetsManager ?? DEFAULT_ASSETS_MANAGER,
  };

  const ChessboardWithIO = () => (
    <PlayerContext.Provider value={playerContextValue}>
      <Chessboard
        state={gameState()}
        who={who}
        mutations={mutations()}
        previewData={previewing() ? previewData() : null}
        onClick={() => notifyChessboardClicked()}
      >
        <Show when={allClickable.includes(DECLARE_END_ID)}>
          <button
            class="absolute left-22 top-[50%] translate-y-[-50%] btn btn-green-500 z-10"
            v-if="clickable.includes(DECLARE_END_ID)"
            onClick={() => notifyElementClicked(DECLARE_END_ID)}
          >
            结束回合
          </button>
        </Show>
        <Show when={hintText()}>
          <div class="absolute top-50% translate-y--50% left-50% translate-x--50% bg-yellow-100 p-2 text-yellow-800">
            {hintText()}
          </div>
        </Show>
        <div class="absolute right-0 top-0 z-15 h-full min-w-8 flex flex-col items-center bg-yellow-800">
          <Show
            when={diceSelectProp()}
            fallback={
              <>
                <div class="rounded-full bg-white w-6 h-6 my-2 line-height-1em flex items-center justify-center">
                  {myPlayer().dice.length}
                </div>
                <For each={myPlayer().dice}>{(d) => <Dice type={d} />}</For>
              </>
            }
          >
            <DiceSelect
              {...diceSelectProp()}
              value={myPlayer().dice}
              onConfirm={notifyDiceSelected}
              onCancel={() => notifyDiceSelected(void 0)}
              onEnterPreview={() => setPreviewing(true)}
              onLeavePreview={() => setPreviewing(false)}
            />
          </Show>
        </div>
        <div
          class="absolute right-0 top-0 h-full z-15 opacity-80 items-center justify-center bg-yellow-300 flex flex-col transition-all"
          classList={{
            invisible: !prepareTuning(),
            "w-0": !prepareTuning(),
            "w-40": prepareTuning(),
          }}
          onDragEnter={tuningDragEnter}
          onDragOver={tuningDragOver}
          onDragLeave={tuningDragLeave}
          onDrop={tuningDrop}
        >
          <span>拖动到此处</span>
          <span>以元素调和</span>
        </div>
        <Show when={rerolling()}>
          <div class="absolute left-0 top-0 h-full w-full bg-black bg-opacity-70 z-20">
            <RerollView dice={myPlayer().dice} onConfirm={notifyRerolled} />
          </div>
        </Show>
        <Show when={handSwitching()}>
          <div class="absolute left-0 top-0 h-full w-full bg-black bg-opacity-70 z-20">
            <SwitchHandsView
              hands={myPlayer().handCard}
              onConfirm={notifyHandSwitched}
            />
          </div>
        </Show>
        <Show when={cardSelecting()}>
          <div class="absolute left-0 top-0 h-full w-full bg-black bg-opacity-70 z-20">
            <SelectCardView
              cards={cardToSelect()}
              onConfirm={notifyCardSelected}
            />
          </div>
        </Show>
        <button
          class="absolute right-10 top-2 z-15 btn btn-red-500"
          onClick={() => setGiveUp(true)}
          disabled={giveUp()}
        >
          {giveUp() ? "已放弃对局" : "走此小道"}
        </button>
      </Chessboard>
    </PlayerContext.Provider>
  );

  return [io, ChessboardWithIO];
}

interface ChessboardProps extends ComponentProps<"div"> {
  state: PbGameState;
  mutations?: readonly PbExposedMutation[];
  who: 0 | 1;
  children?: JSX.Element;
  previewData: PreviewData[] | null;
  onClick?: (e: MouseEvent) => void;
}

function Chessboard(props: ChessboardProps) {
  const { assetsManager } = usePlayerContext();
  const [local, restProps] = splitProps(props, [
    "class",
    "state",
    "previewData",
    "mutations",
    "who",
    "children",
  ]);

  const [allDamages, setAllDamages] = createSignal<DamageEM[]>([]);
  const [focusing, setFocusing] = createSignal<number | null>(null);
  const [playerStatus, setPlayerStatus] = createStore<[number, number]>([0, 0]);
  const previewData = () => local.previewData ?? [];

  createEffect(() => {
    let currentFocusing: number | null = null;
    const currentDamages: DamageEM[] = [];
    for (const { mutation } of local.mutations ?? []) {
      if (mutation?.$case === "damage") {
        currentDamages.push(mutation.value);
      }
      if (mutation?.$case === "skillUsed") {
        currentFocusing = mutation.value.callerId;
      }
      if (mutation?.$case === "playerStatusChange") {
        const { who, status } = mutation.value;
        setPlayerStatus(
          produce((st) => {
            st[who] = status;
          }),
        );
      }
    }
    setAllDamages(currentDamages);
    setFocusing(currentFocusing);
  });

  onMount(() => {
    console.log("CHESSBOARD MOUNTED");
    const prefetchedImages = [1, 2, 3, 4, 5, 6, 7];
    prefetchedImages.map((id) =>
      assetsManager.getImageUrl(id, { thumbnail: true }),
    );
  });

  return (
    <EventContext.Provider value={{ allDamages, previewData, focusing }}>
      <div
        class={`gi-tcg-chessboard relative flex flex-col ${
          local.class ?? ""
        } select-none`}
        {...restProps}
      >
        <div
          data-previewing={props.previewData !== null}
          onClick={(e) => props.onClick?.(e)}
          class="w-full b-solid b-black b-2 relative data-[previewing=true]:grayscale-50"
        >
          <PlayerArea
            who={(1 - local.who) as 0 | 1}
            data={local.state.player[1 - local.who]}
            opp={true}
            playerStatus={playerStatus[1 - local.who]}
          />
          <PlayerArea
            who={local.who}
            data={local.state.player[local.who]}
            opp={false}
            playerStatus={playerStatus[local.who]}
          />
        </div>
        <div class="absolute left-0 top-[50%] translate-y-[-50%] z-10">
          <div class="absolute left-5 top--2 translate-y-[-100%] translate-x-[-50%]">
            <Dice
              type={8 /* omni */}
              text={`${local.state.player[1 - local.who].dice.length}`}
              size={32}
            />
          </div>
          <div class="flex items-center gap-2">
            <div
              class="w-20 h-20 rounded-10 flex flex-col items-center justify-center border-8 border-solid border-yellow-800"
              classList={{
                "bg-yellow-300": local.state.currentTurn === local.who,
                "bg-blue-200": local.state.currentTurn !== local.who,
              }}
            >
              <div class="text-lg">{local.state.roundNumber}</div>
              {/* <div class="text-sm text-gray">{local.state.phase}</div> */}
            </div>
          </div>
        </div>
        <div class="absolute right-10 bottom-0 z-12 flex flex-row gap-2">
          <For each={local.state.player[local.who].initiativeSkill}>
            {(skill) => <SkillButton data={skill} />}
          </For>
        </div>
        <MutationAnnouncer
          class="absolute top-10 left-15 h-40 w-50 overflow-auto"
          mutations={local.mutations}
          who={local.who}
          state={local.state}
        />
        {local.children}
        <Show
          when={!props.previewData && local.state.phase === 5 /* gameEnd */}
        >
          <div class="absolute left-0 top-0 h-full w-full bg-black bg-opacity-70 text-white text-15 z-20 flex items-center justify-center">
            {local.state.winner === local.who ? "胜利" : "失败"}
          </div>
        </Show>
      </div>
    </EventContext.Provider>
  );
}

export interface StandaloneChessboardProps extends ChessboardProps {
  assetsManager?: AssetsManager;
}

export function StandaloneChessboard(props: StandaloneChessboardProps) {
  const [local, restProps] = splitProps(props, ["assetsManager"]);

  const contextValue = (): PlayerContextValue => ({
    allClickable: [],
    allCosts: [],
    allSelected: [],
    assetsManager: untrack(() => local.assetsManager) ?? DEFAULT_ASSETS_MANAGER,
    onClick: () => {},
    setPrepareTuning: () => {},
  });

  return (
    <PlayerContext.Provider value={contextValue()}>
      <Chessboard {...restProps}>
        <div class="absolute right-0 top-0 z-15 h-full min-w-8 flex flex-col bg-yellow-800">
          <For each={restProps.state.player[restProps.who].dice}>
            {(d) => <Dice type={d} />}
          </For>
        </div>
      </Chessboard>
    </PlayerContext.Provider>
  );
}
