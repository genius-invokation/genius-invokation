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

import { createSignal } from "solid-js";
import { AllCharacterCards } from "./AllCharacterCards";
import { AllActionCards } from "./AllActionCards";
import type { Deck } from "@gi-tcg/utils";

export interface AllCardsProps {
  deck: Deck;
  onChangeDeck?: (deck: Deck) => void;
  onSwitchTab?: (tab: number) => void;
}

export function AllCards(props: AllCardsProps) {
  const [tab, setTab] = createSignal(0);
  return (
    <div class="min-w-0 flex-grow h-full flex flex-col min-h-0">
      <ul class="flex flex-row gap-2 mb-2">
        <li>
          <button
            class="data-[active=true]:font-bold"
            onClick={() => setTab(0)}
            data-active={tab() === 0}
          >
            角色牌
          </button>
        </li>
        <li>
          <button
            class="data-[active=true]:font-bold"
            onClick={() => setTab(1)}
            data-active={tab() === 1}
          >
            行动牌
          </button>
        </li>
      </ul>
      <div class="min-h-0">
        <div
          data-visible={tab() === 0}
          class="h-full hidden data-[visible=true]:block"
        >
          <AllCharacterCards
            {...props}
            onSwitchTab={(tabNo) => setTab(tabNo)}
          />
        </div>
        <div
          data-visible={tab() === 1}
          class="h-full hidden data-[visible=true]:block"
        >
          <AllActionCards {...props} onSwitchTab={(tabNo) => setTab(tabNo)} />
        </div>
      </div>
    </div>
  );
}
