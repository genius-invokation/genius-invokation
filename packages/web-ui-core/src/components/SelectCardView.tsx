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

import { createSignal, For, Show } from "solid-js";
import { Button } from "./Button";
import { Image } from "./Image";
import { SelectingIcon } from "./SelectingIcon";
import type { ChessboardViewType } from "./Chessboard";

export interface SelectCardViewProps {
  viewType: ChessboardViewType;
  candidateIds: number[];
  onClickCard: (id: number) => void;
  onConfirm: (id: number) => void;
}

export function SelectCardView(props: SelectCardViewProps) {
  const [shown, setShown] = createSignal(true);
  const [selectedId, setSelectedId] = createSignal<number | null>(null);

  return (
    <Show when={props.viewType === "selectCard"}>
      <Show when={shown()}>
        <div class="absolute inset-0 bg-green-50/90 flex flex-col items-center justify-center gap-10 select-none">
          <h3 class="font-bold text-3xl">挑选卡牌</h3>
          <ul class="flex flex-row gap-6">
            <For each={props.candidateIds}>
              {(cardId) => (
                <li
                  class="h-36 w-21 relative"
                  onClick={() => {
                    setSelectedId(cardId);
                    props.onClickCard(cardId);
                  }}
                >
                  <Image
                    class="h-full w-full rounded-xl b-white b-3"
                    imageId={cardId}
                  />
                  <Show when={selectedId() === cardId}>
                    <div class="absolute inset-0 flex items-center justify-center">
                      <SelectingIcon />
                    </div>
                  </Show>
                </li>
              )}
            </For>
          </ul>
          <div
            class="invisible data-[shown]:visible"
            bool:data-shown={selectedId()}
          >
            <Button onClick={() => props.onConfirm(selectedId()!)}>确定</Button>
          </div>
        </div>
      </Show>
      <button
        class="absolute right-2 top-2 h-8 w-8 flex items-center justify-center rounded-full b-yellow-800 b-1 bg-yellow-50 hover:bg-yellow-100 active:bg-yellow-200 text-yellow-800 transition-colors line-height-none cursor-pointer"
        onClick={() => setShown((v) => !v)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
        >
          <g
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-width="2"
          >
            <path
              stroke-linejoin="round"
              d="M10.73 5.073A11 11 0 0 1 12 5c4.664 0 8.4 2.903 10 7a11.6 11.6 0 0 1-1.555 2.788M6.52 6.519C4.48 7.764 2.9 9.693 2 12c1.6 4.097 5.336 7 10 7a10.44 10.44 0 0 0 5.48-1.52m-7.6-7.6a3 3 0 1 0 4.243 4.243"
            />
            <path d="m4 4l16 16" />
          </g>
        </svg>
      </button>
    </Show>
  );
}
