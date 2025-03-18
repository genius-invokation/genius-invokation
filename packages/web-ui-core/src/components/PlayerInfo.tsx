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

import { DiceType, PbPlayerStatus } from "@gi-tcg/typings";
import { Dice } from "./Dice";
import { Show } from "solid-js";
import { WithDelicateUi } from "../primitives/delicate_ui";

export interface PlayerInfoProps {
  class?: string;
  opp?: boolean;
  diceCount: number;
  legendUsed: boolean;
  declaredEnd: boolean;
  status: PbPlayerStatus; // TODO
}

const STATUS_TEXT_MAP: Record<PbPlayerStatus, string> = {
  [PbPlayerStatus.UNSPECIFIED]: "",
  [PbPlayerStatus.ACTING]: "正在行动中…",
  [PbPlayerStatus.CHOOSING_ACTIVE]: "正在选择出战角色…",
  [PbPlayerStatus.REROLLING]: "正在重投骰子…",
  [PbPlayerStatus.SWITCHING_HANDS]: "正在替换手牌…",
  [PbPlayerStatus.SELECTING_CARDS]: "正在挑选…",
};

export function PlayerInfo(props: PlayerInfoProps) {
  return (
    <div
      class={`pointer-events-none select-none m-2 gap-1 flex items-start data-[opp=true]:flex-col-reverse data-[opp=false]:flex-col ${
        props.class ?? ""
      }`}
      data-opp={!!props.opp}
    >
      <div>
        <Dice type={DiceType.Omni} size={40} text={String(props.diceCount)} />
      </div>
      <div class="flex-grow-1" />
      <div class="flex flex-row gap-4 items-center">
        <div class="ml-1.75">
          <WithDelicateUi
            assetId={
              props.legendUsed ? "UI_Gcg_Esoteric_Bg" : "UI_Gcg_DiceL_Legend"
            }
            fallback={
              <div
                class="h-6 w-6 b-gray-400 b-2 rounded-md rotate-45 bg-gradient-to-r from-purple-500 to-blue-500 data-[used]:bg-gray-300 data-[used]:bg-none"
                bool:data-used={props.legendUsed}
              />
            }
          >
            {(image) => <div class="h-8 w-8">{image}</div>}
          </WithDelicateUi>
        </div>
        <div
          class="opacity-0 data-[shown]:opacity-100 bg-yellow-100 text-yellow-800 py-1 px-3 rounded-xl transition-opacity"
          bool:data-shown={props.declaredEnd}
        >
          已宣布结束
        </div>
      </div>
      <div class="text-blue-600 text-xs h-4">
        <Show when={props.status !== PbPlayerStatus.UNSPECIFIED}>
          {props.opp ? "对方" : "我方"}
          {STATUS_TEXT_MAP[props.status]}
        </Show>
      </div>
    </div>
  );
}
