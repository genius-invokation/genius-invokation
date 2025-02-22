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

import { createMemo } from "solid-js";
import type { TunningAreaInfo } from "./Chessboard";
import { cssPropertyOfTransform } from "../ui_state";

export interface TuningAreaProps extends TunningAreaInfo {}

export function TuningArea(props: TuningAreaProps) {
  return (
    <div
      class="absolute w-20 top-0 left-0 h-full transition-all bg-yellow-400/30 data-[card-hovering]:bg-yellow-400/60 flex items-center justify-center text-4xl text-yellow-500"
      bool:data-card-hovering={props.cardHovering}
      style={cssPropertyOfTransform(props.transform)}
    >
      &#128472;
    </div>
  );
}
