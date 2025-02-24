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

import { type PbPlayerState, PbEntityArea } from "@gi-tcg/typings";
import { For, Index, Match, Show, Switch } from "solid-js";

import { Summon, Support, Status } from "./Entity";
import { CharacterArea } from "./CharacterArea";
import { Card } from "./Card";
import { useEventContext } from "./Chessboard";
import { Key } from "@solid-primitives/keyed";

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
      .map(({mutation}) =>
        mutation?.$case === "createEntity" &&
        mutation.value.who === props.who &&
        mutation.value.where === PbEntityArea.SUMMON
          ? mutation.value.entity
          : null,
      )
      .filter((v) => !!v);
  const newSupports = () =>
    previewData()
      .map(({mutation}) =>
        mutation?.$case === "createEntity" &&
        mutation.value.who === props.who &&
        mutation.value.where === PbEntityArea.SUPPORT
          ? mutation.value.entity
          : null,
      )
      .filter((v) => !!v);

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
            <Key each={props.data.support} by="id">
              {(support) => <Support data={support()} />}
            </Key>
            <Key each={newSupports()} by="id">
              {(support) => <Support preview data={support()} />}
            </Key>
          </div>
          <div class="flex flex-row gap-6 items-end">
            <Key each={props.data.character} by="id">
              {(ch) => (
                <div class="flex flex-col">
                  <CharacterArea data={ch()} />
                  <Switch>
                    <Match when={ch().id === props.data.activeCharacterId}>
                      <div class="h-6 flex flex-row">
                        <Key each={props.data.combatStatus} by="id">
                          {(st) => <Status data={st()} />}
                        </Key>
                      </div>
                    </Match>
                    <Match when={props.opp}>
                      <div class="h-12" />
                    </Match>
                  </Switch>
                </div>
              )}
            </Key>
          </div>
          <div class="min-w-40 grid grid-cols-2 grid-rows-2 gap-2 justify-items-center items-center">
            <Key each={props.data.summon} by="id">
              {(summon) => <Summon data={summon()} />}
            </Key>
            <Key each={newSummons()} by="id">
              {(summon) => <Summon preview data={summon()} />}
            </Key>
          </div>
        </div>
        <div
          class={`relative h-30 flex justify-between mx-4 ${
            props.opp ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <div class="hands-area flex flex-row">
            <Key each={props.data.handCard} by="id">
              {(card) => <Card data={card()} />}
            </Key>
          </div>
          <div class="text-blue-500">
            <Show when={props.opp}>
              <p>{statusText("对方")}</p>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
}
