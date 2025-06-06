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
import type { DamageInfo } from "./Chessboard";
import { createEffect, createMemo } from "solid-js";
import { StrokedText } from "./StrokedText";

export interface DamageProps {
  info: DamageInfo;
  shown: boolean;
}

function DamageIcon() {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      <g filter="url(#filter0_ddd_1_2)">
        <path
          d="M444.974 255.703C444.974 360.288 360.191 445.07 255.607 445.07C151.023 445.07 66.2402 360.288 66.2402 255.703C66.2402 151.119 151.023 66.3365 255.607 66.3365C360.191 66.3365 444.974 151.119 444.974 255.703Z"
          fill="#705941"
        />
        <path
          d="M58.6485 469.24C55.6027 475.73 63.1041 482.069 68.9944 477.984L174.535 404.788C178.138 402.289 178.59 397.133 175.477 394.045L126.906 345.869C123.464 342.454 117.678 343.479 115.618 347.868L58.6485 469.24Z"
          fill="#705941"
        />
        <path
          d="M337.677 97.8131C333.323 100.628 333.423 107.031 337.862 109.709L384.577 137.886C388.186 140.063 392.886 138.588 394.604 134.74L431.246 52.67C434.091 46.2969 426.895 40.1315 421.033 43.9209L337.677 97.8131Z"
          fill="#705941"
        />
        <path
          d="M96.4054 165.069C99.1661 169.37 105.452 169.369 108.211 165.067L137.94 118.715C140.301 115.033 138.754 110.113 134.711 108.445L53.8098 75.0714C47.4647 72.4539 41.5252 79.5671 45.2328 85.3434L96.4054 165.069Z"
          fill="#705941"
        />
        <path
          d="M425.937 259.74C425.937 265.105 431.715 268.483 436.39 265.853L471.238 246.244C476.279 243.407 475.912 236.03 470.614 233.708L435.766 218.432C431.132 216.4 425.937 219.795 425.937 224.855V259.74Z"
          fill="#705941"
        />
        <path
          d="M46.936 271.335C41.3725 274.236 42.1256 282.423 48.125 284.261L83.2235 295.008C87.7317 296.389 92.2907 293.017 92.2907 288.302V259.254C92.2907 253.988 86.7039 250.601 82.0345 253.035L46.936 271.335Z"
          fill="#705941"
        />
        <path
          d="M234.512 73.5557C232.779 78.1435 236.169 83.0482 241.073 83.0482L274.369 83.0482C279.695 83.0482 283.077 77.3441 280.523 72.6703C273.373 59.586 267.766 49.327 260.84 36.6527C257.966 31.3922 250.241 31.9252 248.123 37.5329L234.512 73.5557Z"
          fill="#705941"
        />
        <path
          d="M288.213 436.374C289.677 431.845 286.299 427.205 281.54 427.205L240.381 427.205C235.568 427.205 232.185 431.943 233.748 436.495L254.951 498.264C257.14 504.64 266.186 504.557 268.258 498.143L288.213 436.374Z"
          fill="#705941"
        />
        <path
          d="M458.997 416.822C465.505 419.162 471.114 411.668 467.034 406.084L399.257 313.337C396.879 310.083 392.255 309.498 389.141 312.057L331.274 359.619C327.069 363.075 328.232 369.796 333.354 371.637L458.997 416.822Z"
          fill="#705941"
        />
        <path
          d="M435.424 256C435.424 355.411 354.836 436 255.424 436C156.013 436 75.4244 355.411 75.4244 256C75.4244 156.589 156.013 76 255.424 76C354.836 76 435.424 156.589 435.424 256Z"
          fill="#D1B18A"
        />
        <path
          d="M67.3669 469.666L189.021 385.295L133.034 329.763L67.3669 469.666Z"
          fill="#D1B18A"
        />
        <path
          d="M321.389 117.284L378.741 151.877L423.727 51.1196L321.389 117.284Z"
          fill="#D1B18A"
        />
        <path
          d="M117.103 182.212L153.595 125.314L54.2884 84.348L117.103 182.212Z"
          fill="#D1B18A"
        />
        <path
          d="M413.149 269.769L465.439 240.345L413.149 217.423V269.769Z"
          fill="#D1B18A"
        />
        <path
          d="M51 277.596L105.999 294.438L105.999 248.92L51 277.596Z"
          fill="#D1B18A"
        />
        <path
          d="M233.963 96.3295L284.179 96.3295C272.585 75.1125 266.084 63.217 254.49 42L233.963 96.3295Z"
          fill="#D1B18A"
        />
        <path
          d="M288.706 412.028H233.629L262.002 494.685L288.706 412.028Z"
          fill="#D1B18A"
        />
        <path
          d="M459.763 409.634L381.928 303.122L315.472 357.744L459.763 409.634Z"
          fill="#D1B18A"
        />
        <circle cx="256" cy="256" r="167" fill="#F5EBBF" />
        <circle cx="256.5" cy="256.5" r="152.5" fill="#F0DFC0" />
        <path
          d="M123.5 355.531C132.5 385 122.522 399.037 118.481 408.686C118.565 409.963 119.263 410.834 120.54 410.75C129.275 405.278 145.5 391.5 171.5 399L165.764 357.692C165.611 355.709 165.436 355.556 163.301 355.532L123.5 355.531Z"
          fill="#F5EBBF"
        />
        <path
          d="M402.288 332.65C398.169 350.554 408.663 367.085 408.796 368.103C408.929 369.121 408.211 370.055 407.193 370.188C406.175 370.321 387.632 364.26 371.258 373.009L366.834 339.158C366.646 337.573 366.759 337.425 368.436 337.074L402.288 332.65Z"
          fill="#F5EBBF"
        />
        <path
          d="M115.849 168.465C120.735 150.852 111.038 133.958 110.951 132.94C110.864 131.922 111.618 131.027 112.636 130.939C113.654 130.852 131.815 137.697 148.477 129.727L151.374 163.567C151.491 165.151 151.372 165.292 149.689 165.567L115.849 168.465Z"
          fill="#F5EBBF"
        />
        <path
          d="M331.851 108.069C365.444 113.237 371.646 104.451 379.788 99.283C380.961 99.1608 381.861 99.6604 381.983 100.833C378.365 109.619 369.062 123.574 381.466 147.347L340.782 150.156C338.956 150.325 338.791 150.19 338.437 148.254L331.851 108.069Z"
          fill="#F5EBBF"
        />
        <circle cx="256" cy="256" r="138" fill="#F2EEDA" />
      </g>
      <defs>
        <filter
          id="filter0_ddd_1_2"
          x="-3.79259"
          y="-2.37037"
          width="519.585"
          height="519.585"
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
          <feGaussianBlur stdDeviation="0.118519" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.18 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1_2"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="1.42222" />
          <feGaussianBlur stdDeviation="1.8963" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
          />
          <feBlend
            mode="normal"
            in2="effect1_dropShadow_1_2"
            result="effect2_dropShadow_1_2"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx="0.474074" dy="1.42222" />
          <feGaussianBlur stdDeviation="0.711111" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
          />
          <feBlend
            mode="normal"
            in2="effect2_dropShadow_1_2"
            result="effect3_dropShadow_1_2"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect3_dropShadow_1_2"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
}

function HealIcon() {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      <g filter="url(#filter0_ddd_15_133)">
        <circle cx="256" cy="256" r="187" fill="#417049" />
        <path
          d="M233 52C254.5 37.5 259.701 37.9428 281 52C305.5 68.17 336.5 81 369 107H143C175.5 79 208.5 67.5 233 52Z"
          fill="#417049"
        />
        <circle cx="256" cy="255.672" r="180" fill="#8AD19B" />
        <path
          d="M233.861 59.3087C254.556 45.3515 259.562 45.7777 280.064 59.3087C303.647 74.8734 333.487 87.2231 364.77 112.25H147.23C178.513 85.298 210.278 74.2285 233.861 59.3087Z"
          fill="#8AD19B"
        />
        <circle cx="255.5" cy="255.5" r="167.5" fill="#DAF5BF" />
        <circle cx="255.5" cy="255.5" r="152.5" fill="#B6E7AD" />
        <path
          d="M254.35 120.984C254.856 122.212 257.069 122.46 257.6 120.984C261.209 110.945 277.435 104.14 289.996 101H223C235.562 103.617 250.217 110.945 254.35 120.984Z"
          fill="#DAF5BF"
        />
        <path
          d="M254.35 390.016C254.856 388.788 257.069 388.54 257.6 390.016C261.209 400.055 277.435 406.86 289.996 410H223C235.562 407.383 250.217 400.055 254.35 390.016Z"
          fill="#DAF5BF"
        />
        <circle cx="256" cy="256" r="138" fill="#F2EEDA" />
      </g>
      <defs>
        <filter
          id="filter0_ddd_15_133"
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
            result="effect1_dropShadow_15_133"
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
            in2="effect1_dropShadow_15_133"
            result="effect2_dropShadow_15_133"
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
            in2="effect2_dropShadow_15_133"
            result="effect3_dropShadow_15_133"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect3_dropShadow_15_133"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
}

export function Damage(props: DamageProps) {
  const damageType = createMemo(() => props.info.damageType);
  const damageValue = createMemo(() => props.info.value);
  return (
    <div class="absolute z-5 top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
      <div
        class="relative w-28 h-28 transition-all-100 transition-discrete hidden data-[shown]:flex scale-80 data-[shown]:scale-100 starting:data-[shown]:scale-80"
        bool:data-shown={props.shown}
        style={{
          color: `var(--c-${DICE_COLOR[damageType()]})`,
        }}
      >
        <div class="absolute h-full w-full">
          {damageType() === DamageType.Heal ? <HealIcon /> : <DamageIcon />}
        </div>
        <div
          class="relative h-full w-full data-[heal=false]:animate-[damage-text-enter_200ms_both] text-5xl font-bold text-center"
          data-heal={damageType() === DamageType.Heal}
        >
          <StrokedText
            class="absolute translate-x-[calc(-50%-0.1rem)] top-50% left-50% translate-y-[calc(-50%+0.05rem)] "
            text={`${
              damageType() === DamageType.Heal ? "+" : "-"
            }${damageValue()}`}
            strokeColor="#fffae3"
            strokeWidth={7}
          />
        </div>
      </div>
    </div>
  );
}
