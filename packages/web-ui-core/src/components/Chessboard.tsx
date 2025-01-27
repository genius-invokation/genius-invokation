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
import { getHandCardWrappedPos, getPilePos, type Size } from "../layout";

export type CardInfo = CardProps;

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

  const resizeObserver = new ResizeObserver(onResize);

  const cards = createMemo(() => {
    const size = [height(), width()] as Size;
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
          x,
          y,
          z: i / 4,
          ry: 180,
          rz: 87.5 + 5 * Math.random(),
          shadow: i === 0,
        });
      }

      // Hand
      // TODO: hover and select etc.
      const totalHandCardCount = player.handCard.length;
      for (let i = 0; i < totalHandCardCount; i++) {
        const [x, y] = getHandCardWrappedPos(size, opp, totalHandCardCount, i);
        const card = player.handCard[i];
        cards.push({
          id: card.id,
          data: card,
          x,
          y,
          z: 0,
          ry: opp ? 185 : 5,
          rz: 0,
          shadow: true,
        });
      }
    }
    return cards;
  });

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
      <div class="relative h-full w-full perspective-800 " ref={chessboardElement}>
        <Key each={cards()} by="id">
          {(card) => <Card {...card()} />}
        </Key>
      </div>
    </div>
  );
}
