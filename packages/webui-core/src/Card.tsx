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

import type { PbCardState, DiceType } from "@gi-tcg/typings";

import { Image } from "./Image";
import { DiceCost } from "./DiceCost";
import { usePlayerContext } from "./Chessboard";
import { Show } from "solid-js";
import { Interactive } from "./Interactive";

export interface CardProps {
  data: PbCardState;
}

export function Card(props: CardProps) {
  const { allCosts } = usePlayerContext();
  const realCost = () => allCosts[props.data.id];
  return (
    <div class="card-wrapper z-10">
      <Show
        when={props.data.definitionId > 0}
        fallback={
          <div class="h-full aspect-[7/12] rotated flex items-center justify-center bg-gray-600 b-gray-700 b-solid b-4 color-white rounded" />
        }
      >
        <Interactive
          class="card relative rotated rounded-lg"
          id={props.data.id}
          definitionId={props.data.definitionId}
        >
          <Image
            imageId={props.data.definitionId}
            class="h-full rounded-lg shadow-lg"
            title={`id = ${props.data.id}`}
          />
          <DiceCost
            class="absolute left-0 top-0 translate-x-[-50%] flex flex-col"
            cost={props.data.definitionCost}
            realCost={realCost()}
          />
        </Interactive>
      </Show>
    </div>
  );
}
