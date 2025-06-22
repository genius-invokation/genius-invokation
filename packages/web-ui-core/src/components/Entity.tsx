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

import { createEffect, createMemo, createResource, Match, Show, Switch, type Component, type ComponentProps } from "solid-js";
import { cssPropertyOfTransform } from "../ui_state";
import type { EntityInfo } from "./Chessboard";
import { Image } from "./Image";
import { VariableDiff } from "./VariableDiff";
import { ActionStepEntityUi } from "../action";
import { StrokedText } from "./StrokedText";
import SelectingIcon from "../svg/SelectingIcon.svg?component-solid";
import CardFrameSummon from "../svg/CardFrameSummon.svg?component-solid";
import ClockIcon from "../svg/ClockIcon.svg?component-solid";
import HourglassIcon from "../svg/HourglassIcon.svg?component-solid";
import BarrierIcon from "../svg/BarrierIcon.svg?component-solid";
import { useUiContext } from "../hooks/context";
import type { EntityRawData } from "@gi-tcg/static-data";
import { Dynamic } from "solid-js/web";

export interface EntityProps extends EntityInfo {
  selecting: boolean;
  onClick?: (e: MouseEvent, currentTarget: HTMLElement) => void;
}

const EntityTopHint = (props: { cardDefinitionId: number , value: number}) => {
  const { assetsManager } = useUiContext();
  const [data] = createResource(
    () => props.cardDefinitionId,
    (id) => assetsManager.getData(id),
  );
  const ICON_MAP : Record<string, Component> = {
    GCG_TOKEN_ICON_CLOCK: ClockIcon,
    GCG_TOKEN_ICON_HOURGLASS: HourglassIcon,
    GCG_TOKEN_ICON_BARRIER_SHIELD: BarrierIcon,
  };
  return (
    <Switch>
      <Match when={data.loading || data.error}>
        <div class="w-6 h-6 absolute top--2 right--2.5 rounded-full bg-white b-1 b-black flex items-center justify-center line-height-none">
          {props.value}
        </div>
      </Match>
      <Match when={data()}>
        {(data) => (
          <div class="w-7 h-7 absolute top--2.2 right--3">
            <Dynamic<Component<ComponentProps<"div">>>
              component={ICON_MAP[(data() as EntityRawData).shownIcon as string]}
              class= "w-7 h-7 absolute"
            />                  
            <StrokedText
              class="absolute inset-0 line-height-7 text-center text-white font-bold"
              strokeWidth={2}
              strokeColor="#000000aa"
              text={String(props.value)}
            />
          </div>
        )}
      </Match>
    </Switch>      
  );
};


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
      <Image
        class="absolute inset-0 h-full w-full p-2px rounded-lg"
        imageId={data().definitionId}
      />
      <CardFrameSummon class="absolute inset-0 h-full w-full pointer-events-none" />
      <Show when={data().hasUsagePerRound}>
        <div class="absolute inset-2px animate-[entity-highlight_2s] animate-ease-in-out animate-alternate animate-count-infinite" />
      </Show>
      <Show when={props.preview && props.preview.newVariableValue !== null}>
        <VariableDiff
          class="absolute z-5 top-1 left-50% translate-x--50%"
          oldValue={data().variableValue!}
          newValue={props.preview!.newVariableValue!}
          direction={props.preview!.newVariableDirection}
        />
      </Show>
      <Show when={props.selecting}>
        <div class="absolute h-full w-full backface-hidden flex items-center justify-center overflow-visible scale-120%">
          <SelectingIcon class="w-15 h-15" />
        </div>
      </Show>
      <Show when={typeof data().variableValue === "number"}>
        <EntityTopHint cardDefinitionId={data().definitionId} value={data().variableValue as number}/>
      </Show>
      <Show when={typeof data().hintIcon === "number"}>
        <div class="absolute h-7 w-7 min-w-0 left-0 bottom-0.5">
          <Image
            imageId={data().hintIcon!}
            zero="physic"
            type="icon"
            class="h-7 w-7 absolute"
          />
          <StrokedText
              class="absolute inset-0 line-height-7 text-center text-white font-bold text-4.5 whitespace-nowrap"
              strokeWidth={2}
              strokeColor="#000000cc"
              text={data().hintText?.replace(
                /\$\{([^}]+)\}/g,
                (_, g1) => data().descriptionDictionary[g1] ?? "",
              ) ?? ""}
            />
        </div>
      </Show>
    </div>
  );
}
