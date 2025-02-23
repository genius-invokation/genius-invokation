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
import { Button } from "./Button";
import type { ChessboardViewType } from "./Chessboard";

export interface SwitchHandsViewProps {
  viewType: ChessboardViewType;
  onConfirm: () => void;
}

export function SwitchHandsView(props: SwitchHandsViewProps) {
  return (
    <Show when={props.viewType === "switchHands"}>
      <div class="absolute pointer-events-none inset-0 flex flex-col items-center">
        <h3 class="absolute mt-30 font-bold text-3xl text-white">替换手牌</h3>
        <div class="flex-grow" />
        <Button class="mb-30 pointer-events-auto" onClick={props.onConfirm}>
          确认
        </Button>
      </div>
    </Show>
  );
}
