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
  PbDiceRequirement,
  PbDiceType,
  PbExposedMutation,
  PbPhaseType,
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
  on,
  onCleanup,
  onMount,
  Show,
  splitProps,
  type ComponentProps,
} from "solid-js";
import debounce from "debounce";
import {
  CARD_WIDTH,
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
  getTunningAreaPos,
  PERSPECTIVE,
  shouldFocusHandWhenDragging,
  TUNNING_AREA_WIDTH,
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
  NO_PREVIEW,
  type ActionState,
  type ActionStep,
  type ClickEntityActionStep,
  type ClickSkillButtonActionStep,
  type ClickSwitchActiveButtonActionStep,
  type ElementalTunningActionStep,
  type ParsedPreviewData,
  type PlayCardActionStep,
  type PreviewingCharacterInfo,
  type PreviewingEntityInfo,
} from "../action";
import { ChessboardBackdrop } from "./ChessboardBackdrop";
import { ActionHintText } from "./ActionHintText";
import { ConfirmButton } from "./ConfirmButton";
import { TuningArea } from "./TuningArea";
import { RerollDiceView } from "./RerollDiceView";
import { SelectCardView } from "./SelectCardView";
import { SwitchHandsView } from "./SwitchHandsView";
import { MutationViewer } from "./MutationViewer";

export type CardArea = "myPile" | "oppPile" | "myHand" | "oppHand";

export interface CardInfo {
  id: number;
  data: PbCardState;
  kind: CardArea | "switching" | "animating" | "dragging";
  uiState: CardUiState;
  enableShadow: boolean;
  enableTransition: boolean;
  playStep: PlayCardActionStep | null;
  tuneStep: ElementalTunningActionStep | null;
}

export interface DraggingCardInfo {
  id: number;
  data: PbCardState;
  x: number;
  y: number;
  status: "start" | "moving" | "end";
  tuneStep: ElementalTunningActionStep | null;
  updatePos: (e: PointerEvent) => Pos;
}

export interface CharacterInfo {
  id: number;
  data: PbCharacterState;
  entities: StatusInfo[];
  combatStatus: StatusInfo[];
  opp: boolean;
  active: boolean;
  triggered: boolean;
  uiState: CharacterUiState;
  preview: PreviewingCharacterInfo | null;
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
  previewingNew: boolean;
  preview: PreviewingEntityInfo | null;
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

export interface SkillInfo {
  id: number | "switchActive";
  cost: PbDiceRequirement[];
  realCost?: PbDiceRequirement[];
  step: ClickSkillButtonActionStep | ClickSwitchActiveButtonActionStep | null;
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

export type ChessboardViewType =
  | "normal"
  | "rerollDice"
  | "switchHands"
  | "selectCard"
  | "rerollDiceEnd"
  | "switchHandsEnd";

export interface ChessboardProps extends ComponentProps<"div"> {
  who: 0 | 1;
  /**
   * 从 notify 传入的 state & mutations 经过解析后得到的棋盘数据
   */
  data: ChessboardData;
  /**
   * 从 rpc 解析后的状态
   */
  actionState: ActionState | null;
  viewType: ChessboardViewType;
  selectCardCandidates: number[];
  onStepActionState?: StepActionStateHandler;
  onRerollDice?: (dice: PbDiceType[]) => void;
  onSwitchHands?: (cardIds: number[]) => void;
  onSelectCard?: (cardDefId: number) => void;
  onGiveUp?: () => void;
}

type MyHandState =
  | "focusing" // 聚焦手牌显示
  | "blurred" // 正常收起手牌
  | "hidden" // 不显示手牌（行动中）
  | "switching"; // 替换手牌中

interface CardInfoCalcContext {
  who: 0 | 1;
  size: Size;
  myHandState: MyHandState;
  hoveringHand: CardInfo | null;
  draggingHand: DraggingCardInfo | null;
  availableSteps: ActionStep[];
}

function calcCardsInfo(
  state: PbGameState,
  ctx: CardInfoCalcContext,
): CardInfo[] {
  const { who, size, myHandState, hoveringHand, availableSteps } = ctx;
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
          draggingEndAnimation: false,
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

    const isFocus = !opp && myHandState === "focusing";
    const isSwitching = !opp && myHandState === "switching";
    const z = isSwitching ? DRAGGING_Z : isFocus ? FOCUSING_HANDS_Z : 1;
    const ry = isFocus ? 1 : opp ? 181 : 1;

    let hoveringHandIndex: number | null = handCard.findIndex(
      (card) => card.id === hoveringHand?.id,
    );
    if (hoveringHandIndex === -1) {
      hoveringHandIndex = null;
    }

    for (let i = 0; i < totalHandCardCount; i++) {
      const card = handCard[i];
      const playStep =
        availableSteps.find(
          (step): step is PlayCardActionStep =>
            step.type === "playCard" && step.cardId === card.id,
        ) ?? null;
      const tuneStep =
        availableSteps.find(
          (step): step is ElementalTunningActionStep =>
            step.type === "elementalTunning" && step.cardId === card.id,
        ) ?? null;

      if (ctx.draggingHand?.id === card.id) {
        continue;
      }
      let x, y;
      if (!opp && myHandState === "switching") {
        [x, y] = getShowingCardPos(size, totalHandCardCount, i);
      } else if (!opp && myHandState === "focusing") {
        [x, y] = getHandCardFocusedPos(
          size,
          totalHandCardCount,
          i,
          hoveringHandIndex,
        );
      } else {
        [x, y] = getHandCardBlurredPos(
          size,
          opp,
          ctx.myHandState !== "hidden",
          totalHandCardCount,
          i,
          skillCount,
        );
      }
      cards.push({
        id: card.id,
        data: card,
        kind: opp ? "oppHand" : isSwitching ? "switching" : "myHand",
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
          draggingEndAnimation: false,
        },
        enableShadow: true,
        enableTransition: true,
        playStep,
        tuneStep,
      });
    }
  }

  // Dragging
  if (ctx.draggingHand) {
    const { x, y, status, id, data } = ctx.draggingHand;
    const playStep =
      availableSteps.find(
        (step): step is PlayCardActionStep =>
          step.type === "playCard" && step.cardId === id,
      ) ?? null;
    const tuneStep =
      availableSteps.find(
        (step): step is ElementalTunningActionStep =>
          step.type === "elementalTunning" && step.cardId === id,
      ) ?? null;

    cards.push({
      id,
      data,
      kind: "dragging",
      uiState: {
        type: "cardStatic",
        isAnimating: false,
        transform: {
          x,
          y,
          z: DRAGGING_Z,
          ry: 0,
          rz: 0,
        },
        draggingEndAnimation: status === "end",
      },
      enableShadow: true,
      enableTransition: status === "start",
      playStep,
      tuneStep,
    });
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
  previewData: ParsedPreviewData;
  availableSteps: ActionStep[];
}

function calcEntitiesInfo(
  state: PbGameState,
  { who, size, previewData, availableSteps }: EntityInfoCalcContext,
): CalcEntitiesInfoResult[] {
  const result: CalcEntitiesInfoResult[] = [];
  const calcEntityInfo =
    (
      opp: boolean,
      type: "support" | "summon",
      previewingNew: boolean,
      baseIndex = 0,
    ) =>
    (data: PbEntityState, index: number): EntityInfo => {
      const [x, y] = getEntityPos(size, opp, type, index + baseIndex);
      const preview = previewData.entities.get(data.id) ?? null;
      const clickStep =
        availableSteps.find(
          (step): step is ClickEntityActionStep =>
            step.type === "clickEntity" && step.entityId === data.id,
        ) ?? null;
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
            z: previewingNew || preview || clickStep ? 0.2 : 0,
            ry: 0,
            rz: 0,
          },
        },
        previewingNew,
        preview,
        clickStep,
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
    const supports = player.support.map(calcEntityInfo(opp, "support", false));
    supports.push(
      ...(previewData.newEntities.get(`support${who2}`) ?? []).map(
        calcEntityInfo(opp, "support", true, supports.length),
      ),
    );
    const summons = player.summon.map(calcEntityInfo(opp, "summon", false));
    summons.push(
      ...(previewData.newEntities.get(`summon${who2}`) ?? []).map(
        calcEntityInfo(opp, "summon", true, summons.length),
      ),
    );
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

export interface TunningAreaInfo {
  draggingHand: DraggingCardInfo | null;
  cardHovering: boolean;
  transform: Transform;
}

interface ChessboardChildren {
  characters: CharacterInfo[];
  cards: CardInfo[];
  entities: EntityInfo[];
  cardCountHints: CardCountHintInfo[];
  tunningArea: TunningAreaInfo | null;
}

function rerenderChildren(opt: {
  who: 0 | 1;
  size: Size;
  myHandState: MyHandState;
  hoveringHand: CardInfo | null;
  draggingHand: DraggingCardInfo | null;
  data: ChessboardData;
  previewData: ParsedPreviewData;
  availableSteps: ActionStep[];
}): ChessboardChildren {
  const {
    size,
    myHandState,
    hoveringHand,
    draggingHand,
    data,
    previewData,
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
    myHandState,
    hoveringHand,
    draggingHand,
    availableSteps,
  });

  if (animatingCards.length > 0) {
    const previousCards = calcCardsInfo(previousState, {
      who: opt.who,
      size,
      myHandState,
      hoveringHand,
      draggingHand,
      availableSteps: [],
    });
    const showingCards = Map.groupBy(animatingCards, (x) => x.delay);
    let totalDelayMs = 0;
    for (const d of showingCards
      .keys()
      .toArray()
      .toSorted((a, b) => a - b)) {
      const currentAnimatingCards = showingCards.get(d)!;
      const currentShowingCards =
        myHandState === "switching"
          ? []
          : currentAnimatingCards
              .filter((card) => card.showing)
              .toSorted((x, y) => x.data.definitionId - y.data.definitionId);
      let currentDurationMs = 0;
      for (const animatingCard of currentAnimatingCards) {
        if (draggingHand?.id === animatingCard.data.id) {
          continue;
        }
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
    previewData,
    availableSteps,
  });
  if (data.disposingEntities.length > 0) {
    const previousEntities = calcEntitiesInfo(previousState, {
      who: opt.who,
      size,
      previewData: NO_PREVIEW,
      availableSteps: [],
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
      const isMyActive = !opp && isActive;
      const [x, y] = getCharacterAreaPos(
        size,
        opp,
        totalCharacterCount,
        i,
        isActive,
      );
      const { promise, resolve } = Promise.withResolvers<void>();
      const preview = previewData.characters.get(ch.id) ?? null;
      const clickStep =
        availableSteps.find(
          (step): step is ClickEntityActionStep =>
            step.type === "clickEntity" &&
            (step.entityId === ch.id ||
              (step.entityId === "myActiveCharacter" && isMyActive)),
        ) ?? null;
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
            z: clickStep || preview ? 0.2 : 0,
            ry: 0,
            rz: 0,
          },
          damages: [],
          animation: CHARACTER_ANIMATION_NONE,
          onAnimationFinish: resolve,
        },
        opp,
        active: isActive,
        preview,
        combatStatus: isActive ? combatStatus : [],
        clickStep,
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

  const [tunningAreaX, tunningAreaY] = getTunningAreaPos(size, draggingHand);
  const tunningArea: TunningAreaInfo = {
    draggingHand,
    cardHovering: draggingHand
      ? draggingHand.x + CARD_WIDTH > tunningAreaX
      : false,
    transform: {
      x: tunningAreaX,
      y: tunningAreaY,
      z: 11.99,
      ry: 0,
      rz: 0,
    },
  };

  return {
    cards,
    characters,
    entities,
    cardCountHints,
    tunningArea,
  };
}

type SelectingItem =
  | {
      type: "card";
      info: CardInfo;
    }
  | {
      type: "entity";
      info: EntityInfo;
    }
  | {
      type: "character";
      info: CharacterInfo;
    }
  | {
      type: "skill";
      info: SkillInfo & { id: number };
    };

export function Chessboard(props: ChessboardProps) {
  const [localProps, elProps] = splitProps(props, [
    "who",
    "data",
    "actionState",
    "viewType",
    "selectCardCandidates",
    "onStepActionState",
    "onRerollDice",
    "onSwitchHands",
    "onSelectCard",
    "onGiveUp",
    "class",
  ]);
  let chessboardElement!: HTMLDivElement;

  const { assetsManager } = useUiContext();
  const { CardDataViewer, ...dataViewerController } = createCardDataViewer({
    includesImage: true,
    assetsManager,
  });
  const [selectingItem, setSelectingItem] = createSignal<SelectingItem | null>(
    null,
  );
  createEffect(() => {
    const item = selectingItem();
    if (item === null) {
      dataViewerController.hide();
    } else if (item.type === "card") {
      dataViewerController.showState("card", item.info.data);
    } else if (item.type === "character") {
      dataViewerController.showState(
        "character",
        item.info.data,
        item.info.combatStatus.map((x) => x.data),
      );
    } else if (item.type === "entity") {
      dataViewerController.showState(item.info.type, item.info.data);
    } else if (item.type === "skill") {
      dataViewerController.showSkill(item.info.id);
    }
  });

  const [height, setHeight] = createSignal(0);
  const [width, setWidth] = createSignal(0);
  const onResize = () => {
    const unit = unitInPx();
    setHeight(chessboardElement.clientHeight / unit);
    setWidth(chessboardElement.clientWidth / unit);
  };

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
    tunningArea: null,
  });

  const [allMutations, setAllMutations] = createSignal<PbExposedMutation[][]>(
    [],
  );

  const getHandState = (
    focusing: boolean,
    viewType: ChessboardViewType,
    actionState: ActionState | null,
  ): MyHandState => {
    if (viewType === "switchHands" || viewType === "switchHandsEnd") {
      return "switching";
    } else if (actionState && !actionState.showHands) {
      return "hidden";
    } else {
      return focusing ? "focusing" : "blurred";
    }
  };

  createEffect(
    on(
      () => localProps.data,
      (data) => {
        const newChildren = rerenderChildren({
          who: localProps.who,
          size: [height(), width()],
          myHandState: getHandState(
            getFocusingHands(),
            localProps.viewType,
            localProps.actionState,
          ),
          hoveringHand: getHoveringHand(),
          draggingHand: getDraggingHand(),
          data,
          previewData: localProps.actionState?.previewData ?? NO_PREVIEW,
          availableSteps: localProps.actionState?.availableSteps ?? [],
        });
        setChildren(newChildren);
        triggerUpdateChildren({ force: true });
        setAllMutations((prev) => [...prev, data.raw]);
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
        () => localProps.actionState,
        () => localProps.viewType,
      ],
      ([
        size,
        focusingHands,
        hoveringHand,
        draggingHand,
        actionState,
        viewType,
      ]) => {
        const newChildren = rerenderChildren({
          who: localProps.who,
          size,
          myHandState: getHandState(focusingHands, viewType, actionState),
          hoveringHand,
          draggingHand,
          data: localProps.data,
          previewData: actionState?.previewData ?? NO_PREVIEW,
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

  /**
   * on actionState change:
   * - set/unset selected dice
   * - trigger alert
   *
   */
  createEffect(
    on(
      () => localProps.actionState,
      (actionState, prevActionState) => {
        // DEBUG
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
          // 保持 draggingHand.status === "end" 以播放完整动画
          // setDraggingHand(null);
          setSelectingItem(null);
          setDicePanelState("hidden");
          setSelectedDice([]);
        }
      },
    ),
  );

  createEffect(() => {
    setSelectingItem(null);
  });

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
            localProps.onStepActionState?.(canDeclareEnd, []);
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
  const findSkillStep = (
    steps: ActionStep[],
    id: SkillInfo["id"],
  ): ClickSkillButtonActionStep | null => {
    return (
      steps.find(
        (s): s is ClickSkillButtonActionStep =>
          s.type === "clickSkillButton" && s.skillId === id,
      ) ?? null
    );
  };
  const mySkills = createMemo<SkillInfo[]>(() => {
    const actionState = localProps.actionState;
    const steps = actionState?.availableSteps ?? [];
    const realCosts = actionState?.realCosts.skills;
    return localProps.data.state.player[localProps.who].initiativeSkill.map(
      (sk) => ({
        id: sk.definitionId,
        cost: sk.definitionCost,
        realCost: realCosts?.get(sk.definitionId),
        step: findSkillStep(steps, sk.definitionId),
      }),
    );
  });
  const switchActiveStep = createMemo(
    () =>
      localProps.actionState?.availableSteps.find(
        (s) => s.type === "clickSwitchActiveButton",
      ),
  );
  const showSkillButtons = createMemo(() => {
    const shown = !getFocusingHands() && getDraggingHand()?.status !== "moving";
    if (localProps.actionState) {
      return shown && localProps.actionState.showSkillButtons;
    } else {
      return shown;
    }
  });

  const [selectedDice, setSelectedDice] = createSignal<boolean[]>([]);
  const [dicePanelState, setDicePanelState] =
    createSignal<DicePanelState>("hidden");

  const selectedDiceValue = () => {
    const selected = selectedDice();
    return myDice().filter((_, i) => selected[i]);
  };

  const [switchedCards, setSwitchedCards] = createSignal<number[]>([]);

  const onCardClick = (
    e: MouseEvent,
    currentTarget: HTMLElement,
    cardInfo: CardInfo,
  ) => {
    if (cardInfo.kind === "switching") {
      setSwitchedCards((c) => {
        const index = c.indexOf(cardInfo.id);
        if (index === -1) {
          return [...c, cardInfo.id];
        } else {
          return c.filter((_, i) => i !== index);
        }
      });
      setSelectingItem({ type: "card", info: cardInfo });
    }
  };

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
      localProps.onStepActionState?.(CANCEL_ACTION_STEP, []);
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
        }
        if (!doMove) {
          return;
        }
        yAdjust -= 3;
      }
      setSelectingItem({ type: "card", info: cardInfo });
      currentTarget.setPointerCapture(e.pointerId);
      const unit = unitInPx();
      const originalX = cardInfo.uiState.transform.x;
      const originalY = cardInfo.uiState.transform.y + yAdjust;
      const initialPointerX = e.clientX;
      const initialPointerY = e.clientY;
      const zRatio = (PERSPECTIVE - DRAGGING_Z) / PERSPECTIVE;
      setDraggingHand({
        id: cardInfo.id,
        data: cardInfo.data,
        x: originalX,
        y: originalY,
        status: "start",
        tuneStep: cardInfo.tuneStep ?? null,
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
    const dragging = getDraggingHand();
    if (dragging?.id !== cardInfo.id) {
      return;
    }
    if (dragging.status === "end") {
      return;
    }
    shouldMoveWhenHandBlurring?.resolve(true);
    const size = [height(), width()] as Size;
    const [x, y] = dragging.updatePos(e);
    if (canToggleHandFocus()) {
      const shouldFocusingHand = shouldFocusHandWhenDragging(size, y);
      setFocusingHands(shouldFocusingHand);
      setShowCardHint("myHand", null);
    }
    setDraggingHand({
      ...dragging,
      status: "moving",
      x,
      y,
    });
  };
  const onCardPointerUp = (
    e: PointerEvent,
    currentTarget: HTMLElement,
    cardInfo: CardInfo,
  ) => {
    shouldMoveWhenHandBlurring?.resolve(false);
    const dragging = getDraggingHand();
    const focusingHands = getFocusingHands();
    if (dragging?.id !== cardInfo.id) {
      return;
    }
    const [tunningAreaX] = getTunningAreaPos([0, width()], dragging);
    if (cardInfo.tuneStep && dragging.x + CARD_WIDTH > tunningAreaX) {
      localProps.onStepActionState?.(cardInfo.tuneStep, selectedDiceValue());
      setDraggingHand({ ...dragging, status: "end" });
      return;
    }
    if (!focusingHands && cardInfo.playStep) {
      localProps.onStepActionState?.(cardInfo.playStep, selectedDiceValue());
      setDraggingHand({ ...dragging, status: "end" });
    } else {
      setDraggingHand(null);
    }
    if (!focusingHands) {
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
      setDraggingHand(null);
      setHoveringHand(null);
      setSelectingItem(null);
      if (localProps.actionState) {
        localProps.onStepActionState?.(CANCEL_ACTION_STEP, []);
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
    setSelectingItem({ type: "character", info: characterInfo });
    if (characterInfo.clickStep) {
      localProps.onStepActionState?.(
        characterInfo.clickStep,
        selectedDiceValue(),
      );
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
    setSelectingItem({ type: "entity", info: entityInfo });
    if (entityInfo.clickStep) {
      localProps.onStepActionState?.(entityInfo.clickStep, selectedDiceValue());
    }
  };

  const onSkillClick = (sk: SkillInfo) => {
    if (sk.id === "switchActive") {
      const step = switchActiveStep();
      if (step) {
        localProps.onStepActionState?.(step, selectedDiceValue());
      }
    } else {
      setSelectingItem({ type: "skill", info: { ...sk, id: sk.id } });
      const step = localProps.actionState?.availableSteps.find(
        (s) => s.type === "clickSkillButton" && s.skillId === sk.id,
      );
      if (step) {
        localProps.onStepActionState?.(step, selectedDiceValue());
      }
    }
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
              selecting={character().id === selectingItem()?.info.id}
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
              selected={
                card().id === selectingItem()?.info.id &&
                card().kind !== "dragging"
              }
              toBeSwitched={
                card().kind === "switching" &&
                switchedCards().includes(card().id)
              }
              realCost={localProps.actionState?.realCosts.cards.get(card().id)}
              onClick={(e, t) => onCardClick(e, t, card())}
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
              selecting={entity().id === selectingItem()?.info.id}
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
        <ChessboardBackdrop
          shown={
            localProps.viewType === "switchHands" ||
            localProps.actionState?.showBackdrop
          }
          onClick={onChessboardClick}
        />
        <Show when={children().tunningArea}>
          {(tunningArea) => <TuningArea {...tunningArea()} />}
        </Show>
      </div>
      <ActionHintText
        class="absolute left-50% top-50% translate-x--50% translate-y--50%"
        text={localProps.actionState?.hintText}
      />
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
        disabledDiceTypes={localProps.actionState?.disabledDiceTypes ?? []}
        onSelectDice={setSelectedDice}
        state={dicePanelState()}
        onStateChange={setDicePanelState}
      />
      <SkillButtonGroup
        class="absolute bottom-2 right-2"
        skills={mySkills()}
        switchActiveButton={switchActiveStep() ?? null}
        switchActiveCost={
          localProps.actionState?.realCosts.switchActive ?? null
        }
        onClick={onSkillClick}
        shown={showSkillButtons()}
      />
      <ConfirmButton
        class="absolute top-80% left-50% translate-x--50%"
        step={localProps.actionState?.availableSteps.find(
          (s) => s.type === "clickConfirmButton",
        )}
        onClick={(step) => {
          localProps.onStepActionState?.(step, selectedDiceValue());
        }}
      />
      <RoundAndPhaseNotification
        who={localProps.who}
        roundNumber={localProps.data.state.roundNumber}
        currentTurn={localProps.data.state.currentTurn as 0 | 1}
        class="absolute left-0 w-full top-50% translate-y--50%"
        info={localProps.data.roundAndPhase}
      />
      <Show when={localProps.data.notificationBox} keyed>
        {(data) => (
          <NotificationBox opp={data.who !== localProps.who} data={data} />
        )}
      </Show>
      <Show when={localProps.data.playingCard} keyed>
        {(data) => <PlayingCard opp={data.who !== localProps.who} {...data} />}
      </Show>
      <RerollDiceView
        viewType={localProps.viewType}
        dice={myDice()}
        selectedDice={selectedDice()}
        onSelectDice={setSelectedDice}
        onConfirm={() => {
          localProps.onRerollDice?.(selectedDiceValue() as PbDiceType[]);
          setSelectedDice([]);
        }}
      />
      <SelectCardView
        viewType={localProps.viewType}
        candidateIds={localProps.selectCardCandidates}
        onClickCard={(id) => {
          dataViewerController.showCard(id);
        }}
        onConfirm={(id) => {
          localProps.onSelectCard?.(id);
          dataViewerController.hide();
        }}
      />
      <SwitchHandsView
        viewType={localProps.viewType}
        onConfirm={() => {
          localProps.onSwitchHands?.(switchedCards());
          dataViewerController.hide();
        }}
      />
      <div class="absolute inset-2 pointer-events-none">
        <CardDataViewer />
      </div>
      <MutationViewer who={localProps.who} mutations={allMutations()} />
      <Show
        when={localProps.data.state.phase === PbPhaseType.GAME_END}
        fallback={
          <button
            class="absolute right-12 top-2 h-8 w-8 flex items-center justify-center rounded-full b-red-800 b-1 bg-red-500 hover:bg-red-600 active:bg-red-600 text-white transition-colors line-height-none cursor-pointer"
            title="放弃对局"
            onClick={() => {
              if (confirm("确定放弃对局吗？")) {
                localProps.onGiveUp?.();
              }
            }}
          >
            &#10005;
          </button>
        }
      >
        <div class="absolute inset-0 bg-black/60 flex items-center justify-center font-bold text-4xl text-white">
          {localProps.data.state.winner === localProps.who ? "胜利" : "失败"}
        </div>
      </Show>
    </div>
  );
}
