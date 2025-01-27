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

export type CardInfo = CardProps;

export interface ChessboardProps {
  state: PbGameState;
  showingCards: { id: number; definitionId: number }[];
  who: 0 | 1;
}

export function Chessboard(props: ChessboardProps) {
  let chessboardElement!: HTMLDivElement;
  const [height, setHeight] = createSignal(0);
  const [width, setWidth] = createSignal(0);
  const onResize = () => {
    setHeight(chessboardElement.clientHeight);
    setWidth(chessboardElement.clientWidth);
  };

  const resizeObserver = new ResizeObserver(onResize);

  const cards = createMemo(() => {
    const cards: CardInfo[] = [];
    for (const w of [props.who, flip(props.who)]) {

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
    <div class="gi-tcg-chessboard-new reset min-h-xl min-w-3xl bg-yellow-1">
      <div class="relative h-full w-full" ref={chessboardElement}>
        <Key each={cards()} by="id">
          {(card) => <Card {...card()} />}
        </Key>
      </div>
    </div>
  );
}
