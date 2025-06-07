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

import { PbModifyDirection } from "@gi-tcg/typings";
import { createMemo, Show } from "solid-js";
import { StrokedText } from "./StrokedText";
import DefeatedPreviewIcon from "../svg/DefeatedPreviewIcon.svg";

export interface VariableDiffProps {
  class?: string;
  defeated?: boolean;
  oldValue: number;
  newValue: number;
  direction: PbModifyDirection;
}

export function VariableDiff(props: VariableDiffProps) {
  const increase = createMemo(
    () =>
      props.direction !== PbModifyDirection.DECREASE &&
      props.newValue >= props.oldValue,
  );
  const backgroundColor = createMemo(() =>
    increase() ? "#6e9b3a" : props.defeated ? "#a25053" : "#d14f51",
  );
  return (
    <div
      class={`scale-85%  text-white  h-8 py-1 px-5 variable-diff flex items-center justify-center ${
        props.class ?? ""
      }`}
      style={{
        "--bg-color": backgroundColor(),
      }}
    >
      <Show when={props.defeated}>
        <DefeatedPreviewIcon />
      </Show>
      <StrokedText
        class="flex-shrink-0 font-bold font-size-4.5 line-height-none"
        text={`${increase() ? "+" : "-"}${Math.abs(
          props.newValue - props.oldValue,
        )}`}
        strokeWidth={2}
        strokeColor="black"
      />
    </div>
  );
}
