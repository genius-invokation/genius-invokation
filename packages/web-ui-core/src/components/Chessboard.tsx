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

import type { PbCardState, PbGameState } from "@gi-tcg/typings";
import { Card, type CardProps } from "./Card";
import { createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { flip } from "@gi-tcg/utils";
import { Key } from "@solid-primitives/keyed";
import {
  getHandCardBlurredPos,
  getHandCardFocusedPos,
  getPilePos,
  type Pos,
  type Size,
} from "../layout";

export interface CardInfo {
  id: number;
  data: PbCardState;
  kind: "pile" | "myHand" | "oppHand" | "showing" | "dragging";
  x: number;
  y: number;
  z: number;
  zIndex: number;
  ry: number;
  rz: number;
  shadow: boolean;
  transition: boolean;
}

interface DraggingCardInfo {
  id: number;
  x: number;
  y: number;
  moving: boolean;
  updatePos: (e: PointerEvent) => Pos;
}

export interface ChessboardProps {
  class?: string;
  state: PbGameState;
  showingCards: { id: number; definitionId: number }[];
  who: 0 | 1;
}

export function Chessboard(props: ChessboardProps) {
  let chessboardElement!: HTMLDivElement;
  const [height, setHeight] = createSignal(0);
  const [width, setWidth] = createSignal(0);
  const onResize = () => {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    setHeight((chessboardElement.clientHeight * 4) / rem);
    setWidth((chessboardElement.clientWidth * 4) / rem);
  };

  const [focusingHands, setFocusingHands] = createSignal(false);
  const [selectingHand, setSelectingHand] = createSignal<CardInfo | null>(null);
  const [draggingHand, setDraggingHand] = createSignal<DraggingCardInfo | null>(
    null,
  );
  let shouldMoveWhenHandBlurring: PromiseWithResolvers<boolean>;

  const resizeObserver = new ResizeObserver(onResize);

  const cards = createMemo(() => {
    const size = [height(), width()] as Size;
    const isFocusingHands = focusingHands();
    const draggingHandV = draggingHand();

    const cards: CardInfo[] = [];
    for (const who of [0, 1] as const) {
      const opp = who !== props.who;
      const player = props.state.player[who];

      // Pile
      for (let i = 0; i < player.pileCard.length; i++) {
        const [x, y] = getPilePos(size, opp);
        const card = player.pileCard[i];
        cards.push({
          id: card.id,
          data: card,
          kind: "pile",
          x,
          y,
          z: i / 4,
          zIndex: i,
          ry: 180,
          rz: 90,
          shadow: i === 0,
          transition: true,
        });
      }

      // Hand

      const totalHandCardCount = player.handCard.length;

      const isFocus = !opp && isFocusingHands;
      const z = isFocus ? 10 : 2;
      const ry = isFocus ? 0 : opp ? 175 : -5;

      let selectingHandIndex: number | null = player.handCard.findIndex(
        (card) => card.id === selectingHand()?.id,
      );
      if (selectingHandIndex === -1) {
        selectingHandIndex = null;
      }

      for (let i = 0; i < totalHandCardCount; i++) {
        const card = player.handCard[i];
        if (card.id === draggingHandV?.id) {
          const { x, y, moving } = draggingHandV;
          cards.push({
            id: card.id,
            data: card,
            kind: "dragging",
            x,
            y,
            z: 10,
            zIndex: 100,
            ry: 0,
            rz: 0,
            shadow: true,
            transition: !moving,
          });
          continue;
        }
        const [x, y] = isFocus
          ? getHandCardFocusedPos(
              size,
              totalHandCardCount,
              i,
              selectingHandIndex,
            )
          : getHandCardBlurredPos(size, opp, totalHandCardCount, i);
        cards.push({
          id: card.id,
          data: card,
          kind: opp ? "oppHand" : "myHand",
          x,
          y,
          z,
          zIndex: i,
          ry,
          rz: 0,
          shadow: true,
          transition: true,
        });
      }
    }
    return cards.toSorted((a, b) => a.id - b.id);
  });

  const onCardClick = (e: MouseEvent, cardInfo: CardInfo) => {};

  const onCardPointerEnter = (e: PointerEvent, cardInfo: CardInfo) => {
    if (focusingHands()) {
      setSelectingHand(cardInfo);
    }
  };
  const onCardPointerLeave = (e: PointerEvent, cardInfo: CardInfo) => {
    if (focusingHands()) {
      setSelectingHand((c) => {
        if (c?.id === cardInfo.id) {
          return null;
        } else {
          return c;
        }
      });
    }
  };
  const onCardPointerDown = async (e: PointerEvent, cardInfo: CardInfo) => {
    if (cardInfo.kind === "myHand") {
      if (!focusingHands()) {
        shouldMoveWhenHandBlurring = Promise.withResolvers();
        setTimeout(() => {
          shouldMoveWhenHandBlurring.resolve(true);
        }, 100);
        const doMove = await shouldMoveWhenHandBlurring.promise;
        setFocusingHands(true);
        if (!doMove) {
          return;
        }
      }
      const target = e.target as HTMLElement;
      // target.setPointerCapture(e.pointerId);
      const rem = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      const offsetX = e.clientX - (cardInfo.x / 4) * rem;
      const offsetY = e.clientY - (cardInfo.y / 4) * rem;
      console.log({ offsetX, offsetY });
      setDraggingHand({
        id: cardInfo.id,
        x: cardInfo.x,
        y: cardInfo.y,
        moving: false,
        updatePos: (e2) => {
          const x = ((e2.clientX - offsetX) * 4) / rem;
          const y = ((e2.clientY - offsetY) * 4) / rem;
          return [x, y];
        },
      });
    }
  };
  const onCardPointerMove = (e: PointerEvent, cardInfo: CardInfo) => {
    shouldMoveWhenHandBlurring?.resolve(true);
    setDraggingHand((dragging) => {
      if (dragging?.id !== cardInfo.id) {
        return dragging;
      }
      const [x, y] = dragging.updatePos(e);
      // console.log(x, y);
      return {
        ...dragging,
        moving: true,
        x,
        y,
      };
    });
  };
  const onCardPointerUp = (e: PointerEvent, cardInfo: CardInfo) => {
    shouldMoveWhenHandBlurring?.resolve(false);
    setDraggingHand((dragging) => {
      if (dragging?.id !== cardInfo.id) {
        return dragging;
      }
      return null;
    });
  };

  const onChessboardClick = () => {
    setFocusingHands(false);
    setSelectingHand(null);
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
      class={`gi-tcg-chessboard-new reset min-h-xl min-w-3xl bg-yellow-1 ${
        props.class ?? ""
      }`}
    >
      <div
        class="relative h-full w-full perspective-800 preserve-3d overflow-clip select-none"
        ref={chessboardElement}
        onPointerDown={onChessboardClick}
      >
        <Key each={cards()} by="id">
          {(card) => (
            <Card
              {...card()}
              onClick={(e) => onCardClick(e, card())}
              onPointerEnter={(e) => onCardPointerEnter(e, card())}
              onPointerLeave={(e) => onCardPointerLeave(e, card())}
              onPointerDown={(e) => onCardPointerDown(e, card())}
              onPointerMove={(e) => onCardPointerMove(e, card())}
              onPointerUp={(e) => onCardPointerUp(e, card())}
            />
          )}
        </Key>
      </div>
    </div>
  );
}
