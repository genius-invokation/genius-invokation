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

import { Show } from "solid-js";
import type { RpcTimer } from "./Chessboard";

export interface TimerProps {
  timer: RpcTimer | null;
}

function parseTime(time: number) {
  return `${Math.max(Math.floor(time / 60), 0)
    .toString()
    .padStart(2, "0")} : ${Math.max(time % 60, 0)
    .toString()
    .padStart(2, "0")}`;
}

export function TimerCapsule(props: TimerProps) {
  return (
    <Show when={props.timer && props.timer.current > 20}>
      <div class="h-8 w-20 flex items-center justify-center rounded-full b-2 line-height-none font-bold bg-#e9e2d3 text-black/70 b-black/70 opacity-50">
        {parseTime(props.timer!.current)}
      </div>
    </Show>
  );
}

export function TimerAlert(props: TimerProps) {
  return (
    <Show when={props.timer && props.timer.current <= 20}>
      <div
        class="absolute top-6 left-50% translate-x--50%  bg-black text-white opacity-80 py-2 px-4 rounded-2 z-29 whitespace-pre font-bold  data-[alert]:text-red pointer-events-none"
        bool:data-alert={props.timer!.current <= 10}
      >
        {parseTime(props.timer!.current)}
      </div>
    </Show>
  );
}
