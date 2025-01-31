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
  PbCardState,
  PbCharacterState,
  PbGameState,
} from "@gi-tcg/typings";
import {
  Card,
  type CardProps,
  type CardTransform,
  type CardUiState,
  type StaticCardUiState,
} from "./Card";
import { createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { flip } from "@gi-tcg/utils";
import { Key } from "@solid-primitives/keyed";
import {
  DRAGGING_Z,
  getCharacterAreaPos,
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
import { CharacterArea } from "./CharacterArea";

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
  x: number;
  y: number;
  z: number;
  zIndex: number;
  rz: number;
}

export interface AnimatingCardInfo {
  data: PbCardState;
  delay: number;
}

export interface ChessboardProps {
  class?: string;
  /** 保存上一个状态以计算动画效果 */
  previousState: PbGameState;
  state: PbGameState;
  animatingCards: AnimatingCardInfo[];
  who: 0 | 1;
}

export interface CardInfoCalcContext {
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
          type: "static",
          transform: {
            x,
            y,
            z: (pileSize - 1 - i) / 4,
            // zIndex: 10 + pileSize - 1 - i,
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
    const z = isFocus ? DRAGGING_Z : 2;
    const ry = isFocus ? 0 : opp ? 185 : 5;

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
            type: "static",
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
          type: "static",
          transform: {
            x,
            y,
            z,
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

export function Chessboard(props: ChessboardProps) {
  let chessboardElement!: HTMLDivElement;
  const [height, setHeight] = createSignal(0);
  const [width, setWidth] = createSignal(0);
  const onResize = () => {
    const unit = unitInPx();
    setHeight(chessboardElement.clientHeight / unit);
    setWidth(chessboardElement.clientWidth / unit);
  };

  const [getFocusingHands, setFocusingHands] = createSignal(false);
  const [getHoveringHand, setHoveringHand] = createSignal<CardInfo | null>(
    null,
  );
  const [getDraggingHand, setDraggingHand] =
    createSignal<DraggingCardInfo | null>(null);
  const canToggleHandFocus = createMemo(
    () => props.animatingCards.length === 0,
  );
  let shouldMoveWhenHandBlurring: PromiseWithResolvers<boolean>;

  const resizeObserver = new ResizeObserver(onResize);

  const cards = createMemo(() => {
    const who = props.who;
    const size = [height(), width()] as Size;
    const focusingHands = getFocusingHands();
    const hoveringHand = getHoveringHand();
    const draggingHand = getDraggingHand();

    const animatingCards = props.animatingCards;
    const currentCards = calcCardsInfo(props.state, {
      who,
      size,
      focusingHands,
      hoveringHand,
      draggingHand,
    });

    if (animatingCards.length > 0) {
      const previousCards = calcCardsInfo(props.previousState, {
        who,
        size,
        focusingHands,
        hoveringHand,
        draggingHand,
      });
      const showingCards = Map.groupBy(animatingCards, (x) => x.delay);
      for (const animatingCard of animatingCards) {
        const start = previousCards.find(
          (card) => card.id === animatingCard.data.id,
        );
        const startTransform = start
          ? (start.uiState as StaticCardUiState).transform
          : null;

        const endIndex = currentCards.findIndex(
          (card) => card.id === animatingCard.data.id,
        );
        let endTransform: CardTransform | null = null;
        if (endIndex !== -1) {
          endTransform = (currentCards[endIndex].uiState as StaticCardUiState)
            .transform;
          currentCards.splice(endIndex, 1);
        }

        const currentShowingCards = showingCards
          .get(animatingCard.delay)!
          .filter((card) => card.data.definitionId !== 0)
          .toSorted((x, y) => x.data.definitionId - y.data.definitionId);
        const index = currentShowingCards.indexOf(animatingCard);
        const [x, y] = getShowingCardPos(
          size,
          currentShowingCards.length,
          index,
        );
        const middleTransform: CardTransform = {
          x,
          y,
          z: 20,
          // zIndex: 100,
          ry: 5,
          rz: 0,
        };
        currentCards.push({
          id: animatingCard.data.id,
          data: animatingCard.data,
          kind: "animating",
          uiState: {
            type: "animation",
            start: startTransform,
            middle:
              animatingCard.data.definitionId === 0 ? null : middleTransform,
            end: endTransform,
            duration: 1500, // todo
            delay: animatingCard.delay * 1500, // todo
          },
          enableShadow: true,
          enableTransition: false,
        });
      }
    }

    return currentCards; //.toSorted((a, b) => a.id - b.id);
  });

  const characters = createMemo(() => {
    const size = [height(), width()] as Size;
    const characters: CharacterInfo[] = [];
    for (const who of [0, 1] as const) {
      const player = props.state.player[who];
      const opp = who !== props.who;

      const totalCharacterCount = player.character.length;
      for (let i = 0; i < totalCharacterCount; i++) {
        const ch = player.character[i];
        const [x, y] = getCharacterAreaPos(size, opp, totalCharacterCount, i);

        characters.push({
          id: ch.id,
          data: ch,
          x,
          y,
          z: 0,
          zIndex: 0,
          rz: 0,
        });
      }
    }
    return characters.toSorted((a, b) => a.id - b.id);
  });

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
    if (cardInfo.kind === "myHand" && cardInfo.uiState.type === "static") {
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
      class={`gi-tcg-chessboard-new reset min-h-xl min-w-3xl bg-yellow-1 overflow-clip ${
        props.class ?? ""
      }`}
    >
      <div
        class="relative h-full w-full preserve-3d select-none"
        ref={chessboardElement}
        onPointerDown={onChessboardClick}
        style={{
          perspective: `${PERSPECTIVE / 4}rem`,
        }}
      >
        <Key each={characters()} by="id">
          {(character) => <CharacterArea {...character()} />}
        </Key>
        <Key each={cards()} by="id">
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
        </Key>
      </div>
    </div>
  );
}
