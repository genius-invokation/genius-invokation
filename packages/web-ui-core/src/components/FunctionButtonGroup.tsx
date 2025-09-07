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
import { For, Show } from "solid-js";
import VisibilityIcon from "../svg/VisibilityIcon.svg?fb";
import HistoryIcon from "../svg/HistoryIcon.svg?fb";
import FullScreen from "../svg/FullScreen.svg?fb";
import NormalScreen from "../svg/NormalScreen.svg?fb";
import ExitIcon from "../svg/Exit.svg?fb";
import SettingIcon from "../svg/Setting.svg?fb";
import ClothIcon from "../svg/Cloth.svg?fb";
import BackwardIcon from "../svg/Backward.svg?fb";

export type ButtonGroup = "normal" | "settings" | "cloth";

export interface SpecialViewToggleButtonProps {
  onClick?: () => void;
}

export function SpecialViewToggleButton(props: SpecialViewToggleButtonProps) {
  return (
    <button
      class="h-8 w-8 flex items-center justify-center function-button"
      onClick={() => {
        props.onClick?.();
      }}
    >
      <VisibilityIcon class="h-5.6 w-5.6" />
    </button>
  );
}

export interface HistoryToggleButtonProps {
  onClick?: () => void;
}

export function HistoryToggleButton(props: HistoryToggleButtonProps) {
  return (
    <button
      class="h-8 w-8 flex items-center justify-center rounded-full b-2 bg-#e9e2d3 text-black/70 b-black/70 hover:b-white active:bg-#cfa56a active:b-#91744a transition-colors line-height-none cursor-pointer"
      onClick={() => {
        props.onClick?.();
      }}
    >
      <HistoryIcon class="h-5.4 w-5.4" />
    </button>
  );
}

export interface FullScreenToggleButtonProps {
  isFullScreen: boolean;
  onClick?: () => void;
}

export function FullScreenToggleButton(props: FullScreenToggleButtonProps) {
  return (
    <button
      class="h-8 w-8 flex items-center justify-center function-button"
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

export interface ExitButtonProps {
  onClick?: () => void;
}

export function ExitButton(props: ExitButtonProps) {
  return (
    <button
      class="h-8 w-8 pr-1 flex items-center justify-center rounded-full b-red-800 b-2 bg-red-500 hover:bg-red-600 active:bg-red-600 text-white transition-colors line-height-none cursor-pointer"
      title="放弃对局"
      onClick={() => {
        props.onClick?.();
      }}
    >
      <ExitIcon class="h-5 w-5" />
    </button>
  );
}

export interface SettingButtonProps {
  onClick?: () => void;
}

export function SettingButton(props: SettingButtonProps) {
  return (
    <button
      class="h-8 w-8 flex items-center justify-center function-button"
      onClick={() => {
        props.onClick?.();
      }}
    >
      <SettingIcon class="h-5.6 w-5.6" />
    </button>
  );
}

export interface BackwardButtonProps {
  onClick?: () => void;
}

export function BackwardButton(props: BackwardButtonProps) {
  return (
    <button
      class="h-8 w-8 flex items-center justify-center function-button"
      onClick={() => {
        props.onClick?.();
      }}
    >
      <BackwardIcon class="h-5 w-5" />
    </button>
  );
}

export const CHESSBOARD_COLORS = [
  "#c0cac3",
  "#537a76",
  "#7f7473",
  "#66588a",
  "#667a4a",
  "#456a90",
  "#783f29",
];

export interface ClothButtonProps {
  onClick?: () => void;
  colorIndex: number;
}

export function ClothButton(props: ClothButtonProps) {
  return (
    <button
      class="h-8 w-8 flex items-center justify-center function-button relative"
      onClick={() => {
        props.onClick?.();
      }}
    >
      <ClothIcon class="h-5.2 w-5.2" />
      <div
        class="absolute h-2 w-2 top-4.2 left-4 rounded-full b-1 b-#e9e2d3 brightness-125"
        style={{ "background-color": CHESSBOARD_COLORS[props.colorIndex] }}
      />
    </button>
  );
}

export interface ColorsButtonProps {
  onClick?: (index: number) => void;
}

export function ColorsButtonGroup(props: ColorsButtonProps) {
  return (
    <For each={CHESSBOARD_COLORS}>
      {(color, index) => (
        <button
          class="h-8 w-8 flex items-center justify-center function-button"
          onClick={() => props.onClick?.(index())}
        >
          <div
            class="h-6 w-6 rounded-full"
            style={{ "background-color": color }}
          />
        </button>
      )}
    </For>
  );
}
