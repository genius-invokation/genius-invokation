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

import { createResource, createSignal, For, Match, Show, Switch } from "solid-js";
import { Button } from "./Button";
import { DiceCost } from "./DiceCost";
import { CardFace } from "./Card";
import SelectingIcon from "../svg/SelectingIcon.svg?component-solid";
import type { ActionCardRawData, EntityRawData } from "@gi-tcg/static-data";
import { useUiContext } from "../hooks/context";

export interface SelectCardViewProps {
  candidateIds: number[];
  nameGetter: (id: number) => string | undefined;
  onClickCard: (id: number) => void;
  onConfirm: (id: number) => void;
}

export function SelectCardView(props: SelectCardViewProps) {
  const [selectedId, setSelectedId] = createSignal<number | null>(null);

  return (
    <div class="absolute inset-0 flex flex-col items-center justify-center gap-10 select-none">
      <h3 class="font-bold text-3xl">挑选卡牌</h3>
      <ul class="flex flex-row gap-1">
        <For each={props.candidateIds}>
          {(cardId) => (
            <li class="flex flex-col items-center">
              <div
                class="h-36 w-21 relative"
                onClick={() => {
                  setSelectedId(cardId);
                  props.onClickCard(cardId);
                }}
              >
                <CardFace definitionId={cardId} />
                <Show when={selectedId() === cardId}>
                  <div class="absolute h-full w-full backface-hidden flex items-center justify-center">
                    <SelectingIcon class="w-21 h-21"/>
                  </div>
                </Show>
                <DiceCostSync cardDefinitionId={cardId} />
              </div>
              <div class="mt-2 w-36 text-center font-size-4 text-center color-black/60 font-bold">
                {props.nameGetter(cardId)}
              </div>
            </li>
          )}
        </For>
      </ul>
      <div
        class="invisible pointer-events-none data-[shown]:visible data-[shown]:pointer-events-auto"
        bool:data-shown={selectedId() !== null}
      >
        <Button
          onClick={() => {
            const id = selectedId();
            if (id !== null) {
              props.onConfirm(id);
            }
          }}
        >
          确定
        </Button>
      </div>
    </div>
  );
}

const DiceCostSync = (props: { cardDefinitionId: number }) => {
  const { assetsManager } = useUiContext();
  const [data] = createResource(
    () => props.cardDefinitionId,
    (id) => assetsManager.getData(id),
  );
  const COST_MAP: Record<string, number> = {
    GCG_COST_DICE_VOID: 0,
    GCG_COST_DICE_CRYO: 1,
    GCG_COST_DICE_HYDRO: 2,
    GCG_COST_DICE_PYRO: 3,
    GCG_COST_DICE_ELECTRO: 4,
    GCG_COST_DICE_ANEMO: 5,
    GCG_COST_DICE_GEO: 6,
    GCG_COST_DICE_DENDRO: 7,
    GCG_COST_DICE_SAME: 8,
    GCG_COST_ENERGY: 9,
    GCG_COST_LEGEND: 10
  }; 
  const renderCost = (data: ActionCardRawData | EntityRawData) => {
    if ("playCost" in data && !!data.playCost.length) {
      return data.playCost.map(
        (cost) => (
          {
            type: COST_MAP[cost.type], 
            count: cost.count,
          }
        )
      );
    } else {
      return [{type: 8, count: 0}];
    }
  };
  return (
    <Switch>
      <Match when={data.loading || data.error}>
        <></>
      </Match>
      <Match when={data()}>
        {(data) => (
          <DiceCost
            class="absolute left-1.8 top--1 translate-x--50% backface-hidden flex flex-col gap-1"
            cost={renderCost(data() as ActionCardRawData | EntityRawData)}
            size={36}
          />
        )}
      </Match>
    </Switch>
  );
};