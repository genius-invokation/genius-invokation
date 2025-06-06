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

import { PbModifyDirection } from "@gi-tcg/typings";
import { createMemo, Show } from "solid-js";
import { StrokedText } from "./StrokedText";

export interface VariableDiffProps {
  class?: string;
  defeated?: boolean;
  oldValue: number;
  newValue: number;
  direction: PbModifyDirection;
}

export function VariableDiff(props: VariableDiffProps) {
  const increase = createMemo(
    () =>
      props.direction !== PbModifyDirection.DECREASE &&
      props.newValue >= props.oldValue,
  );
  const backgroundColor = createMemo(() =>
    increase() ? "#6e9b3a" : props.defeated ? "#a25053" : "#d14f51",
  );
  return (
    <div
      class={`scale-85%  text-white  h-8 py-1 px-5 variable-diff flex items-center justify-center ${
        props.class ?? ""
      }`}
      style={{
        "--bg-color": backgroundColor(),
      }}
    >
      <Show when={props.defeated}>
        <DefeatedPreviewIcon />
      </Show>
      <StrokedText
        class="flex-shrink-0 font-bold font-size-4.5 line-height-none"
        text={`${increase() ? "+" : "-"}${Math.abs(
          props.newValue - props.oldValue,
        )}`}
        strokeWidth={2}
        strokeColor="black"
      />
    </div>
  );
}

function DefeatedPreviewIcon() {
  return (
    <svg
      class="h-full flex-shrink-0 scale-120% translate-x--20%"
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      <g filter="url(#filter0_ddd_28_370)">
        <circle cx="64" cy="80.9589" r="44" fill="#864643" />
        <path
          d="M59.8242 4.41096C61.6801 1.19635 66.32 1.19635 68.176 4.41096C86.6196 36.3561 108 46.3014 108 80.9589H20C20 46.9041 41.0959 36.8493 59.8242 4.41096Z"
          fill="#864643"
        />
        <circle cx="63.9999" cy="80.4995" r="39.1781" fill="#F98283" />
        <path
          d="M60.2817 12.3404C64.131 5.67309 63.9999 5.90003 67.7182 12.3404C84.1406 40.7847 103.178 49.6401 103.178 80.4995H24.8218C24.8218 50.1767 43.6058 41.2239 60.2817 12.3404Z"
          fill="#F98283"
        />
        <circle cx="64.3256" cy="80.1116" r="34.0793" fill="#A05250" />
        <path
          d="M61.8902 21.2877C63.8041 17.9726 64.4968 17.9726 66.4107 21.2877C72.3266 31.5342 98.4049 49.9991 98.4049 80.1116H30.2463C30.2463 51.2046 55.8003 31.8356 61.8902 21.2877Z"
          fill="#A05250"
        />
        <circle cx="64.1304" cy="79.6231" r="29.0618" fill="#C56662" />
        <path
          d="M62.7946 27.9178C63.9849 25.8083 64.0001 25.7812 65.2056 27.9178C70.2505 36.8595 93.1922 53.3454 93.1922 79.6232H35.0686C35.0686 54.3974 57.6014 37.1225 62.7946 27.9178Z"
          fill="#C56662"
        />
        <rect
          x="73.5969"
          y="58.0548"
          width="10.5657"
          height="37.4394"
          rx="2.41096"
          transform="rotate(45 73.5969 58.0548)"
          fill="#A6544E"
        />
        <rect
          width="10.5657"
          height="37.4394"
          rx="2.41096"
          transform="matrix(-0.707107 0.707107 0.707107 0.707107 54.5945 58.0548)"
          fill="#A6544E"
        />
      </g>
      <defs>
        <filter
          id="filter0_ddd_28_370"
          x="-2"
          y="-1.25"
          width="132"
          height="132"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="0.0625" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.18 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_28_370"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="0.75" />
          <feGaussianBlur stdDeviation="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
          />
          <feBlend
            mode="normal"
            in2="effect1_dropShadow_28_370"
            result="effect2_dropShadow_28_370"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx="0.25" dy="0.75" />
          <feGaussianBlur stdDeviation="0.375" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
          />
          <feBlend
            mode="normal"
            in2="effect2_dropShadow_28_370"
            result="effect3_dropShadow_28_370"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect3_dropShadow_28_370"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
}
