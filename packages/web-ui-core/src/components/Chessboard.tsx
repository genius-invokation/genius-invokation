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
  DRAGGING_Z,
  FOCUSING_HANDS_Z,
  getCharacterAreaPos,
  getEntityPos,
  getHandCardBlurredPos,
  getHandCardFocusedPos,
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

export interface CardInfo {
  id: number;
  data: PbCardState;
  kind: "pile" | "myHand" | "oppHand" | "animating" | "dragging";
  uiState: CardUiState;
  enableShadow: boolean;
  enableTransition: boolean;
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
}

export interface StatusInfo {
  id: number;
  data: PbEntityState;
  animation: "none" | "entering" | "disposing";
  triggered: boolean;
}

export interface EntityInfo extends StatusInfo {
  uiState: EntityUiState;
}

export interface AnimatingCardInfo {
  data: PbCardState;
  delay: number;
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

export interface ChessboardProps extends ComponentProps<"div"> {
  who: 0 | 1;
  data: ChessboardData;
}

interface CardInfoCalcContext {
  who: 0 | 1;
  size: Size;
  focusingHands: boolean;
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
        kind: "pile",
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
      });
    }

    // Hand
    const handCard = player.handCard.toSorted(
      (a, b) => a.definitionId - b.definitionId,
    );
    const totalHandCardCount = handCard.length;

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
        });
        continue;
      }
      const [x, y] = isFocus
        ? getHandCardFocusedPos(size, totalHandCardCount, i, hoveringHandIndex)
        : getHandCardBlurredPos(size, opp, totalHandCardCount, i);
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
            z: z, //+ +(i === hoveringHandIndex),
            // zIndex: 10 + i,
            ry,
            rz: 0,
          },
        },
        enableShadow: true,
        enableTransition: true,
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

interface ChessboardChildren {
  characters: CharacterInfo[];
  cards: CardInfo[];
  entities: EntityInfo[];
}

function rerenderChildren(opt: {
  who: 0 | 1;
  size: Size;
  focusingHands: boolean;
  hoveringHand: CardInfo | null;
  draggingHand: DraggingCardInfo | null;
  data: ChessboardData;
}): ChessboardChildren {
  const { size, focusingHands, hoveringHand, draggingHand, data } = opt;
  // console.log(data);

  const { damages, onAnimationFinish, animatingCards, state, previousState } =
    data;

  const animationPromises: Promise<void>[] = [];
  const currentCards = calcCardsInfo(state, {
    who: opt.who,
    size,
    focusingHands,
    hoveringHand,
    draggingHand,
  });

  if (animatingCards.length > 0) {
    const previousCards = calcCardsInfo(previousState, {
      who: opt.who,
      size,
      focusingHands,
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
        .filter((card) => card.data.definitionId !== 0)
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

  const characters = new Map<number, CharacterInfo>();
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
      characters.set(ch.id, {
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
      });
      animationPromises.push(promise);
    }
  }
  for (const damage of damages) {
    const source = characters.get(damage.sourceId);
    const target = characters.get(damage.targetId)!;
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

  if (data.notificationBox) {
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

  return {
    cards: currentCards.toSorted((a, b) => a.id - b.id),
    characters: characters
      .values()
      .toArray()
      .toSorted((a, b) => a.id - b.id),
    entities: [
      ...currentEntities[0].supports,
      ...currentEntities[0].summons,
      ...currentEntities[1].supports,
      ...currentEntities[1].summons,
    ],
  };
}

export function Chessboard(props: ChessboardProps) {
  const [localProps, elProps] = splitProps(props, ["who", "data", "class"]);
  let chessboardElement!: HTMLDivElement;

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
  });

  createEffect(
    on(
      () => props.data,
      (data) => {
        const newChildren = rerenderChildren({
          who: localProps.who,
          size: [height(), width()],
          focusingHands: getFocusingHands(),
          hoveringHand: getHoveringHand(),
          draggingHand: getDraggingHand(),
          data,
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
      ],
      ([size, focusingHands, hoveringHand, draggingHand]) => {
        const newChildren = rerenderChildren({
          who: localProps.who,
          size,
          focusingHands,
          hoveringHand,
          draggingHand,
          data: localProps.data,
        });
        setChildren(newChildren);
        triggerUpdateChildren({ force: false });
      },
    ),
  );

  const playerInfoPropsOf = (who: 0 | 1): PlayerInfoProps => {
    const player = localProps.data.state.player[who];
    return {
      declaredEnd: player.declaredEnd,
      diceCount: player.dice.length,
      legendUsed: player.legendUsed,
      status: PbPlayerStatus.UNSPECIFIED, // TODO
    };
  };

  const onCardClick = (
    e: MouseEvent,
    currentTarget: HTMLElement,
    cardInfo: CardInfo,
  ) => {};

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
        }
        if (!doMove) {
          return;
        }
        yAdjust -= 3;
      }
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
  };

  const onChessboardClick = () => {
    if (canToggleHandFocus()) {
      setFocusingHands(false);
    }
    setHoveringHand(null);
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
        onPointerDown={onChessboardClick}
        style={{
          perspective: `${PERSPECTIVE / 4}rem`,
        }}
      >
        <KeyWithAnimation
          each={children().characters}
          updateWhen={updateChildrenSignal()}
        >
          {(character) => <CharacterArea {...character()} />}
        </KeyWithAnimation>
        <KeyWithAnimation
          each={children().cards}
          updateWhen={updateChildrenSignal()}
        >
          {(card) => (
            <Card
              {...card()}
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
          {(entity) => <Entity {...entity()} />}
        </KeyWithAnimation>
      </div>
      <div
        class="absolute h-16 w-16 rounded-full left-2 top-50% translate-y--50% data-[opp=true]:bg-blue-300 data-[opp=false]:bg-yellow-300 b-white b-3 flex flex-col items-center justify-center"
        data-opp={localProps.data.state.currentTurn !== localProps.who}
      >
        T{localProps.data.state.roundNumber}
      </div>
      <Show when={localProps.data.notificationBox} keyed>
        {(data) => <NotificationBox opp={data.who !== props.who} data={data} />}
      </Show>
      <PlayerInfo
        opp
        class="absolute top-0 bottom-[calc(50%+2.75rem)]"
        {...playerInfoPropsOf(flip(localProps.who))}
      />
      <PlayerInfo
        class="absolute top-[calc(50%+2.75rem)] bottom-0"
        {...playerInfoPropsOf(localProps.who)}
      />
    </div>
  );
}
