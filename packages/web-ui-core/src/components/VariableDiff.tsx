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
import { createMemo, Match, Show, Switch } from "solid-js";
import { StrokedText } from "./StrokedText";
import DefeatedPreviewIcon from "../svg/DefeatedPreviewIcon.svg?fb";
import RevivePreviewIcon from "../svg/RevivePreviewIcon.svg?fb";

export interface VariableDiffProps {
  class?: string;
  defeated?: boolean;
  revived?: boolean;
  oldValue: number;
  newValue: number;
  direction: PbModifyDirection;
}

export function VariableDiff(props: VariableDiffProps) {
  const increase = createMemo(
    () =>
      props.newValue > props.oldValue ||
      (props.newValue === props.oldValue &&
        props.direction !== PbModifyDirection.DECREASE),
  );
  const backgroundColor = createMemo(() =>
    increase() ? "#6e9b3a" : props.defeated ? "#a25053" : "#d14f51",
  );
  return (
    <div
      class={`scale-75 origin-top-left text-white h-8 inline-grid grid-cols-[max-content] grid-rows-[max-content] place-items-center ${
        props.class ?? ""
      }`}
      style={{
        "--bg-color": backgroundColor(),
      }}
    >
      <div class="grid-area-[1/1] bg-black rounded-full h-full w-full"/>
      <div class="grid-area-[1/1] bg-black rounded-1 h-full w-[calc(100%-8px)] mx-1"/>
      <div class="grid-area-[1/1] bg-[var(--bg-color)] rounded-full h-[calc(100%-4px)] w-[calc(100%-4px)] m-0.5"/>
      <div class="grid-area-[1/1] bg-[var(--bg-color)] rounded-0.5 h-[calc(100%-4px)] w-[calc(100%-12px)] my-0.5 mx-1.5"/>
      <div class="grid-area-[1/1] inline-flex items-center px-2.5 w-max h-8">
        <Switch>
          <Match when={props.defeated}>
            <div class="relative h-8 w-8 overflow-visible shrink-0">
              <DefeatedPreviewIcon noRender class="absolute top-50% left-50% h-10 w-10 -translate-x-50% -translate-y-55%" />
            </div>
          </Match>
          <Match when={props.revived}>
            <div class="relative h-8 w-8 overflow-visible shrink-0">
              <RevivePreviewIcon noRender class="absolute top-50% left-50% h-10 w-10 -translate-x-50% -translate-y-55%" />
            </div>
          </Match>          
        </Switch>
        <StrokedText
          class="shrink-0 font-bold font-size-5 line-height-none mx-0.5"
          text={`${increase() ? "+" : "-"}${Math.abs(
            props.newValue - props.oldValue,
          )}`}
          strokeWidth={2}
          strokeColor="black"
        />        
      </div>
    </div>
  );
}
