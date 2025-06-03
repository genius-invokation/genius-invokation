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

import { createSignal, Show } from "solid-js";
import { Button } from "./Button";
import type { ChessboardViewType } from "./Chessboard";

export interface SwitchHandsViewProps {
  viewType: ChessboardViewType;
  onConfirm: () => void;
  setShownCard: () => void;
}

export function SwitchHandsView(props: SwitchHandsViewProps) {
  const [shown, setShown] = createSignal(true);
  return (
    <Show when={props.viewType === "switchHands"}>
      <Show when={shown()}>
        <div class="absolute pointer-events-none inset-0 flex flex-col items-center">
          <div class="absolute w-480 h-480 top-50% left-50% -translate-x-50% -translate-y-50% bg-green-50/90 select-none z-0 switchhands-bg"/>
          <h3 class="absolute top-50% -translate-y-40 font-bold text-3xl text-black z-1">替换手牌</h3>
          <div class="flex-grow" />
          <Button class="absolute top-50% translate-y-40 pointer-events-auto z-1" onClick={props.onConfirm}>
            确认
          </Button>
        </div>
      </Show>
      <button
        class="absolute right-22.3 top-2.5 h-8 w-8 flex items-center justify-center rounded-full b-yellow-800 b-1 bg-yellow-50 hover:bg-yellow-100 active:bg-yellow-200 text-yellow-800 transition-colors line-height-none cursor-pointer z-1"
        onClick={() => {setShown((v) => !v); props.setShownCard();}}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
        >
          <g
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-width="2"
          >
            <path
              stroke-linejoin="round"
              d="M10.73 5.073A11 11 0 0 1 12 5c4.664 0 8.4 2.903 10 7a11.6 11.6 0 0 1-1.555 2.788M6.52 6.519C4.48 7.764 2.9 9.693 2 12c1.6 4.097 5.336 7 10 7a10.44 10.44 0 0 0 5.48-1.52m-7.6-7.6a3 3 0 1 0 4.243 4.243"
            />
            <path d="m4 4l16 16" />
          </g>
        </svg>
      </button>
    </Show>
  );
}
