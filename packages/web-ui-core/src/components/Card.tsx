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

import { getData } from "@gi-tcg/assets-manager";
import type { PbCardState, DiceType } from "@gi-tcg/typings";
import { createResource } from "solid-js";
import { Image } from "./Image";
import { DiceCost } from "./DiceCost";

export interface CardProps {
  data: PbCardState;
  x: number;
  y: number;
  z: number;
  zIndex: number;
  ry: number;
  rz: number;
  shadow: boolean;
  transition: boolean;
  onClick?: (e: MouseEvent) => void;
  onPointerEnter?: (e: PointerEvent) => void;
  onPointerLeave?: (e: PointerEvent) => void;
  onPointerUp?: (e: PointerEvent) => void;
  onPointerMove?: (e: PointerEvent) => void;
  onPointerDown?: (e: PointerEvent) => void;
}

export function Card(props: CardProps) {
  const [data] = createResource(
    () => props.data.definitionId,
    (id) => getData(id),
  );
  return (
    <div
      class="absolute top-0 left-0 h-36 w-21 preserve-3d transition-ease-in-out touch-none"
      style={{
        "z-index": `${props.zIndex}`,
        transform: `translate3d(${props.x / 4}rem, ${props.y / 4}rem, ${
          props.z / 4
        }rem) rotateY(${props.ry}deg) rotateZ(${props.rz}deg)`,
      }}
      classList={{
        "shadow-lg": props.shadow,
        "transition-transform": props.transition,
      }}
      onClick={(e) => {
        e.stopPropagation();
        props.onClick?.(e);
      }}
      onPointerEnter={(e) => {
        e.stopPropagation();
        props.onPointerEnter?.(e);
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        props.onPointerLeave?.(e);
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        props.onPointerUp?.(e);
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        props.onPointerMove?.(e);
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        props.onPointerDown?.(e);
      }}
    >
      <Image
        imageId={props.data.definitionId}
        class="absolute h-full w-full rounded-xl backface-hidden b-white b-solid b-3"
        title={`id = ${props.data.id}`}
      />
      <DiceCost
        class="absolute left-0 top-0 translate-x--50% flex flex-col backface-hidden pointer-events-none"
        cost={props.data.definitionCost}
        // realCost={allCosts[props.data.id]}
      />
      <div class="absolute h-full w-full rotate-y-180 translate-z-1px bg-gray-600 b-gray-700 b-solid b-4 color-white rounded backface-hidden" />
    </div>
  );
}
