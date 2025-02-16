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

import type { PbDiceType } from "@gi-tcg/typings";
import { Dice } from "./Dice";
import { Index } from "solid-js";

export interface DiceListProps {
  class?: string;
  dice: PbDiceType[];
}

export function DiceList(props: DiceListProps) {
  return (
    <div class={`flex flex-col gap-2 items-center ${props.class ?? ""}`}>
      <div class="h-8 w-8 flex items-center justify-center rounded-full bg-yellow-100 b-yellow-800 b-1">
        {props.dice.length}
      </div>
      <div class="flex flex-col gap-2 items-center">
        <Index each={props.dice}>{(dice) => <Dice type={dice()} />}</Index>
      </div>
    </div>
  );
}
