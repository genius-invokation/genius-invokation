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
import { StrokedText } from "./StrokedText";
import DamageIcon from "../svg/DamageIcon.svg?fb";
import HealIcon from "../svg/HealIcon.svg?fb";

export interface DamageProps {
  info: DamageInfo;
  shown: boolean;
}

export const DAMAGE_COLOR: Record<number, string> = {
  ...DICE_COLOR, 
  [DamageType.Piercing]: "void"
};

export function Damage(props: DamageProps) {
  const damageType = createMemo(() => props.info.damageType);
  const damageValue = createMemo(() => props.info.value);
  return (
    <div class="absolute z-5 top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] preserve-3d">
      <div
        class="relative w-28 h-28 transition-all-100 transition-discrete hidden data-[shown]:flex scale-80 data-[shown]:scale-100 starting:data-[shown]:scale-80"
        bool:data-shown={props.shown}
        style={{
          color: `var(--c-${DAMAGE_COLOR[damageType()]})`,
        }}
      >
        <div class="absolute h-full w-full">
          {damageType() === DamageType.Heal ? <HealIcon noRender /> : <DamageIcon noRender />}
        </div>
        <div
          class="relative h-full w-full data-[heal=false]:animate-[damage-text-enter_200ms_both] text-5xl font-bold text-center"
          data-heal={damageType() === DamageType.Heal}
        >
          <StrokedText
            class="absolute translate-x-[calc(-50%-0.1rem)] top-50% left-50% translate-y-[calc(-50%+0.05rem)] "
            text={`${
              damageType() === DamageType.Heal ? "+" : "-"
            }${damageValue()}`}
            strokeColor="#fffae3"
            strokeWidth={7}
          />
        </div>
      </div>
    </div>
  );
}
