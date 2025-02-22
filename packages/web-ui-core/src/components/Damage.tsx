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

import { DamageType } from "@gi-tcg/typings";
import { DICE_COLOR } from "./Dice";
import type { DamageInfo } from "./Chessboard";
import { createEffect, createMemo } from "solid-js";

export interface DamageProps {
  info: DamageInfo;
  shown: boolean;
}

export function Damage(props: DamageProps) {
  const damageType = createMemo(() => props.info.damageType);
  const damageValue = createMemo(() => props.info.value);
  return (
    <div class="absolute z-5 top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
      <div
        class="rounded-full w-18 h-18 bg-white b-2 b-dashed items-center justify-center transition-all-100 transition-discrete hidden data-[shown]:flex scale-80 data-[shown]:scale-100 starting:data-[shown]:scale-80"
        bool:data-shown={props.shown}
        style={{
          "border-color": `var(--c-${DICE_COLOR[damageType()]})`,
          color: `var(--c-${DICE_COLOR[damageType()]})`,
        }}
      >
        <span
          class="data-[heal=false]:animate-[damage-text-enter_200ms_both] text-5xl font-bold text-stroke-white text-stroke-2"
          data-heal={damageType() === DamageType.Heal}
        >
          {damageType() === DamageType.Heal ? "+" : "-"}
          {damageValue()}
        </span>
      </div>
    </div>
  );
}
