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

import {
  type JSX,
  createContext,
  splitProps,
  useContext,
  untrack,
} from "solid-js";
import { AllCards } from "./AllCards";
import { CurrentDeck } from "./CurrentDeck";
import type { Deck } from "@gi-tcg/utils";

export interface DeckBuilderProps extends JSX.HTMLAttributes<HTMLDivElement> {
  assetsApiEndpoint?: string;
  deck?: Deck;
  version?: string;
  onChangeDeck?: (deck: Deck) => void;
}

interface DeckBuilderContextValue {
  assetsApiEndpoint?: string;
}

const DeckBuilderContext = createContext<DeckBuilderContextValue>();

export const useDeckBuilderContext = () => useContext(DeckBuilderContext)!;

const EMPTY_DECK: Deck = {
  characters: [],
  cards: [],
};

export function DeckBuilder(props: DeckBuilderProps) {
  const [local, rest] = splitProps(props, ["assetsApiEndpoint", "class"]);
  return (
    <DeckBuilderContext.Provider
      value={{
        assetsApiEndpoint: untrack(() => local.assetsApiEndpoint),
      }}
    >
      <div class={`gi-tcg-deck-builder ${local.class}`}>
        <div
          class="w-full h-full flex flex-row items-stretch gap-3 select-none"
          {...rest}
        >
          <AllCards
            version={props.version}
            deck={props.deck ?? EMPTY_DECK}
            onChangeDeck={props.onChangeDeck}
          />
          <div class="b-r-1 b-gray" />
          <div />
          <CurrentDeck
            version={props.version}
            deck={props.deck ?? EMPTY_DECK}
            onChangeDeck={props.onChangeDeck}
          />
        </div>
      </div>
    </DeckBuilderContext.Provider>
  );
}
