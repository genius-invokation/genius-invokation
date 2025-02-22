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

import {
  DiceType,
  type PbDiceRequirement,
  type PbSkillInfo,
} from "@gi-tcg/typings";
import { Image } from "./Image";
import { DiceCost } from "./DiceCost";
import { createMemo, For, Match, Switch } from "solid-js";
import type {
  ClickSwitchActiveButtonActionStep,
} from "../action";
import type { SkillInfo } from "./Chessboard";
import { Key } from "@solid-primitives/keyed";

export interface SkillButtonProps extends SkillInfo {
  onClick?: (e: MouseEvent) => void;
}

function SkillButton(props: SkillButtonProps) {
  const skillId = createMemo(() => props.id);
  return (
    <div class="w-12 flex flex-col items-center gap-1 group select-none">
      <button
        type="button"
        class="relative w-10 h-10 p-0.5 rounded-full bg-yellow-800 b-yellow-900 data-[focused]:b-yellow-400 b-3 data-[focused]:shadow-[inset_0_0_4px_4px] shadow-yellow shadow-inset hover:bg-yellow-700 active:bg-yellow-600 data-[disabled]:cursor-not-allowed transition-all flex items-center justify-center group"
        bool:data-disabled={!props.step || props.step.isDisabled}
        bool:data-focused={props.step?.isFocused}
        onClick={(e) => props.onClick?.(e)}
        title={props.step ? props.step.tooltipText : '不是你的行动轮'}
      >
        <Switch>
          <Match when={typeof skillId() === "number"}>
            <Image
              imageId={skillId() as number}
              class="w-full group-data-[disabled]:opacity-50"
            />
          </Match>
          <Match when={skillId() === "switchActive"}>
            &#128100;
            <span class="absolute right-0 bottom-0 text-sm">&#128257;</span>
          </Match>
        </Switch>
      </button>
      <DiceCost
        class="flex flex-row gap-2px"
        cost={props.cost}
        size={26}
        realCost={props.realCost}
      />
    </div>
  );
}

export interface SkillButtonGroupProps {
  class?: string;
  skills: SkillInfo[];
  shown: boolean;
  switchActiveButton: ClickSwitchActiveButtonActionStep | null;
  switchActiveCost: PbDiceRequirement[];
  onClick?: (skill: SkillInfo) => void;
}

const DEFAULT_SWITCH_ACTIVE_COST: PbDiceRequirement[] = [
  { type: DiceType.Void, count: 1 },
];

export function SkillButtonGroup(props: SkillButtonGroupProps) {
  const skills = createMemo<SkillInfo[]>(() => {
    if (props.switchActiveButton) {
      const step = props.switchActiveButton;
      const skillInfo = {
        id: "switchActive" as const,
        step: step,
        cost: DEFAULT_SWITCH_ACTIVE_COST,
        realCost: props.switchActiveCost,
      };
      return [skillInfo];
    } else {
      return props.skills;
    }
  });
  return (
    <div
      class={`flex flex-row gap-1 transition-all-100 transition-opacity opacity-0 data-[shown]:opacity-100 pointer-events-none data-[shown]:pointer-events-auto ${
        props.class ?? ""
      }`}
      bool:data-shown={props.shown}
    >
      <Key each={skills()} by="id">
        {(skill) => (
          <SkillButton
            {...skill()}
            onClick={(e) => {
              e.stopPropagation();
              props.onClick?.(skill());
            }}
          />
        )}
      </Key>
    </div>
  );
}
