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
      class="absolute top-0 left-0 h-full w-0 data-[shown]:w-20 data-[hidden]:w-0 invisible data-[shown]:visible data-[hidden]:invisible pr-0 data-[shown]:pr-8 data-[hidden]:pr-0 transition-all opacity-75% data-[card-hovering]:opacity-100% flex items-center justify-center text-4xl text-#e7d090 dice-panel"
      bool:data-shown={props.draggingHand?.tuneStep}
      bool:data-hidden={!props.draggingHand?.tuneStep || props.draggingHand?.status !== "moving"}
      bool:data-card-hovering={props.cardHovering}
      style={cssPropertyOfTransform(props.transform)}
    >
      &#128472;
    </div>
  );
}
