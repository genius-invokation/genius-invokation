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

import { JSX } from "solid-js";
import {
  ELEMENTAL_TUNING_OFFSET,
  useEventContext,
  usePlayerContext,
} from "./Chessboard";
import { CardDescription } from "./CardDescription";

export interface InteractiveProps {
  id: number;
  class?: string;
  definitionId: number;
  dataHighlight?: boolean;
  children: JSX.Element;
}

export function Interactive(props: InteractiveProps) {
  const { allClickable, allSelected, onClick, setPrepareTuning } =
    usePlayerContext();
  const { focusing } = useEventContext();
  const selected = () => allSelected.includes(props.id);
  const clickable = () => allClickable.includes(props.id);
  const focused = () => focusing() === props.id;
  const draggable = () =>
    allClickable.includes(props.id + ELEMENTAL_TUNING_OFFSET);
  const dragStart = (e: DragEvent) => {
    e.dataTransfer!.setData("text/plain", props.id.toString());
    setPrepareTuning(true);
  };
  const dragEnd = () => {
    setPrepareTuning(false);
  };

  return (
    <div
      class={`relative group ${props.class}`}
      data-highlight={props.dataHighlight}
      classList={{
        selected: selected(),
        clickable: clickable(),
        focused: focused(),
      }}
      onClick={(e) => {
        if (clickable()) {
          e.stopPropagation(); 
          onClick(props.id);
        }
      }}
      draggable={draggable()}
      onDragStart={dragStart}
      onDragEnd={dragEnd}
    >
      {props.children}
      <div class="absolute top-0 left-0 translate-y-[-100%] invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all pb-2 z-30">
        <CardDescription
          definitionId={props.definitionId}
          entityId={props.id}
        />
      </div>
    </div>
  );
}
