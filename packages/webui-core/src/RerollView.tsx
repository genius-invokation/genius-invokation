// Copyright (C) 2024 Guyutongxue
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

import type { DiceType } from "@gi-tcg/typings";
import { Dice } from "./Dice";
import { Index } from "solid-js";
import { createStore } from "solid-js/store";

export interface RerollViewProps {
  dice: readonly DiceType[];
  onConfirm?: (indexes: number[]) => void;
}

export function RerollView(props: RerollViewProps) {
  const [chosenIndexes, setChosenIndexes] = createStore<number[]>([]);
  const reverseChosen = (i: number) => {
    chosenIndexes.includes(i)
                  ? setChosenIndexes(chosenIndexes.filter((x) => x !== i))
                  : setChosenIndexes([...chosenIndexes, i])
  }
  return (
    <div class="w-full h-full flex flex-col justify-center items-center">
      <ul class="max-w-[20em] grid grid-cols-4 gap-6">
        <Index each={props.dice}>
          {(d, i) => (
            <li>
              <div class="relative">
                {/* 骰子 */}
                <Dice type={d()} selected={chosenIndexes.includes(i)} size={70} />
                {/* 点选、滑动点选触发区域，css调整使其位于父对象居中 */}
                <div class="cursor-pointer absolute z-1 w-60px h-60px left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan opacity-0"
                  onMouseDown={() => reverseChosen(i)}
                  onMouseEnter={(event) => event.buttons === 1 && reverseChosen(i)}>
                </div>
              </div>
            </li>
          )}
        </Index>
      </ul>
      <button
        class="mt-6 btn btn-green"
        onClick={() => props.onConfirm?.(chosenIndexes)}
      >
        确定
      </button>
    </div>
  );
}
