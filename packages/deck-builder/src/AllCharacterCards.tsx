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

import { For, Show, createEffect, createSignal } from "solid-js";
import {
  T as tagMap,
  c as characters,
} from "./data.json" /*  with { type: "json" } */;
import { useDeckBuilderContext } from "./DeckBuilder";
import { Card } from "./Card";
import type { AllCardsProps } from "./AllCards";

const CHARACTER_ELEMENT_TYPES = {
  1: tagMap.indexOf("GCG_TAG_ELEMENT_CRYO"),
  2: tagMap.indexOf("GCG_TAG_ELEMENT_HYDRO"),
  3: tagMap.indexOf("GCG_TAG_ELEMENT_PYRO"),
  4: tagMap.indexOf("GCG_TAG_ELEMENT_ELECTRO"),
  5: tagMap.indexOf("GCG_TAG_ELEMENT_ANEMO"),
  6: tagMap.indexOf("GCG_TAG_ELEMENT_GEO"),
  7: tagMap.indexOf("GCG_TAG_ELEMENT_DENDRO"),
};

const CHARACTER_ELEMENT_NAME = {
  1: "冰",
  2: "水",
  3: "火",
  4: "雷",
  5: "风",
  6: "岩",
  7: "草",
} as Record<number, string>;

export const CHARACTER_CARDS = Object.fromEntries(
  characters.map((ch) => [ch.i, ch] as const),
);

export function AllCharacterCards(props: AllCardsProps) {
  const { assetApiEndpoint } = useDeckBuilderContext();
  const [chTag, setChTag] = createSignal<number | null>(0);
  const filtered = () => {
    const tag = chTag();
    if (tag === null) {
      return characters;
    }
    return characters.filter((ch) => ch.t.includes(tag));
  };

  const toggleChTag = (tagIdx: number) => {
    if (chTag() === tagIdx) {
      setChTag(null);
    } else {
      setChTag(tagIdx);
    }
  };

  const selected = (id: number) => {
    return props.deck.characters.includes(id);
  };
  const fullCharacters = () => {
    return props.deck.characters.length >= 3;
  };

  const toggleCharacter = (id: number) => {
    if (selected(id)) {
      props.onChangeDeck?.({
        ...props.deck,
        characters: props.deck.characters.filter((ch) => ch !== id),
      });
    } else if (!fullCharacters()) {
      const newChs = [...props.deck.characters, id];
      props.onChangeDeck?.({
        ...props.deck,
        characters: newChs,
      });
      // Automatically switch to action card tab
      if (newChs.length === 3) {
        setTimeout(() => props.onSwitchTab?.(1), 100);
      }
    }
  };
  return (
    <div class="h-full flex flex-col">
      <div class="flex flex-row gap-1 mb-2">
        <For each={Object.entries(CHARACTER_ELEMENT_TYPES)}>
          {([imgIdx, tagIdx]) => (
            <button
              onClick={() => toggleChTag(tagIdx)}
              data-selected={chTag() === tagIdx}
              class="data-[selected=true]:bg-black w-5 h-5"
            >
              <img
                src={`${assetApiEndpoint()}/images/${imgIdx}?thumb=1`}
                alt={CHARACTER_ELEMENT_NAME[Number(imgIdx)]}
              />
            </button>
          )}
        </For>
      </div>
      <ul class="flex-grow overflow-auto flex flex-row flex-wrap gap-2">
        <For each={filtered()}>
          {(ch) => (
            <li
              class="relative cursor-pointer data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60 data-[disabled=true]:filter-none hover:brightness-110 transition-all"
              data-disabled={fullCharacters() && !selected(ch.i)}
              onClick={() => toggleCharacter(ch.i)}
            >
              <div class="w-[60px]">
                <Card id={ch.i} name={ch.n} selected={selected(ch.i)} />
                <Show when={selected(ch.i)}>
                  <div class="absolute left-1/2 top-1/2 translate-x--1/2 translate-y--1/2 text-2xl z-1 pointer-events-none">
                    &#9989;
                  </div>
                </Show>
              </div>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}
