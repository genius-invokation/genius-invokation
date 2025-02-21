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
  DiceType,
  PbPlayerStatus,
  type DamageType,
  type PbCardState,
  type PbCharacterState,
  type PbEntityState,
  type PbGameState,
  type PbSkillType,
  type Reaction,
} from "@gi-tcg/typings";
import { Card } from "./Card";
import {
  batch,
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
  Show,
  splitProps,
  type ComponentProps,
} from "solid-js";
import debounce from "debounce";
import {
  DRAGGING_Z,
  FOCUSING_HANDS_Z,
  getCharacterAreaPos,
  getEntityPos,
  getHandCardBlurredPos,
  getHandCardFocusedPos,
  getHandHintPos,
  getPileHintPos,
  getPilePos,
  getShowingCardPos,
  PERSPECTIVE,
  shouldFocusHandWhenDragging,
  unitInPx,
  type Pos,
  type Size,
} from "../layout";
import { CHARACTER_ANIMATION_NONE, CharacterArea } from "./CharacterArea";
import {
  createCardAnimation,
  type CardStaticUiState,
  type CardUiState,
  type CharacterUiState,
  type EntityUiState,
  type StaticUiState,
  type Transform,
} from "../ui_state";
import type { ParsedMutation } from "../mutations";
import {
  KeyWithAnimation,
  type UpdateSignal,
} from "../primitives/key_with_animation";
import { NotificationBox } from "./NotificationBox";
import { Entity } from "./Entity";
import { PlayerInfo, type PlayerInfoProps } from "./PlayerInfo";
import { flip } from "@gi-tcg/utils";
import { DicePanel, type DicePanelState } from "./DicePanel";
import { SkillButtonGroup } from "./SkillButtonGroup";
import { createStore } from "solid-js/store";
import { RoundAndPhaseNotification } from "./RoundAndPhaseNotification";
import { PlayingCard } from "./PlayingCard";
import "@gi-tcg/card-data-viewer/style.css";
import { createCardDataViewer } from "@gi-tcg/card-data-viewer";
import { useUiContext } from "../hooks/context";
import { CardCountHint } from "./CardCountHint";
import { Key } from "@solid-primitives/keyed";
import {
  DeclareEndMarker,
  type DeclareEndMarkerProps,
} from "./DeclareEndMarker";
import {
  CANCEL_ACTION_STEP,
  type ActionState,
  type ActionStep,
  type ClickEntityActionStep,
} from "../action";
import { ChessboardBackdrop } from "./ChessboardBackdrop";

export type CardArea = "myPile" | "oppPile" | "myHand" | "oppHand";

export interface CardInfo {
  id: number;
  data: PbCardState;
  kind: CardArea | "animating" | "dragging";
  uiState: CardUiState;
  enableShadow: boolean;
  enableTransition: boolean;
  playStep: ActionStep | null;
  tuneStep: ActionStep | null;
}

interface DraggingCardInfo {
  id: number;
  x: number;
  y: number;
  moving: boolean;
  updatePos: (e: PointerEvent) => Pos;
}

export interface CharacterInfo {
  id: number;
  data: PbCharacterState;
  entities: StatusInfo[];
  combatStatus: StatusInfo[];
  active: boolean;
  triggered: boolean;
  uiState: CharacterUiState;
  clickStep: ClickEntityActionStep | null;
}

export interface StatusInfo {
  id: number;
  data: PbEntityState;
  animation: "none" | "entering" | "disposing";
  triggered: boolean;
}

export interface EntityInfo extends StatusInfo {
  type: "support" | "summon";
  uiState: EntityUiState;
  clickStep: ClickEntityActionStep | null;
}

export interface AnimatingCardInfo {
  data: PbCardState;
  showing: boolean;
  delay: number;
}

export interface PlayingCardInfo {
  who: 0 | 1;
  data: PbCardState;
  noEffect: boolean;
}

export interface DamageInfo {
  damageType: DamageType;
  value: number;
  sourceId: number;
  targetId: number;
  isSkillMainDamage: boolean;
  delay: number;
}

export interface ReactionInfo {
  reactionType: Reaction;
  targetId: number;
  delay: number;
}

export interface NotificationBoxInfo {
  type: "useSkill" | "switchActive";
  who: 0 | 1;
  characterDefinitionId: number;
  skillDefinitionId?: number;
  skillType: PbSkillType | "overloaded" | null;
}

export interface ChessboardData extends ParsedMutation {
  /** 保存上一个状态以计算动画效果 */
  previousState: PbGameState;
  state: PbGameState;
  onAnimationFinish?: () => void;
}

export type StepActionStateHandler = (
  step: ActionStep,
  selectedDice: DiceType[],
) => void;

export interface ChessboardProps extends ComponentProps<"div"> {
  who: 0 | 1;
  /**
   * 从 notify 传入的 state & mutations 经过解析后得到的棋盘数据
   */
  data: ChessboardData;
  /**
   * 从 rpc/action 或 rpc/switchActive 解析后的
   */
  actionState: ActionState | null;
  onStepActionState: StepActionStateHandler;
}

interface CardInfoCalcContext {
  who: 0 | 1;
  size: Size;
  focusingHands: boolean;
  showHands: boolean;
  hoveringHand: CardInfo | null;
  draggingHand: DraggingCardInfo | null;
}

function calcCardsInfo(
  state: PbGameState,
  ctx: CardInfoCalcContext,
): CardInfo[] {
  const { who, size, focusingHands, hoveringHand } = ctx;
  const cards: CardInfo[] = [];
  for (const who2 of [0, 1] as const) {
    const opp = who2 !== who;
    const player = state.player[who2];

    // Pile
    const pileSize = player.pileCard.length;
    for (let i = 0; i < pileSize; i++) {
      const [x, y] = getPilePos(size, opp);
      const card = player.pileCard[i];
      cards.push({
        id: card.id,
        data: card,
        kind: opp ? "oppPile" : "myPile",
        uiState: {
          type: "cardStatic",
          isAnimating: false,
          transform: {
            x,
            y,
            z: (pileSize - 1 - i) / 4,
            ry: 180,
            rz: 90,
          },
        },
        enableShadow: i === pileSize - 1,
        enableTransition: true,
        playStep: null,
        tuneStep: null,
      });
    }

    // Hand
    const handCard = player.handCard.toSorted(
      (a, b) => a.definitionId - b.definitionId,
    );
    const totalHandCardCount = handCard.length;
    const skillCount = player.initiativeSkill.length;

    const isFocus = !opp && focusingHands;
    const z = isFocus ? FOCUSING_HANDS_Z : 1;
    const ry = isFocus ? 1 : opp ? 185 : 5;

    let hoveringHandIndex: number | null = handCard.findIndex(
      (card) => card.id === hoveringHand?.id,
    );
    if (hoveringHandIndex === -1) {
      hoveringHandIndex = null;
    }

    for (let i = 0; i < totalHandCardCount; i++) {
      const card = handCard[i];
      if (ctx.draggingHand?.id === card.id) {
        const { x, y, moving } = ctx.draggingHand;
        cards.push({
          id: card.id,
          data: card,
          kind: "dragging",
          uiState: {
            type: "cardStatic",
            isAnimating: false,
            transform: {
              x,
              y,
              z: DRAGGING_Z,
              // zIndex: 100,
              ry: 0,
              rz: 0,
            },
          },
          enableShadow: true,
          enableTransition: !moving,
          playStep: null,
          tuneStep: null,
        });
        continue;
      }
      const [x, y] = isFocus
        ? getHandCardFocusedPos(size, totalHandCardCount, i, hoveringHandIndex)
        : getHandCardBlurredPos(
            size,
            opp,
            ctx.showHands,
            totalHandCardCount,
            i,
            skillCount,
          );
      cards.push({
        id: card.id,
        data: card,
        kind: opp ? "oppHand" : "myHand",
        uiState: {
          type: "cardStatic",
          isAnimating: false,
          transform: {
            x,
            y,
            z,
            ry,
            rz: 0,
          },
        },
        enableShadow: true,
        enableTransition: true,
        playStep: null,
        tuneStep: null,
      });
    }
  }
  return cards;
}

interface CalcEntitiesInfoResult {
  supports: EntityInfo[];
  summons: EntityInfo[];
  combatStatuses: StatusInfo[];
  characterAreaEntities: Map<number, StatusInfo[]>;
}

interface EntityInfoCalcContext {
  who: 0 | 1;
  size: Size;
}

function calcEntitiesInfo(
  state: PbGameState,
  { who, size }: EntityInfoCalcContext,
): CalcEntitiesInfoResult[] {
  const result: CalcEntitiesInfoResult[] = [];
  const calcEntityInfo =
    (opp: boolean, type: "support" | "summon") =>
    (data: PbEntityState, index: number): EntityInfo => {
      const [x, y] = getEntityPos(size, opp, type, index);
      return {
        id: data.id,
        type,
        data,
        animation: "none",
        triggered: false,
        uiState: {
          type: "entityStatic",
          isAnimating: false,
          transform: {
            x,
            y,
            z: 0,
            ry: 0,
            rz: 0,
          },
        },
        clickStep: null,
      };
    };
  const calcStatusInfo = (data: PbEntityState): StatusInfo => {
    return {
      id: data.id,
      data,
      animation: "none",
      triggered: false,
    };
  };
  for (const who2 of [0, 1] as const) {
    const opp = who2 !== who;
    const player = state.player[who2];
    const supports = player.support.map(calcEntityInfo(opp, "support"));
    const summons = player.summon.map(calcEntityInfo(opp, "summon"));
    const combatStatuses = player.combatStatus.map(calcStatusInfo);
    const statuses = new Map<number, StatusInfo[]>();
    for (const ch of player.character) {
      statuses.set(ch.id, ch.entity.map(calcStatusInfo));
    }
    result.push({
      supports,
      summons,
      combatStatuses,
      characterAreaEntities: statuses,
    });
  }
  return result;
}

export interface CardCountHintInfo {
  area: CardArea;
  value: number;
  transform: Transform;
}

interface ChessboardChildren {
  characters: CharacterInfo[];
  cards: CardInfo[];
  entities: EntityInfo[];
  cardCountHints: CardCountHintInfo[];
}

function rerenderChildren(opt: {
  who: 0 | 1;
  size: Size;
  focusingHands: boolean;
  showHands: boolean;
  hoveringHand: CardInfo | null;
  draggingHand: DraggingCardInfo | null;
  data: ChessboardData;
  availableSteps: ActionStep[];
}): ChessboardChildren {
  const {
    size,
    focusingHands,
    showHands,
    hoveringHand,
    draggingHand,
    data,
    availableSteps,
  } = opt;
  // console.log(data);

  const { damages, onAnimationFinish, animatingCards, state, previousState } =
    data;

  const cardCountHints: CardCountHintInfo[] = [];
  const COUNT_HINT_TRANSFORM_BASE = {
    ry: 0,
    rz: 0,
  };
  for (const who of [0, 1] as const) {
    const opp = who !== opt.who;
    const player = state.player[who];
    cardCountHints.push({
      area: opp ? "oppPile" : "myPile",
      value: player.pileCard.length,
      transform: {
        ...getPileHintPos(size, opp),
        z: 0,
        ...COUNT_HINT_TRANSFORM_BASE,
      },
    });
    cardCountHints.push({
      area: opp ? "oppHand" : "myHand",
      value: player.handCard.length,
      transform: {
        ...getHandHintPos(size, opp, player.handCard.length),
        ...COUNT_HINT_TRANSFORM_BASE,
        z: opp ? 2 : FOCUSING_HANDS_Z,
      },
    });
  }

  const animationPromises: Promise<void>[] = [];
  const currentCards = calcCardsInfo(state, {
    who: opt.who,
    size,
    focusingHands,
    showHands,
    hoveringHand,
    draggingHand,
  });

  if (animatingCards.length > 0) {
    const previousCards = calcCardsInfo(previousState, {
      who: opt.who,
      size,
      focusingHands,
      showHands,
      hoveringHand,
      draggingHand,
    });
    const showingCards = Map.groupBy(animatingCards, (x) => x.delay);
    let totalDelayMs = 0;
    for (const d of showingCards
      .keys()
      .toArray()
      .toSorted((a, b) => a - b)) {
      const currentAnimatingCards = showingCards.get(d)!;
      const currentShowingCards = currentAnimatingCards
        .filter((card) => card.showing)
        .toSorted((x, y) => x.data.definitionId - y.data.definitionId);
      let currentDurationMs = 0;
      for (const animatingCard of currentAnimatingCards) {
        const start = previousCards.find(
          (card) => card.id === animatingCard.data.id,
        );
        const startTransform = start
          ? (start.uiState as CardStaticUiState).transform
          : null;

        const endIndex = currentCards.findIndex(
          (card) => card.id === animatingCard.data.id,
        );
        let endTransform: Transform | null = null;
        if (endIndex !== -1) {
          endTransform = (currentCards[endIndex].uiState as CardStaticUiState)
            .transform;
          currentCards.splice(endIndex, 1);
        }
        let middleTransform: Transform | null = null;
        const index = currentShowingCards.indexOf(animatingCard);
        const hasMiddle = index !== -1;
        if (hasMiddle) {
          const [x, y] = getShowingCardPos(
            size,
            currentShowingCards.length,
            index,
          );
          middleTransform = {
            x,
            y,
            z: 20,
            ry: 5,
            rz: 0,
          };
        }
        const [animation, promise] = createCardAnimation({
          start: startTransform,
          middle: hasMiddle ? middleTransform : null,
          end: endTransform,
          delayMs: totalDelayMs,
        });
        currentDurationMs = Math.max(currentDurationMs, animation.durationMs);
        currentCards.push({
          id: animatingCard.data.id,
          data: animatingCard.data,
          kind: "animating",
          uiState: animation,
          enableShadow: true,
          enableTransition: false,
          playStep: null,
          tuneStep: null,
        });
        animationPromises.push(promise);
      }
      totalDelayMs += currentDurationMs;
    }
  }

  let entityAnimationDuration = 500;
  let currentEntities = calcEntitiesInfo(state, {
    who: opt.who,
    size,
  });
  if (data.disposingEntities.length > 0) {
    const previousEntities = calcEntitiesInfo(previousState, {
      who: opt.who,
      size,
    });
    const applyDiff = <T extends StatusInfo>(
      entities: T[],
      newEntities: T[],
    ) => {
      for (const entity of entities) {
        const isDisposing = data.disposingEntities.includes(entity.id);
        if (isDisposing) {
          entity.animation = "disposing";
        }
        if (data.triggeringEntities.includes(entity.id)) {
          entity.triggered = true;
          if (isDisposing) {
            // 此时要播放触发和消失两个动画，略微延长时间
            entityAnimationDuration = 700;
          }
        }
      }
      for (const entity of newEntities) {
        if (data.enteringEntities.includes(entity.id)) {
          entity.animation = "entering";
          entities.push(entity);
        }
      }
    };
    for (const who of [0, 1]) {
      const previousPlayer = previousEntities[who];
      const currentPlayer = currentEntities[who];

      applyDiff(previousPlayer.supports, currentPlayer.supports);
      applyDiff(previousPlayer.summons, currentPlayer.summons);
      applyDiff(previousPlayer.combatStatuses, currentPlayer.combatStatuses);
      for (const [id, entities] of previousPlayer.characterAreaEntities) {
        applyDiff(entities, currentPlayer.characterAreaEntities.get(id) ?? []);
      }
    }
    currentEntities = previousEntities;
  } else {
    const applyAnimation = <T extends StatusInfo>(entities: T[]) => {
      for (const entity of entities) {
        if (data.triggeringEntities.includes(entity.id)) {
          entity.triggered = true;
        }
        if (data.enteringEntities.includes(entity.id)) {
          entity.animation = "entering";
        }
      }
    };
    for (const who of [0, 1]) {
      const currentPlayer = currentEntities[who];
      applyAnimation(currentPlayer.supports);
      applyAnimation(currentPlayer.summons);
      applyAnimation(currentPlayer.combatStatuses);
      for (const entities of currentPlayer.characterAreaEntities.values()) {
        applyAnimation(entities);
      }
    }
  }

  const charactersMap = new Map<number, CharacterInfo>();
  const isCharacterAnimating = damages.some((d) => d.isSkillMainDamage);
  for (const who of [0, 1] as const) {
    const player = state.player[who];
    const opp = who !== opt.who;
    const combatStatus = currentEntities[who].combatStatuses;

    const totalCharacterCount = player.character.length;
    for (let i = 0; i < totalCharacterCount; i++) {
      const ch = player.character[i];
      const entities =
        currentEntities[who].characterAreaEntities.get(ch.id) ?? [];
      const isActive = player.activeCharacterId === ch.id && !ch.defeated;
      const [x, y] = getCharacterAreaPos(
        size,
        opp,
        totalCharacterCount,
        i,
        isActive,
      );
      const { promise, resolve } = Promise.withResolvers<void>();
      charactersMap.set(ch.id, {
        id: ch.id,
        data: ch,
        entities,
        triggered: data.triggeringEntities.includes(ch.id),
        uiState: {
          type: "character",
          isAnimating: isCharacterAnimating,
          transform: {
            x,
            y,
            z: 0,
            ry: 0,
            rz: 0,
          },
          damages: [],
          animation: CHARACTER_ANIMATION_NONE,
          onAnimationFinish: resolve,
        },
        active: isActive,
        combatStatus: isActive ? combatStatus : [],
        clickStep: null,
      });
      animationPromises.push(promise);
    }
  }
  for (const damage of damages) {
    const source = charactersMap.get(damage.sourceId);
    const target = charactersMap.get(damage.targetId)!;
    if (source && damage.isSkillMainDamage) {
      source.triggered = false;
      source.uiState.animation = {
        type: "damageSource",
        targetX: target.uiState.transform.x,
        targetY: target.uiState.transform.y,
      };
      target.uiState.animation = {
        type: "damageTarget",
        sourceX: source.uiState.transform.x,
        sourceY: source.uiState.transform.y,
      };
    }
    target.uiState.damages.push(damage);
  }

  if (data.roundAndPhase.value !== null) {
    const duration = data.roundAndPhase.showRound ? 1300 : 500;
    animationPromises.push(
      new Promise((resolve) => setTimeout(resolve, duration)),
    );
  }
  if (data.playingCard || data.notificationBox) {
    animationPromises.push(new Promise((resolve) => setTimeout(resolve, 700)));
  }
  if (data.enteringEntities.length > 0 || data.triggeringEntities.length > 0) {
    animationPromises.push(
      new Promise((resolve) => setTimeout(resolve, entityAnimationDuration)),
    );
  }
  if (data.disposingEntities.length > 0) {
    animationPromises.push(new Promise((resolve) => setTimeout(resolve, 200)));
  }

  Promise.all(animationPromises).then(() => {
    onAnimationFinish?.();
  });

  const cards = currentCards.toSorted((a, b) => a.id - b.id);
  const characters = charactersMap
    .values()
    .toArray()
    .toSorted((a, b) => a.id - b.id);
  const entities = [
    ...currentEntities[0].supports,
    ...currentEntities[0].summons,
    ...currentEntities[1].supports,
    ...currentEntities[1].summons,
  ];

  // Apply steps to children
  for (const obj of [...characters, ...entities]) {
    obj.clickStep =
      availableSteps.find(
        (step): step is ClickEntityActionStep =>
          step.type === "clickEntity" && step.entityId === obj.id,
      ) ?? null;
    if (obj.clickStep) {
      obj.uiState.transform.z += 0.2;
    }
  }
  for (const card of cards) {
    card.playStep =
      availableSteps.find(
        (step) => step.type === "playCard" && step.cardId === card.id,
      ) ?? null;
    card.tuneStep =
      availableSteps.find(
        (step) => step.type === "elementalTunning" && step.cardId === card.id,
      ) ?? null;
  }

  return {
    cards,
    characters,
    entities,
    cardCountHints,
  };
}

export function Chessboard(props: ChessboardProps) {
  const [localProps, elProps] = splitProps(props, [
    "who",
    "data",
    "actionState",
    "onStepActionState",
    "class",
  ]);
  let chessboardElement!: HTMLDivElement;

  const { assetsApiEndPoint } = useUiContext();
  const { CardDataViewer, ...dataViewerController } = createCardDataViewer({
    includesImage: true,
    assetsApiEndPoint,
  });

  const [height, setHeight] = createSignal(0);
  const [width, setWidth] = createSignal(0);
  const onResize = () => {
    const unit = unitInPx();
    setHeight(chessboardElement.clientHeight / unit);
    setWidth(chessboardElement.clientWidth / unit);
  };
  const [selectingItem, setSelectingItem] = createSignal<number | null>(null);

  const [updateChildrenSignal, triggerUpdateChildren] =
    createSignal<UpdateSignal>({
      force: true,
    });
  const [getFocusingHands, setFocusingHands] = createSignal(false);
  const [getHoveringHand, setHoveringHand] = createSignal<CardInfo | null>(
    null,
  );
  const [getDraggingHand, setDraggingHand] =
    createSignal<DraggingCardInfo | null>(null);
  const canToggleHandFocus = createMemo(
    () => localProps.data.animatingCards.length === 0,
  );
  let shouldMoveWhenHandBlurring: PromiseWithResolvers<boolean>;

  const resizeObserver = new ResizeObserver(debounce(onResize, 200));

  const [children, setChildren] = createSignal<ChessboardChildren>({
    characters: [],
    cards: [],
    entities: [],
    cardCountHints: [],
  });

  createEffect(
    on(
      () => props.data,
      (data) => {
        const newChildren = rerenderChildren({
          who: localProps.who,
          size: [height(), width()],
          focusingHands: getFocusingHands(),
          showHands: props.actionState?.showHands ?? true,
          hoveringHand: getHoveringHand(),
          draggingHand: getDraggingHand(),
          data,
          availableSteps: props.actionState?.availableSteps ?? [],
        });
        setChildren(newChildren);
        triggerUpdateChildren({ force: true });
      },
    ),
  );
  createEffect(
    on(
      [
        () => [height(), width()] as Size,
        getFocusingHands,
        getHoveringHand,
        getDraggingHand,
        () => props.actionState,
      ],
      ([size, focusingHands, hoveringHand, draggingHand, actionState]) => {
        const newChildren = rerenderChildren({
          who: localProps.who,
          size,
          focusingHands,
          showHands: actionState?.showHands ?? true,
          hoveringHand,
          draggingHand,
          data: localProps.data,
          availableSteps: actionState?.availableSteps ?? [],
        });
        setChildren(newChildren);
        triggerUpdateChildren({ force: false });
      },
    ),
  );

  const [playerStatus, setPlayerStatus] = createStore<PbPlayerStatus[]>([
    PbPlayerStatus.UNSPECIFIED,
    PbPlayerStatus.UNSPECIFIED,
  ]);

  createEffect(() => {
    for (const who of [0, 1]) {
      if (localProps.data.playerStatus[who] !== null) {
        setPlayerStatus(who, localProps.data.playerStatus[who]);
      }
    }
  });

  // DEBUG
  createEffect(
    on(
      () => props.actionState,
      (actionState, prevActionState) => {
        console.log(actionState);
        if (actionState) {
          if (actionState.autoSelectedDice) {
            const dice = myDice();
            const selectingDice = Array.from(
              { length: dice.length },
              () => false,
            );
            for (const d of actionState.autoSelectedDice) {
              for (let i = 0; i < dice.length; i++) {
                if (dice[i] === d && !selectingDice[i]) {
                  selectingDice[i] = true;
                  break;
                }
              }
            }
            setSelectedDice(selectingDice);
          }
          if (actionState.alertText) {
            alert(actionState.alertText);
          }
          setDicePanelState(actionState.dicePanel);
        } else if (prevActionState) {
          // 退出行动时，取消所有的选择项
          dataViewerController.hide();
          setSelectingItem(null);
          setDicePanelState("hidden");
        }
      },
    ),
  );

  const [isShowCardHint, setShowCardHint] = createStore<
    Record<CardArea, number | null>
  >({
    myPile: null,
    oppPile: null,
    myHand: null,
    oppHand: null,
  });

  const showCardHint = (area: CardArea) => {
    const current = isShowCardHint[area];
    if (current !== null) {
      clearTimeout(current);
    }
    const timeout = window.setTimeout(() => {
      setShowCardHint(area, null);
    }, 500);
    setShowCardHint(area, timeout);
  };

  const [showDeclareEndButton, setShowDeclareEndButton] = createSignal(false);
  const declareEndMarkerProps = createMemo<DeclareEndMarkerProps>(() => {
    const canDeclareEnd = localProps.actionState?.availableSteps?.find(
      (s) => s.type === "declareEnd",
    );
    return {
      opp: localProps.data.state.currentTurn !== localProps.who,
      roundNumber: localProps.data.state.roundNumber,
      phase: localProps.data.state.phase,
      markerClickable: !!canDeclareEnd,
      showButton: showDeclareEndButton(),
      onClick: () => {
        if (canDeclareEnd) {
          if (!showDeclareEndButton()) {
            setShowDeclareEndButton(true);
          } else {
            setShowDeclareEndButton(false);
            localProps.onStepActionState(canDeclareEnd, []);
          }
        }
      },
    };
  });

  const playerInfoPropsOf = (who: 0 | 1): PlayerInfoProps => {
    const player = localProps.data.state.player[who];
    return {
      declaredEnd: player.declaredEnd,
      diceCount: player.dice.length,
      legendUsed: player.legendUsed,
      status: playerStatus[who],
    };
  };
  const myDice = createMemo(
    () => localProps.data.state.player[localProps.who].dice as DiceType[],
  );
  const mySkills = createMemo(
    () => localProps.data.state.player[localProps.who].initiativeSkill,
  );

  const [selectedDice, setSelectedDice] = createSignal<boolean[]>([]);
  const [dicePanelState, setDicePanelState] =
    createSignal<DicePanelState>("hidden");

  const selectedDiceValue = () => {
    const selected = selectedDice();
    return myDice().filter((_, i) => selected[i]);
  };
  // const onCardClick = (
  //   e: MouseEvent,
  //   currentTarget: HTMLElement,
  //   cardInfo: CardInfo,
  // ) => {};

  const onCardPointerEnter = (
    e: PointerEvent,
    currentTarget: HTMLElement,
    cardInfo: CardInfo,
  ) => {
    if (cardInfo.kind === "myHand") {
      setHoveringHand(cardInfo);
    }
  };
  const onCardPointerLeave = (
    e: PointerEvent,
    currentTarget: HTMLElement,
    cardInfo: CardInfo,
  ) => {
    if (getFocusingHands()) {
      setHoveringHand((c) => {
        if (c?.id === cardInfo.id) {
          return null;
        } else {
          return c;
        }
      });
    }
  };
  const onCardPointerDown = async (
    e: PointerEvent,
    currentTarget: HTMLElement,
    cardInfo: CardInfo,
  ) => {
    setShowDeclareEndButton(false);
    if (cardInfo.kind === "myHand" && cardInfo.uiState.type === "cardStatic") {
      // 弥补收起手牌时选中由于 z 的差距而导致的视觉不连贯
      let yAdjust = 0;
      if (!getFocusingHands()) {
        shouldMoveWhenHandBlurring = Promise.withResolvers();
        setTimeout(() => {
          shouldMoveWhenHandBlurring.resolve(true);
        }, 100);
        const doMove = await shouldMoveWhenHandBlurring.promise;
        if (canToggleHandFocus()) {
          setFocusingHands(true);
          showCardHint("myHand");
          setSelectingItem(null);
          dataViewerController.hide();
        }
        if (!doMove) {
          return;
        }
        yAdjust -= 3;
      }
      dataViewerController.showState("card", cardInfo.data);
      setSelectingItem(cardInfo.id);
      currentTarget.setPointerCapture(e.pointerId);
      const unit = unitInPx();
      const originalX = cardInfo.uiState.transform.x;
      const originalY = cardInfo.uiState.transform.y + yAdjust;
      const initialPointerX = e.clientX;
      const initialPointerY = e.clientY;
      const zRatio = (PERSPECTIVE - DRAGGING_Z) / PERSPECTIVE;
      setDraggingHand({
        id: cardInfo.id,
        x: originalX,
        y: originalY,
        moving: false,
        updatePos: (e2) => {
          const x =
            originalX + ((e2.clientX - initialPointerX) / unit) * zRatio;
          const y =
            originalY + ((e2.clientY - initialPointerY) / unit) * zRatio;
          return [x, y];
        },
      });
    } else if (
      cardInfo.kind === "myPile" ||
      cardInfo.kind === "oppHand" ||
      cardInfo.kind === "oppPile"
    ) {
      showCardHint(cardInfo.kind);
    }
  };
  const onCardPointerMove = (
    e: PointerEvent,
    currentTarget: HTMLElement,
    cardInfo: CardInfo,
  ) => {
    setDraggingHand((dragging) => {
      if (dragging?.id !== cardInfo.id) {
        return dragging;
      }
      shouldMoveWhenHandBlurring?.resolve(true);
      const size = [height(), width()] as Size;
      const [x, y] = dragging.updatePos(e);
      if (canToggleHandFocus()) {
        const shouldFocusingHand = shouldFocusHandWhenDragging(size, y);
        setFocusingHands(shouldFocusingHand);
        setShowCardHint("myHand", null);
      }
      // console.log(x, y);
      return {
        ...dragging,
        moving: true,
        x,
        y,
      };
    });
  };
  const onCardPointerUp = (
    e: PointerEvent,
    currentTarget: HTMLElement,
    cardInfo: CardInfo,
  ) => {
    shouldMoveWhenHandBlurring?.resolve(false);
    setDraggingHand((dragging) => {
      if (dragging?.id !== cardInfo.id) {
        return dragging;
      }
      return null;
    });
    if (!getFocusingHands()) {
      dataViewerController.hide();
      setSelectingItem(null);
    }
  };

  const onChessboardClick = () => {
    batch(() => {
      if (canToggleHandFocus()) {
        setFocusingHands(false);
        setShowCardHint("myHand", null);
      }
      setShowDeclareEndButton(false);
      setHoveringHand(null);
      dataViewerController.hide();
      setSelectingItem(null);
      if (localProps.actionState) {
        localProps.onStepActionState(CANCEL_ACTION_STEP, []);
      }
    });
  };

  const onCharacterAreaClick = (
    e: MouseEvent,
    currentTarget: HTMLElement,
    characterInfo: CharacterInfo,
  ) => {
    if (canToggleHandFocus()) {
      setFocusingHands(false);
      setShowCardHint("myHand", null);
    }
    setShowDeclareEndButton(false);
    dataViewerController.showState(
      "character",
      characterInfo.data,
      characterInfo.combatStatus.map((st) => st.data),
    );
    setSelectingItem(characterInfo.id);
    if (characterInfo.clickStep) {
      localProps.onStepActionState(characterInfo.clickStep, []);
    } else {
      localProps.onStepActionState(CANCEL_ACTION_STEP, []);
    }
  };

  const onEntityClick = (
    e: MouseEvent,
    currentTarget: HTMLElement,
    entityInfo: EntityInfo,
  ) => {
    if (canToggleHandFocus()) {
      setFocusingHands(false);
      setShowCardHint("myHand", null);
    }
    setShowDeclareEndButton(false);
    dataViewerController.showState(entityInfo.type, entityInfo.data);
    setSelectingItem(entityInfo.id);
  };

  onMount(() => {
    onResize();
    resizeObserver.observe(chessboardElement);
  });
  onCleanup(() => {
    resizeObserver.disconnect();
  });
  return (
    <div
      class={`gi-tcg-chessboard-new reset relative min-h-xl min-w-3xl bg-green-50 overflow-clip ${
        localProps.class ?? ""
      }`}
      {...elProps}
    >
      <div
        class="relative h-full w-full preserve-3d select-none"
        ref={chessboardElement}
        onClick={onChessboardClick}
        style={{
          perspective: `${PERSPECTIVE / 4}rem`,
        }}
      >
        <KeyWithAnimation
          each={children().characters}
          updateWhen={updateChildrenSignal()}
        >
          {(character) => (
            <CharacterArea
              {...character()}
              selecting={character().id === selectingItem()}
              onClick={(e, t) => onCharacterAreaClick(e, t, character())}
            />
          )}
        </KeyWithAnimation>
        <KeyWithAnimation
          each={children().cards}
          updateWhen={updateChildrenSignal()}
        >
          {(card) => (
            <Card
              {...card()}
              selecting={
                card().id === selectingItem() && card().kind !== "dragging"
              }
              realCost={props.actionState?.realCosts.cards.get(card().id)}
              // onClick={(e, t) => onCardClick(e, t, card())}
              onPointerEnter={(e, t) => onCardPointerEnter(e, t, card())}
              onPointerLeave={(e, t) => onCardPointerLeave(e, t, card())}
              onPointerDown={(e, t) => onCardPointerDown(e, t, card())}
              onPointerMove={(e, t) => onCardPointerMove(e, t, card())}
              onPointerUp={(e, t) => onCardPointerUp(e, t, card())}
            />
          )}
        </KeyWithAnimation>
        <KeyWithAnimation
          each={children().entities}
          updateWhen={updateChildrenSignal()}
        >
          {(entity) => (
            <Entity
              {...entity()}
              selecting={entity().id === selectingItem()}
              onClick={(e, t) => onEntityClick(e, t, entity())}
            />
          )}
        </KeyWithAnimation>
        <Key each={children().cardCountHints} by="area">
          {(hint) => (
            <CardCountHint
              {...hint()}
              shown={isShowCardHint[hint().area] !== null}
            />
          )}
        </Key>
        <ChessboardBackdrop shown={props.actionState?.showBackdrop} />
      </div>
      <DeclareEndMarker
        class="absolute left-2 top-50% translate-y--50%"
        {...declareEndMarkerProps()}
      />
      <PlayerInfo
        opp
        class="absolute top-0 bottom-[calc(50%+2.75rem)]"
        {...playerInfoPropsOf(flip(localProps.who))}
      />
      <PlayerInfo
        class="absolute top-[calc(50%+2.75rem)] bottom-0"
        {...playerInfoPropsOf(localProps.who)}
      />
      <DicePanel
        dice={myDice()}
        selectedDice={selectedDice()}
        onSelectDice={setSelectedDice}
        state={dicePanelState()}
        onStateChange={setDicePanelState}
      />
      <SkillButtonGroup
        class="absolute bottom-2 right-2"
        skills={mySkills()}
        switchActiveButton={
          localProps.actionState?.availableSteps.find(
            (s) => s.type === "clickSwitchActiveButton",
          ) ?? null
        }
        switchActiveCost={localProps.actionState?.realCosts.switchActive ?? []}
        onStepActionState={(s) =>
          localProps.onStepActionState(s, selectedDiceValue())
        }
        shown={!getFocusingHands() && !getDraggingHand()}
      />
      <RoundAndPhaseNotification
        who={localProps.who}
        roundNumber={localProps.data.state.roundNumber}
        currentTurn={localProps.data.state.currentTurn as 0 | 1}
        class="absolute left-0 w-full top-50% translate-y--50%"
        info={localProps.data.roundAndPhase}
      />
      <Show when={localProps.data.notificationBox} keyed>
        {(data) => <NotificationBox opp={data.who !== props.who} data={data} />}
      </Show>
      <Show when={localProps.data.playingCard} keyed>
        {(data) => <PlayingCard opp={data.who !== props.who} {...data} />}
      </Show>
      <div class="absolute inset-2 pointer-events-none">
        <CardDataViewer />
      </div>
    </div>
  );
}
