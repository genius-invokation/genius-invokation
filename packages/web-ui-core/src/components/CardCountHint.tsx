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
  return (
    <div
      class="pointer-events-none absolute left-0 top-0 h-6 w-6 rounded-full flex items-center justify-center bg-yellow-100 b-yellow-300 b-1 text-yellow-800 opacity-0 data-[shown]:opacity-100 transition-opacity"
      style={cssPropertyOfTransform(props.transform)}
      bool:data-shown={props.shown}
    >
      {props.value}
    </div>
  );
}
