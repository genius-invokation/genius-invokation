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
import { Card } from "./Card";
import type { AllCardsProps } from "./AllCards";
import { DiceIcon } from "./DiceIcon";
import { Key } from "@solid-primitives/keyed";
import type { DeckDataCharacterInfo } from "@gi-tcg/assets-manager";

const CHARACTER_ELEMENT_TYPES = {
  1: "GCG_TAG_ELEMENT_CRYO",
  2: "GCG_TAG_ELEMENT_HYDRO",
  3: "GCG_TAG_ELEMENT_PYRO",
  4: "GCG_TAG_ELEMENT_ELECTRO",
  5: "GCG_TAG_ELEMENT_ANEMO",
  6: "GCG_TAG_ELEMENT_GEO",
  7: "GCG_TAG_ELEMENT_DENDRO",
} as Record<number, string>;

export function AllCharacterCards(props: AllCardsProps) {
  const [chTag, setChTag] = createSignal<number | null>(null);
  const shown = (ch: DeckDataCharacterInfo) => {
    const tag = chTag();
    return (
      ch.version <= props.version &&
      (tag === null || ch.tags.includes(CHARACTER_ELEMENT_TYPES[tag]))
    );
  };

  const toggleChTag = (tag: number) => {
    if (chTag() === tag) {
      setChTag(null);
    } else {
      setChTag(tag);
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
              onClick={() => toggleChTag(Number(imgIdx))}
              data-selected={chTag() === Number(imgIdx)}
              class="data-[selected=true]:bg-black w-10 h-10"
            >
              <DiceIcon id={Number(imgIdx)} />
            </button>
          )}
        </For>
      </div>
      <ul class="flex-grow overflow-auto flex flex-row flex-wrap gap-2">
        <Key each={props.characters.values().toArray()} by="id">
          {(ch) => (
            <li
              class="hidden data-[shown=true]-block relative cursor-pointer data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60 data-[disabled=true]:filter-none hover:brightness-110 transition-all"
              data-shown={shown(ch())}
              data-disabled={fullCharacters() && !selected(ch().id)}
              onClick={() => toggleCharacter(ch().id)}
            >
              <div class="w-[60px]">
                <Card
                  id={ch().id}
                  type="character"
                  name={ch().name}
                  selected={selected(ch().id)}
                />
                <Show when={selected(ch().id)}>
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
