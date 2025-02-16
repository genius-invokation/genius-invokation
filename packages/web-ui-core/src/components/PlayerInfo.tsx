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

import { DiceType, type PbPlayerStatus } from "@gi-tcg/typings";
import { Dice } from "./Dice";

export interface PlayerInfoProps {
  class?: string;
  opp?: boolean;
  diceCount: number;
  legendUsed: boolean;
  declaredEnd: boolean;
  status: PbPlayerStatus; // TODO
}

export function PlayerInfo(props: PlayerInfoProps) {
  return (
    <div
      class={`pointer-events-none mx-2 flex justify-between items-start data-[opp=true]:flex-col-reverse data-[opp=false]:flex-col ${
        props.class ?? ""
      }`}
      data-opp={!!props.opp}
    >
      <div>
        <Dice type={DiceType.Omni} size={40} text={String(props.diceCount)} />
      </div>
      <div class="my-5 flex flex-row gap-4 items-center">
        <div
          class="ml-1.75 h-6 w-6 b-gray-400 b-2 rounded-md rotate-45 bg-gradient-to-r from-purple-500 to-blue-500 data-[used]:bg-gray-300"
          bool:data-used={props.legendUsed}
        />
        <div
          class="opacity-0 data-[shown]:opacity-100 bg-blue-200 text-blue-600 py-1 px-3 rounded-xl transition-opacity"
          bool:data-shown={props.declaredEnd}
        >
          已宣布结束
        </div>
      </div>
    </div>
  );
}
