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

export interface DamageProps {
  damageType: DamageType;
  value: number;
}

export function Damage(props: DamageProps) {
  return (
    <div
      class="absolute z-5 top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] rounded-999 w-20 h-20 bg-white b-2 b-dashed text-5xl flex items-center justify-center starting:scale-0 transition-transform"
      style={{
        "border-color": `var(--c-${DICE_COLOR[props.damageType]})`,
        color: `var(--c-${DICE_COLOR[props.damageType]})`,
      }}
    >
      {props.damageType === DamageType.Heal ? "+" : "-"}
      {props.value}
    </div>
  );
}
