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

import type { PbSkillInfo } from "@gi-tcg/typings";
import { Image } from "./Image";
import { DiceCost } from "./DiceCost";
import { For } from "solid-js";

export interface SkillButtonProps {
  data: PbSkillInfo;
}

function SkillButton(props: SkillButtonProps) {
  return (
    <div class="w-12 flex flex-col items-center gap-1 group select-none">
      <button
        type="button"
        class="w-10 h-10 p-0.5 rounded-full bg-yellow-800 b-yellow-900 b-3 disabled:opacity-50 hover:bg-yellow-700 active:bg-yellow-900 transition-all disabled:bg-yellow-700 flex items-center justify-center disabled:cursor-not-allowed"
        disabled={true} // TODO
        // onClick={() => clickable() && onClick(props.data.definitionId)}
      >
        <Image imageId={props.data.definitionId} class="w-full" />
      </button>
      <DiceCost
        class="flex flex-row gap-2px"
        cost={props.data.definitionCost}
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
}

export function SkillButtonGroup(props: SkillButtonGroupProps) {
  return (
    <div
      class={`data-[shown]:flex flex-row gap-1 transition-all-100 transition-discrete hidden opacity-0 data-[shown]:opacity-100 starting:data-[shown]:opacity-0 ${
        props.class ?? ""
      }`}
      bool:data-shown={props.shown}
    >
      <For each={props.skills}>{(skill) => <SkillButton data={skill} />}</For>
    </div>
  );
}
