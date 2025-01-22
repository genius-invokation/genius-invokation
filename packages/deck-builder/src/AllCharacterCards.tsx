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

import { For, Show, createSignal } from "solid-js";
import {
  T as tagMap,
  c as characters,
} from "./data.json" /*  with { type: "json" } */;
import { Card } from "./Card";
import type { AllCardsProps } from "./AllCards";
import { DiceIcon } from "./DiceIcon";
import { Key } from "@solid-primitives/keyed";

const CHARACTER_ELEMENT_TYPES = {
  1: tagMap.indexOf("GCG_TAG_ELEMENT_CRYO"),
  2: tagMap.indexOf("GCG_TAG_ELEMENT_HYDRO"),
  3: tagMap.indexOf("GCG_TAG_ELEMENT_PYRO"),
  4: tagMap.indexOf("GCG_TAG_ELEMENT_ELECTRO"),
  5: tagMap.indexOf("GCG_TAG_ELEMENT_ANEMO"),
  6: tagMap.indexOf("GCG_TAG_ELEMENT_GEO"),
  7: tagMap.indexOf("GCG_TAG_ELEMENT_DENDRO"),
};

export const CHARACTER_CARDS = Object.fromEntries(
  characters.map((ch) => [ch.i, ch] as const),
);
type Character = (typeof characters)[0];

export function AllCharacterCards(props: AllCardsProps) {
  const [chTag, setChTag] = createSignal<number | null>(0);
  const shown = (ch: Character) => {
    const tag = chTag();
    return ch.v <= props.version && (tag === null || ch.t.includes(tag));
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
              <DiceIcon id={Number(imgIdx)} />
            </button>
          )}
        </For>
      </div>
      <ul class="flex-grow overflow-auto flex flex-row flex-wrap gap-2">
        <Key each={characters} by="i">
          {(ch) => (
            <li
              class="hidden data-[shown=true]-block relative cursor-pointer data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60 data-[disabled=true]:filter-none hover:brightness-110 transition-all"
              data-shown={shown(ch())}
              data-disabled={fullCharacters() && !selected(ch().i)}
              onClick={() => toggleCharacter(ch().i)}
            >
              <div class="w-[60px]">
                <Card
                  id={ch().i}
                  type="character"
                  name={ch().n}
                  selected={selected(ch().i)}
                />
                <Show when={selected(ch().i)}>
                  <div class="absolute left-1/2 top-1/2 translate-x--1/2 translate-y--1/2 text-2xl z-1 pointer-events-none">
                    &#9989;
                  </div>
                </Show>
              </div>
            </li>
          )}
        </Key>
      </ul>
    </div>
  );
}
