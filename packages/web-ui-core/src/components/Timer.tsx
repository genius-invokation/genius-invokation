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
import { PbPhaseType } from "@gi-tcg/typings";

export interface TimerProps {
  timer: RpcTimer;
  phase: PbPhaseType;
  hasSpecialView: boolean;
}

export function Timer(props: TimerProps) {
  const timerOffsetX = () => {
    let x = 0;
    if (props.phase <= PbPhaseType.ROLL) {
      x += 26;
    }
    if (props.hasSpecialView) {
      x += 10;
    }
    return x / 4;
  };
  const parseTime = () => (
    `${Math.max(Math.floor(props.timer.current / 60), 0)
      .toString()
      .padStart(2, "0")} : ${Math.max(props.timer.current % 60, 0)
      .toString()
      .padStart(2, "0")}`
      );
  return (
    <Show 
      when={ props.timer.current > 20 }
      fallback={
        <div
          class="absolute top-6 left-50% translate-x--50%  bg-black text-white opacity-80 py-2 px-4 rounded-2 z-29 whitespace-pre font-bold invisible data-[shown]:visible data-[alert]:text-red pointer-events-none"
          bool:data-shown={true}
          bool:data-alert={props.timer.current <= 10}
        >
          {parseTime()}
        </div>
      }
    >
      <div
        class="absolute right-22.3 top-2.5 h-8 w-20 flex items-center justify-center rounded-full b-1 line-height-none z-1 font-bold text-black/50 b-yellow-800/50 bg-yellow-50/50 -translate-x-[var(--timer-x)] transition"
        style={{"--timer-x": `${timerOffsetX()}rem`}}
      >
        {parseTime()}
      </div>
    </Show>
  );
}
