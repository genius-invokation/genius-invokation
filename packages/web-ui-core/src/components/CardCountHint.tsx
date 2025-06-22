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

import { cssPropertyOfTransform } from "../ui_state";
import type { CardCountHintInfo } from "./Chessboard";

export interface CardCountHintProps extends CardCountHintInfo {
  shown: boolean;
}

export function CardCountHint(props: CardCountHintProps) {
  const hintStyle = () => {
    if (props.area === "myPile") return {opp: false, hint: "rotate-45"};
    if (props.area === "oppPile") return {opp: true, hint: "rotate-45"};
    if (props.area === "oppHand") return {opp: true, hint: "rotate-135"};
    return {opp: false, hint: "-rotate-45"};
  };
  return (
    <div
      class="pointer-events-none absolute left-0 top-0 h-6 w-6 grid grid-cols-1 grid-rows-1 opacity-0 data-[shown]:opacity-100 transition-opacity current-turn-hint"
      style={cssPropertyOfTransform(props.transform)}
      bool:data-shown={props.shown}
      data-opp={hintStyle().opp}
    >
      <div 
        class={`grid-area-[1/1] z-0 h-6 w-6 rounded-lt-full rounded-r-full bg-[var(--bg-color)] b-1 b-[var(--fg-color)] ${hintStyle().hint}`}
      />
      <div class={`grid-area-[1/1] z-1 w-6 text-[var(--fg-color)] text-4 text-center`}>{props.value}</div>
    </div>
  );
}
