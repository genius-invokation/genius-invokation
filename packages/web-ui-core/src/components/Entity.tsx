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

import { createMemo, Show } from "solid-js";
import { cssPropertyOfTransform } from "../ui_state";
import type { EntityInfo } from "./Chessboard";
import { Image } from "./Image";
import { SelectingIcon } from "./SelectingIcon";
import { VariableDiff } from "./VariableDiff";
import { ActionStepEntityUi } from "../action";
import { WithDelicateUi } from "../primitives/delicate_ui";

export interface EntityProps extends EntityInfo {
  selecting: boolean;
  onClick?: (e: MouseEvent, currentTarget: HTMLElement) => void;
}

export function Entity(props: EntityProps) {
  const data = createMemo(() => props.data);
  return (
    <div
      class="absolute left-0 top-0 h-18 w-15 transition-all rounded-lg data-[clickable]:cursor-pointer data-[clickable]:shadow-[0_0_5px_5px] shadow-yellow-200"
      style={cssPropertyOfTransform(props.uiState.transform)}
      bool:data-entering={props.animation === "entering"}
      bool:data-disposing={props.animation === "disposing"}
      bool:data-triggered={props.triggered}
      bool:data-clickable={
        props.clickStep && props.clickStep.ui >= ActionStepEntityUi.Outlined
      }
      onClick={(e) => {
        e.stopPropagation();
        props.onClick?.(e, e.currentTarget);
      }}
    >
      <WithDelicateUi
        assetId="UI_TeyvatCard_CardFrame_Summon"
        fallback={
          <Image
            class="absolute inset-0 h-full w-full rounded-lg b-white b-2"
            imageId={data().definitionId}
          />
        }
      >
        {(frame) => (
          <>
            <Image
              class="absolute inset-0 h-full w-full p-1px rounded-lg"
              imageId={data().definitionId}
            />
            <div class="absolute inset-0 h-full w-full children-h-full children-w-full">
              {frame}
            </div>
          </>
        )}
      </WithDelicateUi>
      <Show when={data().hasUsagePerRound}>
        <div class="absolute inset-2px animate-[entity-highlight_2s] animate-ease-in-out animate-alternate animate-count-infinite" />
      </Show>
      <Show when={props.preview && props.preview.newVariableValue !== null}>
        <VariableDiff
          class="absolute z-5 top-1 left-50% translate-x--50%"
          oldValue={data().variableValue!}
          newValue={props.preview!.newVariableValue!}
        />
      </Show>
      <Show when={props.selecting}>
        <div class="absolute h-full w-full backface-hidden flex items-center justify-center">
          <SelectingIcon />
        </div>
      </Show>
      <Show when={typeof data().variableValue === "number"}>
        <WithDelicateUi
          assetId={
            data().variableName === "usage"
              ? "UI_Gcg_DiceL_Round"
              : "UI_Gcg_DiceL_Count"
          }
          fallback={
            <div class="w-6 h-6 absolute top--2 right--2 rounded-full bg-white b-1 b-black flex items-center justify-center line-height-none">
              {data().variableValue}
            </div>
          }
        >
          {(image) => (
            <div class="w-8 h-8 absolute top--3 right--3">
              {image}
              <div class="absolute inset-0 flex items-center justify-center text-white font-bold text-stroke-0.5 text-stroke-black">
                {data().variableValue}
              </div>
            </div>
          )}
        </WithDelicateUi>
      </Show>
      <Show when={typeof data().hintIcon === "number"}>
        <div class="absolute h-5 min-w-0 left-0 bottom-0 bg-white bg-opacity-70 flex items-center">
          <Image imageId={data().hintIcon!} class="h-4 w-4" />
          {data().hintText}
        </div>
      </Show>
    </div>
  );
}
