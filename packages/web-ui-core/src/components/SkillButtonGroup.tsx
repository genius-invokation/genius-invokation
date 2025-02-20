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
import type { ActionStep } from "../action";

interface SkillButtonInfo {
  skillId: number | "switchActive";
  cost: PbDiceRequirement[];
  clickable: boolean;
  blurred: boolean;
}

export interface SkillButtonProps extends SkillButtonInfo {
  onClick?: () => void;
}

function SkillButton(props: SkillButtonProps) {
  return (
    <div class="w-12 flex flex-col items-center gap-1 group select-none">
      <button
        type="button"
        class="relative w-10 h-10 p-0.5 rounded-full bg-yellow-800 b-yellow-900 b-3 disabled:opacity-50 hover:bg-yellow-700 active:bg-yellow-900 transition-all disabled:bg-yellow-700 flex items-center justify-center disabled:cursor-not-allowed"
        disabled={!props.clickable}
        // onClick={() => clickable() && onClick(props.data.definitionId)}
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
  switchActiveButton: ActionStep | null;
  switchActiveCost: PbDiceRequirement[];
  onStepActionState: (step: ActionStep) => void;
}

export function SkillButtonGroup(props: SkillButtonGroupProps) {
  const skills = createMemo<SkillButtonInfo[]>(() => {
    if (props.switchActiveButton) {
      return [
        {
          blurred: false,
          clickable: true,
          cost: props.switchActiveCost,
          skillId: "switchActive",
        },
      ];
    } else {
      return props.skills.map((skill) => ({
        blurred: false, // TODO
        clickable: false, // TODO
        cost: skill.definitionCost,
        skillId: skill.definitionId,
      }));
    }
  });
  return (
    <div
      class={`flex flex-row gap-1 transition-all-100 transition-opacity opacity-0 data-[shown]:opacity-100 ${
        props.class ?? ""
      }`}
      bool:data-shown={props.shown}
    >
      <For each={skills()}>{(skill) => <SkillButton {...skill} />}</For>
    </div>
  );
}
