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

import type { PbCardState } from "@gi-tcg/typings";
import { For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { Card } from "./Card";

export interface SwitchHandsViewProps {
  hands: readonly PbCardState[];
  onConfirm?: (ids: number[]) => void;
}

export function SwitchHandsView(props: SwitchHandsViewProps) {
  const [chosenIds, setChosenIds] = createStore<number[]>([]);
  return (
    <div class="w-full h-full flex flex-col justify-center items-center">
      <ul class="flex gap-4">
        <For each={props.hands}>
          {(card) => (
            <li
              class="relative cursor-pointer h-30"
              onClick={() =>
                chosenIds.includes(card.id)
                  ? setChosenIds(chosenIds.filter((x) => x !== card.id))
                  : setChosenIds([...chosenIds, card.id])
              }
            >
              <Card data={card} />
              <Show when={chosenIds.includes(card.id)}>
                <div class="absolute top-[50%] left-0 w-full text-center text-6xl font-bold text-red-600 translate-y-[-50%] pointer-events-none">
                  &#8856;
                </div>
              </Show>
            </li>
          )}
        </For>
      </ul>
      <button
        class="mt-3 btn btn-green"
        onClick={() => props.onConfirm?.(chosenIds)}
      >
        确定
      </button>
    </div>
  );
}
