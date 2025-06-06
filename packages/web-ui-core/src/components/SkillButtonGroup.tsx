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
import { DICE_COLOR } from "./Dice";

export interface SkillButtonProps extends SkillInfo {
  hideDiceCost?: boolean;
  isTechnique?: boolean;
  energy?: number;
  onClick?: (e: MouseEvent) => void;
}

function SwitchActiveIcon() {
  return (
    <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_ddd_34_454)">
        <circle cx="257" cy="101" r="62" fill="#FCD08D" stroke="#B4673C" stroke-width="10" stroke-opacity="0.7"/>
        <path d="M257.5 168C324.784 179.021 355.953 196.592 383.215 212.332C389.595 216.015 389.595 218.883 383.215 224.683L349.573 251.365C321 407.5 268.021 449 257 449C245.979 449 191 408 166.282 254.845L126.84 222.363C122.199 217.143 121.262 215.53 126.84 212.332C163.962 191.041 186.156 180.181 257.5 168Z" fill="#B4673C" fill-opacity="0.7"/>
        <path d="M257.5 178C315.5 187.5 342.5 201.785 366 215.353C371.5 218.528 371.5 221 366 226L337 249C314 383.5 266.5 436.5 257 436.5C247.5 436.5 197 384 179 252L145 224C141 219.5 140.192 218.11 145 215.353C177 197 196 188.5 257.5 178Z" fill="#FCD08D"/>
        <circle cx="345.5" cy="344.5" r="107.5" fill="#B4673C" fill-opacity="0.7"/>
        <path d="M345 259.5C404 259.5 429.5 306 429.5 328C429.5 336.433 426.5 340 421.5 340H410.5C404 340 399 340 397.5 331C370.5 267 313 295.5 307 313.5L317.5 326.591C320 330.5 318.5 334.025 312 334.025H273C266 334.025 266 331 266 326.591V285.5C266 281 270 277 275.5 282.5L282.5 288.5C293.5 277.5 314.5 259.5 345 259.5Z" fill="#FCD08D"/>
        <path d="M349.5 428.5C290.5 428.5 265 382 265 360C265 351.567 268 348 273 348L284 348C290.5 348 295.5 348 297 357C324 421 381.5 392.5 387.5 374.5L377 361.409C374.5 357.5 376 353.976 382.5 353.976L421.5 353.976C428.5 353.976 428.5 357 428.5 361.409L428.5 402.5C428.5 407 424.5 411 419 405.5L412 399.5C401 410.5 380 428.5 349.5 428.5Z" fill="#FCD08D"/>
      </g>
      <defs>
        <filter id="filter0_ddd_34_454" x="-8" y="-5" width="528" height="528" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset/>
          <feGaussianBlur stdDeviation="0.25"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.18 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_34_454"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="3"/>
          <feGaussianBlur stdDeviation="4"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"/>
          <feBlend mode="normal" in2="effect1_dropShadow_34_454" result="effect2_dropShadow_34_454"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dx="1" dy="3"/>
          <feGaussianBlur stdDeviation="1.5"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"/>
          <feBlend mode="normal" in2="effect2_dropShadow_34_454" result="effect3_dropShadow_34_454"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect3_dropShadow_34_454" result="shape"/>
        </filter>
      </defs>
    </svg>
  );
}

function SkillAbandonIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="24"
        cy="24"
        r="20"
        stroke="#897660"
        stroke-width="6"
        fill="none"
      />
      <line
        x1="38"
        y1="10"
        x2="10"
        y2="38"
        stroke="#897660"
        stroke-width="6"
      />
    </svg>
  );
}

function SkillButton(props: SkillButtonProps) {
  const skillId = createMemo(() => props.id);
  const color = createMemo(() => {
    const diceType =
      props.cost.find((item) => item.type >= 1 && item.type <= 7)?.type ?? 8;
    return `var(--c-${DICE_COLOR[diceType]})`;
  });
  const isBurst = createMemo(
    () => props.cost.find((item) => item.type === 9) && !props.isTechnique,
  );
  const children = () => (
    <Switch>
      <Match when={typeof skillId() === "number"}>
        <Image
          imageId={skillId() as number}
          class="w-full group-data-[disabled]:opacity-50"
        />
      </Match>
      <Match when={skillId() === "switchActive"}>
        <div class="w-full group-data-[disabled]:opacity-50 scale-110%">
          <SwitchActiveIcon />
        </div>
      </Match>
    </Switch>
  );

  return (
    <div
      class="relative w-12 flex flex-col items-center gap-0.5 group select-none"
      style={{
        "--color": color(),
      }}
    >
      {/* 元素爆发特效动画 */}
      <Show when={isBurst() && props.energy === 1}>
        <For each={[1, 2, 3]}>
          {(i) => (
            <div
              class="absolute inset-0 w-12 h-12 rounded-full border-6 opacity-80 pointer-events-none b-[var(--color)] burst-animator"
              style={{ "--animation-name": `elemental-burst-${i}` }}
            />
          )}
        </For>
      </Show>
      <WithDelicateUi
        assetId={[
          "UI_GCG_SkillButton_01",
          "UI_GCG_SkillButton_02",
          "UI_GCG_SkillButton_03",
          "UI_GCG_SkillButton_04",
          "UI_GCG_SkillButton_05",
          "UI_GCG_SkillButton_06",
          "UI_GCG_SkillButton_Choose",
          "UI_GCG_SkillButton_Burst",
        ]}
        dataUri
        fallback={
          <button
            type="button"
            class="relative w-10 h-10 p-0.5 rounded-full bg-yellow-800 b-yellow-900 data-[focused]:b-yellow-400 b-3 data-[focused]:shadow-[inset_0_0_4px_4px] shadow-yellow shadow-inset hover:bg-yellow-700 active:bg-yellow-600 data-[disabled]:cursor-not-allowed transition-all flex items-center justify-center group data-[mini]:w-8 data-[mini]:h-8 data-[mini]:mt-1 data-[mini]:mb-1"
            bool:data-disabled={!props.step || props.step.isDisabled}
            bool:data-focused={props.step?.isFocused}
            bool:data-mini={props.isTechnique}
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
          burst,
        ) => (
          <div
            class="relative w-12 h-12 skill-button-img flex items-center justify-center data-[mini]:w-9.6 data-[mini]:h-9.6 data-[mini]:mt-1.7 data-[mini]:mb-0.7 data-[disabled]:saturate-80 data-[disabled]:brightness-80"
            title={props.step ? props.step.tooltipText : "不是你的行动轮"}
            bool:data-mini={props.isTechnique}
            bool:data-focused={props.step?.isFocused}
            bool:data-disabled={!props.step || props.step.isDisabled}
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
            <Show when={isBurst()}>
              <img
                class="absolute top-0 left-0 w-full pointer-events-none"
                src={burst}
              />
              <div
                class="absolute w-11.5 h-11.5 rounded-full border-3.2 saturate-100 brightness-100 pointer-events-none b-[var(--color)] burst-progress"
                style={{
                  "--progress-value":
                    (100 * (props.energy ?? 0)).toFixed(0) + "%",
                }}
              />
            </Show>
            <Show when={props.step?.isFocused}>
              <img class="absolute top--1 left-0 w-full" src={focusedMarker} />
            </Show>
            <button
              class="skill-button-img-button w-full rounded-full p-1.5 flex items-center justify-center data-[abled]:bg-[radial-gradient(circle_at_center,#d67f3f_0%,transparent_45%)] group"
              bool:data-abled={props.step && !props.step.isDisabled}
              bool:data-disabled={!props.step || props.step.isDisabled}
            >
              {children()}
            </button>
          </div>
        )}
      </WithDelicateUi>
      {/* 禁用标志 */}
      <Show when={!props.step}>
        <div class="absolute top-7 left-7 w-5 h-5 flex p-0.7 items-center justify-center rounded-full bg-[radial-gradient(circle_at_center,#38200d_0%,#624522_60%,#624522_66%,#38200d_70%)]">
          <SkillAbandonIcon />
        </div>
      </Show>
      <div
        class="data-[hidden]:invisible data-[disabled]:saturate-80 data-[disabled]:brightness-80"
        bool:data-hidden={props.hideDiceCost}
        bool:data-disabled={!props.step || props.step.isDisabled}
      >
        <DiceCost
          class="flex flex-row gap-4px"
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
  switchActiveCost: Map<number, PbDiceRequirement[]> | null;
  onClick?: (skill: SkillInfo) => void;
}

const DEFAULT_SWITCH_ACTIVE_COST: PbDiceRequirement[] = [
  { type: DiceType.Void, count: 1 },
];

export function SkillButtonGroup(props: SkillButtonGroupProps) {
  const skills = createMemo<SkillInfo[]>(() => {
    if (props.switchActiveButton) {
      const step = props.switchActiveButton;
      const realCost = props.switchActiveCost?.get(step.targetCharacterId ?? 0);
      const skillInfo = {
        id: "switchActive" as const,
        step: step,
        cost: DEFAULT_SWITCH_ACTIVE_COST,
        realCost: realCost ?? [],
        hideDiceCost: !realCost,
      };
      return [skillInfo];
    } else {
      return props.skills;
    }
  });
  return (
    <div
      class={`flex flex-row-reverse gap-1 transition-all-100 transition-opacity opacity-0 data-[shown]:opacity-100 pointer-events-none data-[shown]:pointer-events-auto ${
        props.class ?? ""
      }`}
      bool:data-shown={props.shown}
    >
      <Key each={[...skills()].reverse()} by="id">
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
