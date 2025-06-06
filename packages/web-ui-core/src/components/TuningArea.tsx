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

import { createMemo } from "solid-js";
import type { TunningAreaInfo } from "./Chessboard";
import { cssPropertyOfTransform } from "../ui_state";

export interface TuningAreaProps extends TunningAreaInfo {}

export function TuningArea(props: TuningAreaProps) {
  const status = () => {
    if (!props.draggingHand || !props.draggingHand.tuneStep) {
      return "none";
    }
    if (props.draggingHand.status !== "moving") {
      return "hidden";
    }
    if (props.cardHovering) {
      return "shown-hovering";
    }
    return "shown";
  };
  return (
    <div
      class="absolute top-0 left-0 h-full opacity-0 data-[status=shown]:opacity-75%  data-[status=shown-hovering]:opacity-100% w-0 data-[status^=shown]:w-20 invisible data-[status^=shown]:visible pr-0 data-[status^=shown]:pr-8 transition-all flex items-center justify-center text-4xl text-#e7d090 dice-panel"
      data-status={status()}
      bool:data-card-hovering={props.cardHovering}
      style={cssPropertyOfTransform(props.transform)}
    >
      <div class="w-8 h-8">
        <TunningIcon />
      </div>
    </div>
  );
}

function TunningIcon() {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      <g filter="url(#filter0_ddd_48_508)">
        <mask
          id="mask0_48_508"
          style={{ "mask-type": "alpha" }}
          maskUnits="userSpaceOnUse"
          x="60"
          y="35"
          width="394"
          height="442"
        >
          <path
            d="M238.364 39.6895C249.193 33.4373 262.535 33.4374 273.364 39.6895L434.229 132.564C445.058 138.817 451.729 150.371 451.729 162.875V301.412C410.877 276.202 357.125 287.958 330.62 328.347C308.409 362.194 312.261 405.593 337.271 434.916L273.364 471.812C262.535 478.064 249.193 478.064 238.364 471.812L77.5 378.937C66.6711 372.684 60.0001 361.13 60 348.626V162.875C60.0001 150.371 66.6711 138.817 77.5 132.564L238.364 39.6895Z"
            fill="black"
          />
          <path
            d="M238.364 39.6895C249.193 33.4373 262.535 33.4374 273.364 39.6895L434.229 132.564C445.058 138.817 451.729 150.371 451.729 162.875V301.412C410.877 276.202 357.125 287.958 330.62 328.347C308.409 362.194 312.261 405.593 337.271 434.916L273.364 471.812C262.535 478.064 249.193 478.064 238.364 471.812L77.5 378.937C66.6711 372.684 60.0001 361.13 60 348.626V162.875C60.0001 150.371 66.6711 138.817 77.5 132.564L238.364 39.6895Z"
            stroke="#F5E09E"
          />
        </mask>
        <g mask="url(#mask0_48_508)">
          <path
            d="M247.415 55.2588C252.661 52.2304 259.085 52.1362 264.404 54.9756L264.915 55.2588L425.779 148.135C431.194 151.261 434.529 157.038 434.529 163.29V349.04C434.529 355.292 431.194 361.069 425.779 364.195L264.915 457.071C259.67 460.1 253.245 460.194 247.926 457.354L247.415 457.071L86.5508 364.195C81.1363 361.069 77.8008 355.292 77.8008 349.04V163.29C77.8008 157.233 80.9307 151.622 86.0488 148.436L86.5508 148.135L247.415 55.2588Z"
            fill="#CC8C44"
            stroke="#F5E09E"
            stroke-width="35"
          />
          <path
            d="M243 95.2169C250.735 90.7511 260.265 90.7511 268 95.2169L388.059 164.533C395.794 168.999 400.559 177.252 400.559 186.184V324.816C400.559 333.748 395.794 342.001 388.059 346.467L268 415.783C260.265 420.249 250.735 420.249 243 415.783L122.941 346.467C115.206 342.001 110.441 333.748 110.441 324.816V186.184C110.441 177.252 115.206 168.999 122.941 164.533L243 95.2169Z"
            fill="#F5E09E"
          />
          <line
            x1="255"
            y1="88"
            x2="255"
            y2="423"
            stroke="#CC8C44"
            stroke-width="8"
          />
          <line
            x1="110.938"
            y1="171.282"
            x2="401.057"
            y2="338.782"
            stroke="#CC8C44"
            stroke-width="8"
          />
          <line
            x1="399.057"
            y1="172.218"
            x2="108.938"
            y2="339.718"
            stroke="#CC8C44"
            stroke-width="8"
          />
          <mask
            id="mask1_48_508"
            style={{ "mask-type": "alpha" }}
            maskUnits="userSpaceOnUse"
            x="60"
            y="35"
            width="393"
            height="442"
          >
            <path
              d="M247.415 55.2588C252.661 52.2304 259.085 52.1362 264.404 54.9756L264.915 55.2588L425.779 148.135C431.194 151.261 434.529 157.038 434.529 163.29V349.04C434.529 355.292 431.194 361.069 425.779 364.195L264.915 457.071C259.67 460.1 253.245 460.194 247.926 457.354L247.415 457.071L86.5508 364.195C81.1363 361.069 77.8008 355.292 77.8008 349.04V163.29C77.8008 157.233 80.9307 151.622 86.0488 148.436L86.5508 148.135L247.415 55.2588Z"
              fill="#CC8C44"
              stroke="#F5E09E"
              stroke-width="35"
            />
          </mask>
          <g mask="url(#mask1_48_508)">
            <circle
              cx="399.5"
              cy="375.5"
              r="103.5"
              stroke="#CC8C44"
              stroke-width="40"
            />
          </g>
        </g>
        <path
          d="M400.098 480.72C334.471 480.72 295 427.458 295 373.72C295 319.982 340.178 271 400.098 271C444.8 271 466.2 291.924 482.844 310.471L491.88 302.862C499.013 296.68 505.671 302.862 505.671 311.898L509 355.173C509 367.062 504.244 368.964 495.209 368.964L452.884 364.684C442.898 363.258 437.667 355.173 443.849 348.04L454.787 336.627C451.458 331.871 434.813 309.044 400.098 309.044C365.382 309.044 333.52 338.529 333.52 373.72C333.52 408.911 357.773 442.676 400.098 442.676C442.422 442.676 461.92 409.862 466.2 389.889C468.34 379.902 478.089 378.951 487.124 379.902C496.16 380.853 505.457 386.202 501.867 404.156C496.16 432.689 460.969 480.72 400.098 480.72Z"
          fill="#F5E09E"
        />
      </g>
      <defs>
        <filter
          id="filter0_ddd_48_508"
          x="-8"
          y="-5"
          width="528"
          height="528"
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
          <feGaussianBlur stdDeviation="0.25" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.18 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_48_508"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="3" />
          <feGaussianBlur stdDeviation="4" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
          />
          <feBlend
            mode="normal"
            in2="effect1_dropShadow_48_508"
            result="effect2_dropShadow_48_508"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx="1" dy="3" />
          <feGaussianBlur stdDeviation="1.5" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
          />
          <feBlend
            mode="normal"
            in2="effect2_dropShadow_48_508"
            result="effect3_dropShadow_48_508"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect3_dropShadow_48_508"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
}
