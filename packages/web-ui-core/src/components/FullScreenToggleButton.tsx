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
import { Show } from "solid-js";
import FullScreen from "../svg/FullScreen.svg?fb";
import NormalScreen from "../svg/NormalScreen.svg?fb";

export interface FullScreenToggleButtonProps {
  isFullScreen: boolean;
  onClick?: () => void;
}

export function FullScreenToggleButton(props: FullScreenToggleButtonProps) {
  return (
    <button
      class="h-8 w-8 flex items-center justify-center rounded-full b-2 bg-#e9e2d3 text-black/70 b-black/70 hover:b-white active:bg-#cfa56a active:b-#91744a transition-colors line-height-none cursor-pointer"
      onClick={() => {
        props.onClick?.();
      }}
    >
      <Show
        when={!props.isFullScreen}
        fallback={<NormalScreen class="h-5 w-5" />}
      >
        <FullScreen class="h-5 w-5" />
      </Show>
    </button>
  );
}
