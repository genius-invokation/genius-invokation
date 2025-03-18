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
import { createMemo, For, Match, Show, Switch } from "solid-js";
import type { ClickSwitchActiveButtonActionStep } from "../action";
import type { SkillInfo } from "./Chessboard";
import { Key } from "@solid-primitives/keyed";
import { WithDelicateUi } from "../primitives/delicate_ui";

export interface SkillButtonProps extends SkillInfo {
  hideDiceCost?: boolean;
  onClick?: (e: MouseEvent) => void;
}

function SwitchActiveIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 48 48"
    >
      <path
        fill="#ffffff"
        d="M22 4c-5.523 0-10 4.477-10 10s4.477 10 10 10s10-4.477 10-10S27.523 4 22 4M10.25 28A4.25 4.25 0 0 0 6 32.249V33c0 3.755 1.942 6.567 4.92 8.38C13.85 43.163 17.786 44 22 44c1.172 0 2.322-.065 3.435-.196A12.95 12.95 0 0 1 22 35c0-2.577.75-4.98 2.044-7zM24 35c0 6.075 4.925 11 11 11s11-4.925 11-11s-4.925-11-11-11s-11 4.925-11 11m8.647-7.093A7 7 0 0 1 40 29.601V29a1 1 0 1 1 2 0v3a1 1 0 0 1-1 1h-3a1 1 0 1 1 0-2h.57a5 5 0 0 0-7.106-.035a1 1 0 0 1-1.414-1.415a7 7 0 0 1 2.597-1.643m4.706 14.186A7 7 0 0 1 30 40.399V41a1 1 0 1 1-2 0v-3a1 1 0 0 1 1-1h3a1 1 0 1 1 0 2h-.57a5 5 0 0 0 5.25 1.21a5 5 0 0 0 1.856-1.175a1 1 0 0 1 1.414 1.415a7 7 0 0 1-2.597 1.643"
      />
    </svg>
  );
}

function SkillButton(props: SkillButtonProps) {
  const skillId = createMemo(() => props.id);

  const children = () => (
    <Switch>
      <Match when={typeof skillId() === "number"}>
        <Image
          imageId={skillId() as number}
          class="w-full group-data-[disabled]:opacity-50"
        />
      </Match>
      <Match when={skillId() === "switchActive"}>
        <SwitchActiveIcon />
      </Match>
    </Switch>
  );

  return (
    <div class="w-12 flex flex-col items-center gap-1 group select-none">
      <WithDelicateUi
        assetId={[
          "UI_GCG_SkillButton_01",
          "UI_GCG_SkillButton_02",
          "UI_GCG_SkillButton_03",
          "UI_GCG_SkillButton_04",
          "UI_GCG_SkillButton_05",
          "UI_GCG_SkillButton_06",
          "UI_GCG_SkillButton_Choose",
        ]}
        dataUri
        fallback={
          <button
            type="button"
            class="relative w-10 h-10 p-0.5 rounded-full bg-yellow-800 b-yellow-900 data-[focused]:b-yellow-400 b-3 data-[focused]:shadow-[inset_0_0_4px_4px] shadow-yellow shadow-inset hover:bg-yellow-700 active:bg-yellow-600 data-[disabled]:cursor-not-allowed transition-all flex items-center justify-center group"
            bool:data-disabled={!props.step || props.step.isDisabled}
            bool:data-focused={props.step?.isFocused}
            onClick={(e) => props.onClick?.(e)}
            title={props.step ? props.step.tooltipText : "不是你的行动轮"}
          >
            {children()}
          </button>
        }
      >
        {(
          normal,
          hover,
          active,
          focusedNormal,
          focusedHover,
          focusedActive,
          focusedMarker,
        ) => (
          <div
            class="relative w-12 h-12 skill-button-img flex items-center justify-center"
            title={props.step ? props.step.tooltipText : "不是你的行动轮"}
            bool:data-focused={props.step?.isFocused}
            onClick={(e) => props.onClick?.(e)}
            style={{
              "--img-url": `url(${
                props.step?.isFocused ? focusedNormal : normal
              })`,
              "--img-hover-url": `url(${
                props.step?.isFocused ? focusedHover : hover
              })`,
              "--img-active-url": `url(${
                props.step?.isFocused ? focusedActive : active
              })`,
            }}
          >
            <Show when={props.step?.isFocused}>
              <img class="absolute top--1 left-0 w-full" src={focusedMarker} />
            </Show>
            <button
              class="skill-button-img-button w-full rounded-full p-2 flex items-center justify-center"
              bool:data-disabled={!props.step || props.step.isDisabled}
            >
              {children()}
            </button>
          </div>
        )}
      </WithDelicateUi>
      <div
        class="data-[hidden]:invisible"
        bool:data-hidden={props.hideDiceCost}
      >
        <DiceCost
          class="flex flex-row gap-2px"
          cost={props.cost}
          size={26}
          realCost={props.realCost}
        />
      </div>
    </div>
  );
}

export interface SkillButtonGroupProps {
  class?: string;
  skills: SkillInfo[];
  shown: boolean;
  switchActiveButton: ClickSwitchActiveButtonActionStep | null;
  switchActiveCost: PbDiceRequirement[] | null;
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
        realCost: props.switchActiveCost ?? [],
        hideDiceCost: props.switchActiveCost === null,
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
