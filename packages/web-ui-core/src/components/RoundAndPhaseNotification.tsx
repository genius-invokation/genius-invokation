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

import { PbPhaseType } from "@gi-tcg/typings";
import type { RoundAndPhaseNotificationInfo } from "../mutations";
import { createEffect, createMemo, createSignal, Match, Show, Switch } from "solid-js";

export interface RoundAndPhaseNotificationProps {
  class?: string;
  who: 0 | 1;
  roundNumber: number;
  currentTurn: 0 | 1;
  info: RoundAndPhaseNotificationInfo;
}

const PHASE_TYPE_TEXT_MAP: Record<PbPhaseType, string> = {
  [PbPhaseType.ROLL]: "掷骰阶段",
  [PbPhaseType.ACTION]: "行动阶段",
  [PbPhaseType.END]: "结束阶段",
  [PbPhaseType.INIT_ACTIVES]: "",
  [PbPhaseType.INIT_HANDS]: "",
  [PbPhaseType.GAME_END]: "",
};

export function RoundAndPhaseNotification(
  props: RoundAndPhaseNotificationProps,
) {
  const opp = createMemo(() => props.who !== props.info.who);
  const [isFirst, setIsFirst] = createSignal(true);
  createEffect(() => {
    // 宣布回合结束总是先手方先宣布，随后后手方宣布，周而复始
    if (props.info.value === "declareEnd") {
      setIsFirst((prev) => !prev);
    }
  });
  return (
    <div
      class={`grid grid-cols-1 grid-rows-1 justify-items-center items-center pointer-events-none select-none group ${props.class} children:row-span-full children:col-span-full`}
      data-opp={opp()}
    >
      <Switch>
        <Match when={typeof props.info.value === "number"}>
          <div
            class="w-192 h-6 flex flex-row justify-center items-center bg-gradient-to-r from-yellow-600/0 via-yellow-600 to-yellow-600/0 text-white animate-[phase-notification_500ms_both] data-[delay]:animate-[phase-notification_500ms_800ms_both]"
            bool:data-delay={props.info.showRound}
          >
            {PHASE_TYPE_TEXT_MAP[props.info.value as PbPhaseType]}
          </div>
        </Match>
        <Match
          when={
            props.info.value === "action" || props.info.value === "declareEnd"
          }
        >
          <div class="w-192 h-6 flex flex-row justify-center items-center bg-gradient-to-r group-data-[opp=true]:from-blue-200/0 group-data-[opp=true]:via-blue-200 group-data-[opp=true]:to-blue-200/0 group-data-[opp=false]:from-yellow-200/0 group-data-[opp=false]:via-yellow-200 group-data-[opp=false]:to-yellow-200/0 group-data-[opp=true]:text-blue-700 group-data-[opp=false]:text-yellow-700 animate-[phase-notification_500ms_both]">
            {opp() ? "对方" : "我方"}
            {props.info.value === "action" ? "行动" : "宣布结束"}
            <Show when={props.info.value === "declareEnd"}>
              ，获得{isFirst() ? "后手" : "先手"}
            </Show>
          </div>
        </Match>
      </Switch>
      <Show when={props.info.showRound}>
        <div class="w-192 p-3 flex flex-col justify-center items-center gap-2 bg-gradient-to-r from-gray-200/0 via-gray-200 to-gray-200/0 text-gray-700 animate-[phase-notification_800ms_both]">
          <h5 class="font-bold text-lg">第 {props.roundNumber} 回合</h5>
          <span>{props.currentTurn === props.who ? "我方" : "对方"}先手</span>
        </div>
      </Show>
    </div>
  );
}
