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

import type { PbDiceRequirement, PbSkillInfo } from "@gi-tcg/typings";
import { Image } from "./Image";
import { DiceCost } from "./DiceCost";
import { createMemo, For, Match, Switch } from "solid-js";
import type { ActionStep, ClickSwitchActiveButtonActionStep } from "../action";

interface SkillButtonInfo {
  skillId: number | "switchActive";
  cost: PbDiceRequirement[];
  clickable: boolean;
  focused: boolean;
}

export interface SkillButtonProps extends SkillButtonInfo {
  onClick?: () => void;
}

function SkillButton(props: SkillButtonProps) {
  return (
    <div class="w-12 flex flex-col items-center gap-1 group select-none">
      <button
        type="button"
        class="relative w-10 h-10 p-0.5 rounded-full bg-yellow-800 b-yellow-900 data-[focused]:bg-yellow-700 data-[focused]:b-yellow-400 b-3 disabled:opacity-50 hover:bg-yellow-700 data-[focused]:hover:bg-yellow-600 active:bg-yellow-600 transition-all disabled:bg-yellow-700 flex items-center justify-center disabled:cursor-not-allowed"
        disabled={!props.clickable}
        bool:data-focused={props.focused}
        onClick={() => props.onClick?.()}
      >
        <Switch>
          <Match when={typeof props.skillId === "number"}>
            <Image imageId={props.skillId as number} class="w-full" />
          </Match>
          <Match when={props.skillId === "switchActive"}>
            &#128100;
            <span class="absolute right-0 bottom-0 text-sm">&#128257;</span>
          </Match>
        </Switch>
      </button>
      <DiceCost
        class="flex flex-row gap-2px"
        cost={props.cost}
        size={26}
        // realCost={realCost()} // TODO
      />
    </div>
  );
}

export interface SkillButtonGroupProps {
  class?: string;
  skills: PbSkillInfo[];
  shown: boolean;
  switchActiveButton: ClickSwitchActiveButtonActionStep | null;
  switchActiveCost: PbDiceRequirement[];
  onStepActionState: (step: ActionStep) => void;
}

export function SkillButtonGroup(props: SkillButtonGroupProps) {
  const skills = createMemo<SkillButtonProps[]>(() => {
    if (props.switchActiveButton) {
      const step = props.switchActiveButton;
      return [
        {
          focused: step.isFocused,
          clickable: true,
          cost: props.switchActiveCost,
          skillId: "switchActive",
          onClick: () => props.onStepActionState(step),
        },
      ];
    } else {
      return props.skills.map((skill) => ({
        focused: false, // TODO
        clickable: false, // TODO
        cost: skill.definitionCost,
        skillId: skill.definitionId,
      }));
    }
  });
  return (
    <div
      class={`flex flex-row gap-1 transition-all-100 transition-opacity opacity-0 data-[shown]:opacity-100 pointer-events-none data-[shown]:pointer-events-auto ${
        props.class ?? ""
      }`}
      bool:data-shown={props.shown}
    >
      <For each={skills()}>{(skill) => <SkillButton {...skill} />}</For>
    </div>
  );
}
