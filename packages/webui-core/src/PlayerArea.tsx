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

import type {
  PbCreateEntityArea,
  CreateEntityEM,
  PbPlayerState,
  PbEntityState,
} from "@gi-tcg/typings";
import { For, Match, Show, Switch } from "solid-js";

import { Summon, Support, Status } from "./Entity";
import { CharacterArea } from "./CharacterArea";
import { Card } from "./Card";
import { useEventContext } from "./Chessboard";

export interface PlayerAreaProps {
  data: PbPlayerState;
  who: 0 | 1;
  opp: boolean;
  playerStatus?: number;
}

export function PlayerArea(props: PlayerAreaProps) {
  const { previewData } = useEventContext();
  const newSummons = () =>
    previewData()
      .filter(
        (p) =>
          p.createEntity?.who === props.who &&
          p.createEntity?.where === 3 /* SUMMON */,
      )
      .map(
        (p): PbEntityState => ({
          id: p.createEntity!.entityId,
          definitionId: p.createEntity!.entityDefinitionId,
          descriptionDictionary: {},
          hasUsagePerRound: false,
        }),
      );
  const newSupports = () =>
    previewData()
      .filter(
        (p) =>
          p.createEntity?.who === props.who &&
          p.createEntity?.where === 4 /* SUPPORT */,
      )
      .map(
        (p): PbEntityState => ({
          id: p.createEntity!.entityId,
          definitionId: p.createEntity!.entityDefinitionId,
          descriptionDictionary: {},
          hasUsagePerRound: false,
        }),
      );

  const statusText = (who: string) => {
    if (props.data.declaredEnd) {
      return `${who}已宣布结束`;
    }
    return props.playerStatus ? `${who}正在行动中` : "";
  };
  return (
    <div class="w-full flex flex-row">
      <div class="bg-yellow-800 text-white flex flex-col justify-center items-center w-10 flex-shrink-0 gap-2">
        <div class="text-center">
          牌堆 <br />
          {props.data.pileCard.length}
        </div>
        <div
          class="h-3 w-3 rotate-45 bg-gradient-to-r from-purple-500 to-blue-500"
          classList={{
            "bg-gradient-to-r": !props.data.legendUsed,
            "bg-gray-300": props.data.legendUsed,
          }}
        />
      </div>
      <div
        class={`flex-grow flex gap-6 ${
          props.opp ? "flex-col-reverse" : "flex-col"
        }`}
      >
        <div class="h-52 flex flex-row justify-center gap-6">
          <div class="min-w-40 grid grid-cols-2 grid-rows-2 gap-2 justify-items-center items-center">
            <For each={props.data.support}>
              {(support) => <Support data={support} />}
            </For>
            <For each={newSupports()}>
              {(support) => <Support preview data={support} />}
            </For>
          </div>
          <div class="flex flex-row gap-6 items-end">
            <For each={props.data.character}>
              {(ch) => (
                <div class="flex flex-col">
                  <CharacterArea data={ch} />
                  <Switch>
                    <Match when={ch.id === props.data.activeCharacterId}>
                      <div class="h-6 flex flex-row">
                        <For each={props.data.combatStatus}>
                          {(st) => <Status data={st} />}
                        </For>
                      </div>
                    </Match>
                    <Match when={props.opp}>
                      <div class="h-12" />
                    </Match>
                  </Switch>
                </div>
              )}
            </For>
          </div>
          <div class="min-w-40 grid grid-cols-2 grid-rows-2 gap-2 justify-items-center items-center">
            <For each={props.data.summon}>
              {(summon) => <Summon data={summon} />}
            </For>
            <For each={newSummons()}>
              {(summon) => <Summon preview data={summon} />}
            </For>
          </div>
        </div>
        <div
          class={`relative h-30 flex justify-between mx-4 ${
            props.opp ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <div class="hands-area flex flex-row">
            <For each={props.data.handCard}>
              {(card) => <Card data={card} />}
            </For>
          </div>
          <div class="text-blue-500">
            <Show when={props.opp}>
              <p>{statusText('对方')}</p>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
}
