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

import { For, Match, Switch } from "solid-js";
import { CardFace } from "./Card";
import { DiceType } from "@gi-tcg/typings";
import { DiceCostAsync } from "./SelectCardView";
import { Dice } from "./Dice";

export interface MiniViewProps {
  viewType: "switching" | "selecting" | "rerolling";
  ids: number[] | DiceType[];
  nameGetter: (id: number) => string | undefined;
  opp: boolean;
}

export function MiniView(props: MiniViewProps) {
  const whoText = () => (props.opp ? "对方" : "我方");
  return (
    <div
      class="absolute w-91.5 h-43 right--66.5 flex flex-col items-center justify-center gap-4 select-none mini-view bg-green-50 b-5 b-#443322 rounded-4"
      data-opp={props.opp}
    >
      <Switch>
        <Match when={props.viewType === "switching"}>
          <h3 class="font-bold text-4">{`${whoText()}正在替换手牌`}</h3>
          <ul class="flex flex-row w-80 justify-evenly">
            <For each={props.ids}>
              {(cardId) => (
                <div class="relative h-24 w-4.5">
                  <li class="flex flex-col items-center absolute top-0 left--3">
                    <div class="h-18 w-10.5 relative">
                      <CardFace definitionId={cardId} />
                      <DiceCostAsync
                        cardDefinitionId={cardId}
                        size={18}
                        class="top-0 left-0.8"
                      />
                    </div>
                  </li>
                </div>
              )}
            </For>
          </ul>
        </Match>
        <Match when={props.viewType === "selecting"}>
          <h3 class="font-bold text-4">{`${whoText()}正在挑选卡牌`}</h3>
          <ul class="flex flex-row w-80 justify-evenly">
            <For each={props.ids}>
              {(cardId) => (
                <div class="relative h-24 w-4.5">
                  <li class="flex flex-col items-center absolute top-0 left--3">
                    <div class="h-18 w-10.5 relative">
                      <CardFace definitionId={cardId} />
                      <DiceCostAsync
                        cardDefinitionId={cardId}
                        size={18}
                        class="top-0 left-0.8"
                      />
                    </div>
                    <div class="mt-1 w-10.5 text-2 text-center color-black/60 font-bold whitespace-nowrap">
                      {props.nameGetter(cardId)}
                    </div>
                  </li>
                </div>
              )}
            </For>
          </ul>
        </Match>
        <Match when={props.viewType === "rerolling"}>
          <h3 class="font-bold text-4">{`${whoText()}正在重投骰子`}</h3>
          <ul class="grid grid-rows-2 grid-flow-col gap-2">
            <For each={props.ids}>
              {(dice) => (
                <li>
                  <div class="relative">
                    <Dice type={dice} size={42} />
                  </div>
                </li>
              )}
            </For>
          </ul>
        </Match>
      </Switch>
    </div>
  );
}
