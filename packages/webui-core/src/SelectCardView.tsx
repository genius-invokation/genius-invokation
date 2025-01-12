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

import { createSignal, For } from "solid-js";
import { Card } from "./Card";
import { Image } from "./Image";
import { Interactive } from "./Interactive";

export interface SelectCardViewProps {
  cards: readonly number[];
  onConfirm?: (selected: number) => void;
}

export function SelectCardView(props: SelectCardViewProps) {
  const [chosen, setChosen] = createSignal<number | null>(null);
  return (
    <div class="w-full h-full flex flex-col justify-center items-center">
      <ul class="flex gap-4">
        <For each={props.cards}>
          {(id) => (
            <li
              class="relative cursor-pointer h-30"
              classList={{ selected: chosen() === id }}
              onClick={() => setChosen(id)}
            >
              <Interactive definitionId={id} id={0}>
                <Image imageId={id} />
              </Interactive>
            </li>
          )}
        </For>
      </ul>
      <button
        class="mt-3 btn btn-green"
        disabled={chosen() === null}
        onClick={() => chosen() !== null && props.onConfirm?.(chosen()!)}
      >
        确定
      </button>
    </div>
  );
}
