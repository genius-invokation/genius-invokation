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

import { createEffect, createSignal, Index, Show } from "solid-js";
import { AllCharacterCards } from "./AllCharacterCards";
import { AllActionCards } from "./AllActionCards";
import { v as ALL_VERSIONS } from "./data.json" /* with { type: "json" } */;
import type { Deck } from "@gi-tcg/utils";

export interface AllCardsProps {
  deck: Deck;
  version?: string;
  onChangeDeck?: (deck: Deck) => void;
  onSwitchTab?: (tab: number) => void;
}

export interface AllCardsIncludeVersionProps
  extends Omit<AllCardsProps, "version"> {
  version: number;
}

export function AllCards(props: AllCardsProps) {
  const [tab, setTab] = createSignal(0);
  const [version, setVersion] = createSignal(ALL_VERSIONS.length - 1);
  const versionSpecified = () =>
    props.version && ALL_VERSIONS.includes(props.version);
  createEffect(() => {
    if (versionSpecified()) {
      setVersion(ALL_VERSIONS.indexOf(props.version!));
    }
  });

  return (
    <div class="min-w-0 flex-grow h-full flex flex-col min-h-0">
      <div class="flex flex-row gap-2 mb-2">
        <button
          class="data-[active=true]:font-bold"
          onClick={() => setTab(0)}
          data-active={tab() === 0}
        >
          角色牌
        </button>
        <button
          class="data-[active=true]:font-bold"
          onClick={() => setTab(1)}
          data-active={tab() === 1}
        >
          行动牌
        </button>
        <Show
          when={!versionSpecified()}
          fallback={
            <span class="text-gray-500">
              当前仅显示 {props.version} 及更低版本
            </span>
          }
        >
          <select
            class="flex-grow border-black border-1px"
            value={version()}
            onChange={(e) => setVersion(Number(e.target.value))}
          >
            <Index each={ALL_VERSIONS}>
              {(versionStr, index) => (
                <option value={index}>{versionStr()}</option>
              )}
            </Index>
          </select>
        </Show>
      </div>
      <div class="min-h-0">
        <div
          data-visible={tab() === 0}
          class="h-full hidden data-[visible=true]:block"
        >
          <AllCharacterCards
            {...{ ...props, version: version() }}
            onSwitchTab={(tabNo) => setTab(tabNo)}
          />
        </div>
        <div
          data-visible={tab() === 1}
          class="h-full hidden data-[visible=true]:block"
        >
          <AllActionCards
            {...{ ...props, version: version() }}
            onSwitchTab={(tabNo) => setTab(tabNo)}
          />
        </div>
      </div>
    </div>
  );
}
