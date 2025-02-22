// Copyright (C) 2024-2025 Guyutongxue
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

import { DiceType } from "@gi-tcg/typings";

import { Image } from "./Image";
import { Match, Switch, mergeProps } from "solid-js";

export interface DiceProps {
  type: number;
  selected?: boolean;
  size?: number;
  text?: string;
  color?: DiceColor;
}

export type DiceColor = "normal" | "increased" | "decreased";

export const DICE_COLOR: Record<number, string> = {
  [DiceType.Void]: "void",
  [DiceType.Cryo]: "cryo",
  [DiceType.Hydro]: "hydro",
  [DiceType.Pyro]: "pyro",
  [DiceType.Electro]: "electro",
  [DiceType.Anemo]: "anemo",
  [DiceType.Geo]: "geo",
  [DiceType.Dendro]: "dendro",
  [DiceType.Omni]: "omni",
  [DiceType.Energy]: "heal",
  10: "heal",
};

function EnergyIcon(props: { size: number }) {
  return (
    <svg // 能量图标
      width="14"
      height="14"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 15 15"
      style={{ height: `${props.size}px`, width: `${props.size}px` }}
    >
      <path
        d="M7.5 2.143c-.222 0-.623.548-1.02 1.188a4.301 4.301 0 00-3.15 3.152c-.64.396-1.187.797-1.187 1.017 0 .22.547.62 1.186 1.017a4.301 4.301 0 003.152 3.152c.396.64.797 1.188 1.019 1.188.222 0 .623-.548 1.02-1.188a4.301 4.301 0 003.149-3.15c.64-.396 1.188-.797 1.188-1.019 0-.22-.542-.619-1.178-1.013a4.301 4.301 0 00-3.166-3.166C8.119 2.685 7.72 2.143 7.5 2.143z"
        fill="#c6a370"
        fill-rule="evenodd"
        stroke="#997650"
        stroke-width=".40500054"
        stroke-linejoin="round"
        stroke-opacity=".988"
        paint-order="markers stroke fill"
      />
      <path
        d="M7.5 3.214C6.429 5.357 5.357 6.43 3.214 7.5 5.357 8.571 6.43 9.643 7.5 11.786 8.571 9.643 9.643 8.57 11.786 7.5 9.643 6.429 8.57 5.357 7.5 3.214z"
        fill="#ec9f38"
        stroke="#d78535"
        stroke-width=".202"
      />
      <path
        d="M7.5 1.071C6.964 6.43 6.429 6.964 1.071 7.5c5.358.536 5.893 1.071 6.429 6.429.536-5.358 1.071-5.893 6.429-6.429C8.57 6.964 8.036 6.429 7.5 1.071z"
        fill="#ffffdf"
      />
    </svg>
  );
}

function LegendIcon(props: { size: number }) {
  return (
    <svg
      aria-hidden="true"
      data-icon="GCG_DICE_LEGEND"
      width="14"
      height="14"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 15 15"
      style={{ height: `${props.size}px`, width: `${props.size}px` }}
    >
      <path
        d="M3.733 3.214h7.534c.287 0 .519.232.519.52v7.533a.518.518 0 01-.52.519H3.734a.518.518 0 01-.519-.52V3.734c0-.287.232-.519.52-.519z"
        fill="#d4c0a5"
        fill-rule="evenodd"
      />
      <path
        d="M3.732 3.16a.572.572 0 00-.572.572v7.536c0 .316.256.572.572.572h7.536a.572.572 0 00.572-.572V3.732a.572.572 0 00-.572-.572zm0 .108h7.536c.258 0 .464.206.464.464v7.536a.462.462 0 01-.464.464H3.732a.462.462 0 01-.464-.464V3.732c0-.258.206-.464.464-.464z"
        color="#000"
        fill="#81664b"
        fill-rule="evenodd"
      />
      <path
        d="M7.5 2.143c-.532 0-5.357 4.823-5.357 5.357 0 .534 4.828 5.357 5.357 5.357.53 0 5.357-4.824 5.357-5.357 0-.533-4.825-5.357-5.357-5.357z"
        fill="#e5e1ea"
      />
      <path
        d="M7.5 2.143c-.532 0-5.357 4.823-5.357 5.357h2.143L7.5 4.286V2.143z"
        fill="#c8e4f3"
      />
      <path
        d="M7.5 2.143v2.143L10.714 7.5h2.143c0-.533-4.825-5.357-5.357-5.357z"
        fill="#527db5"
      />
      <path
        d="M4.286 7.5H2.143c0 .534 4.828 5.357 5.357 5.357v-2.143z"
        fill="#8468ab"
      />
      <path
        d="M10.714 7.5L7.5 10.714v2.143c.53 0 5.357-4.824 5.357-5.357h-2.143z"
        fill="#d4abea"
      />
      <path
        d="M7.5 1.071c-.638 0-6.429 5.788-6.429 6.429 0 .64 5.794 6.429 6.429 6.429.635 0 6.429-5.79 6.429-6.429 0-.64-5.79-6.429-6.429-6.429zm0 1.072c.532 0 5.357 4.824 5.357 5.357 0 .533-4.828 5.357-5.357 5.357-.53 0-5.357-4.823-5.357-5.357 0-.534 4.825-5.357 5.357-5.357z"
        color="#000"
        fill="#d4c0a5"
      />
      <path
        d="M7.5 1.017a.448.448 0 00-.203.073c-.08.045-.178.108-.289.189-.221.16-.501.39-.818.667a47.237 47.237 0 00-2.18 2.061A47.216 47.216 0 001.945 6.19c-.277.317-.506.596-.667.818-.081.111-.144.208-.189.289a.447.447 0 00-.073.203c0 .06.029.122.073.203.045.08.108.178.189.289.16.222.39.5.667.818a47.245 47.245 0 002.063 2.183 47.386 47.386 0 002.183 2.06c.317.278.597.507.818.668.111.081.206.144.287.189.08.044.143.073.203.073.06 0 .122-.029.203-.073a2.83 2.83 0 00.287-.189c.221-.16.501-.39.818-.667a47.395 47.395 0 002.183-2.061 47.308 47.308 0 002.063-2.183c.277-.317.506-.596.667-.818.081-.111.144-.208.189-.289a.447.447 0 00.073-.203.447.447 0 00-.073-.203 2.82 2.82 0 00-.189-.289c-.16-.222-.39-.5-.667-.818a47.279 47.279 0 00-2.063-2.183 47.247 47.247 0 00-2.181-2.06 12.489 12.489 0 00-.818-.668 2.824 2.824 0 00-.289-.189.447.447 0 00-.203-.073zm0 .109c.02 0 .076.018.15.058.075.041.17.101.279.18.217.158.494.386.81.662a47.196 47.196 0 012.176 2.057 47.228 47.228 0 012.06 2.178c.275.316.503.593.66.81.08.109.14.202.18.276.041.075.06.133.06.153 0 .02-.019.078-.06.153-.04.074-.1.167-.18.276a12.51 12.51 0 01-.663.81 47.12 47.12 0 01-2.057 2.178 47.343 47.343 0 01-2.178 2.057c-.316.276-.593.504-.81.662a2.71 2.71 0 01-.276.18.439.439 0 01-.151.058.439.439 0 01-.15-.058 2.71 2.71 0 01-.277-.18 12.461 12.461 0 01-.81-.662 47.333 47.333 0 01-2.178-2.057A47.057 47.057 0 012.028 8.74a12.497 12.497 0 01-.664-.81 2.697 2.697 0 01-.18-.276.44.44 0 01-.058-.153c0-.02.018-.078.058-.153a2.7 2.7 0 01.18-.276c.158-.217.386-.494.662-.81a47.166 47.166 0 012.059-2.178A47.187 47.187 0 016.26 2.026c.316-.276.593-.504.81-.662a2.7 2.7 0 01.278-.18.438.438 0 01.151-.058zm0 .962a.379.379 0 00-.174.063c-.067.037-.148.09-.24.157-.185.135-.418.326-.683.557a39.35 39.35 0 00-1.818 1.718A39.386 39.386 0 002.865 6.4a10.34 10.34 0 00-.557.685c-.067.092-.12.172-.157.24a.379.379 0 00-.063.174c0 .054.026.106.063.174.037.068.09.148.157.24.135.186.326.42.557.685a39.41 39.41 0 001.72 1.818c.637.637 1.29 1.256 1.818 1.718.265.231.498.422.683.557.092.067.173.12.24.157.068.037.12.063.174.063a.378.378 0 00.174-.063c.067-.037.148-.09.24-.157.185-.135.418-.326.683-.557a39.513 39.513 0 001.818-1.718 39.425 39.425 0 001.72-1.82c.231-.265.422-.497.557-.683.067-.092.12-.172.157-.24a.378.378 0 00.063-.174.379.379 0 00-.063-.174 2.34 2.34 0 00-.157-.24 10.39 10.39 0 00-.557-.683 39.4 39.4 0 00-1.72-1.82 39.358 39.358 0 00-1.818-1.718 10.41 10.41 0 00-.683-.557 2.342 2.342 0 00-.24-.157.379.379 0 00-.174-.063zm0 .11c.013 0 .06.012.121.045.062.034.14.085.23.151.181.131.412.32.674.55.526.46 1.179 1.08 1.815 1.716a39.29 39.29 0 011.714 1.813c.23.262.42.495.552.675.066.09.117.17.15.23a.351.351 0 01.047.122c0 .013-.013.06-.046.121-.034.062-.085.14-.151.23-.131.181-.323.414-.552.676a39.312 39.312 0 01-1.714 1.813 39.598 39.598 0 01-1.815 1.716c-.262.23-.493.419-.673.55-.09.066-.17.117-.23.15a.353.353 0 01-.122.047.353.353 0 01-.121-.046 2.294 2.294 0 01-.23-.151c-.181-.131-.412-.32-.674-.55a39.453 39.453 0 01-1.815-1.714 39.223 39.223 0 01-1.714-1.815c-.23-.262-.42-.495-.552-.675a2.283 2.283 0 01-.15-.23.35.35 0 01-.047-.122.35.35 0 01.046-.121c.034-.062.085-.14.151-.23.131-.181.323-.414.552-.676A39.2 39.2 0 014.66 4.658a39.3 39.3 0 011.815-1.714c.262-.23.493-.419.673-.55a2.29 2.29 0 01.23-.15.352.352 0 01.122-.047z"
        color="#000"
        fill="#81664b"
      />
    </svg>
  );
}

function DiceIcon(props: { size: number; type: DiceType; selected: boolean }) {
  return (
    <svg // 骰子图标
      width="14"
      height="14"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 15 15"
      class="fill-current w-10 h-10"
      style={{
        height: `${props.size}px`,
        width: `${props.size}px`,
        color: `var(--c-${DICE_COLOR[props.type]})`,
      }}
    >
      <path
        d="M7.5 2.065L2.97 4.784v5.432l4.53 2.719 4.53-2.719V4.784z"
        stroke-width=".214"
        stroke-linejoin="round"
        fill="#FFF"
        stroke="gray"
      />
      <path
        d="M7.5 2.065L2.97 4.784v5.432l4.53 2.719 4.53-2.719V4.784z"
        opacity=".2"
      />
      <path
        d="M7.5 1.071L2.143 4.286v6.428L7.5 13.93l5.357-3.215V4.286L7.5 1.07zm0 .994l4.53 2.719v5.432L7.5 12.935l-4.53-2.719V4.784L7.5 2.065z"
        fill="#D4C0A5"
        stroke="#dc2626"
        stroke-width={props.selected ? 1 : 0}
        stroke-linejoin="round"
      />
      <path
        d="M7.5 7.5V2.065L2.97 4.784zM7.5 12.935V7.5l4.53 2.716z"
        opacity=".6"
      />
      <path d="M2.97 4.784L7.5 7.5l-4.53 2.716z" opacity=".9" />
      <path d="M7.5 12.935V7.5l-4.53 2.716zm0-10.87V7.5l4.53-2.716z" />
      <path d="M7.5 7.5l4.53-2.716v5.432z" opacity=".9" />
    </svg>
  );
}

export function Dice(props: DiceProps) {
  const merged = mergeProps(
    {
      selected: false,
      size: 25,
      color: "normal" as DiceColor,
    },
    props,
  );

  return (
    <div class="relative flex items-center justify-center m--1">
      <Switch>
        <Match when={merged.type === 9}>
          <EnergyIcon size={merged.size} />
        </Match>
        <Match when={merged.type === 10}>
          <LegendIcon size={merged.size} />
        </Match>
        <Match when={true}>
          <DiceIcon {...merged} />
        </Match>
      </Switch>
      <Switch>
        <Match when={merged.text}>
          <span
            class="absolute text-outline text-black data-[void]:text-white data-[color=increased]:text-red-500 data-[color=decreased]:text-green-500"
            data-color={merged.color}
            bool:data-void={merged.color === "normal" && merged.type === DiceType.Void}
            style={{
              "font-size": `${0.4 * merged.size}px`,
            }}
          >
            {merged.text}
          </span>
        </Match>
        <Match when={merged.type >= 1 && merged.type <= 7}>
          <Image
            class="absolute"
            imageId={merged.type}
            height={0.6 * merged.size}
            width={0.6 * merged.size}
          />
        </Match>
      </Switch>
    </div>
  );
}
