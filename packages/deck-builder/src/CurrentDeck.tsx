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

import { For, Index, Show, createEffect } from "solid-js";
import type { AllCardsProps } from "./AllCards";
import { Card } from "./Card";
import {
  c as characters,
  a as actionCards,
} from "./data.json" /*  with { type: "json" } */;
import { createStore } from "solid-js/store";
import { CHARACTER_CARDS } from "./AllCharacterCards";
import { ACTION_CARDS } from "./AllActionCards";

type Character = (typeof characters)[0];
type ActionCard = (typeof actionCards)[0];

export function CurrentDeck(props: AllCardsProps) {
  const [currentChs, setCurrentChs] = createStore<(Character | null)[]>(
    Array.from({ length: 3 }, () => null),
  );
  const [currentAcs, setCurrentAcs] = createStore<(ActionCard | null)[]>(
    Array.from({ length: 30 }, () => null),
  );

  createEffect(() => {
    const selectedChs = props.deck.characters
      .map((id) => CHARACTER_CARDS[id])
      .filter((ch): ch is Character => typeof ch !== "undefined");
    const selectedAcs = props.deck.cards
      .map((id) => ACTION_CARDS[id])
      .filter((ac): ac is ActionCard => typeof ac !== "undefined")
      .toSorted((a, b) => a.i - b.i);
    for (let i = 0; i < 3; i++) {
      setCurrentChs(i, selectedChs[i] ? { ...selectedChs[i] } : null);
    }
    for (let i = 0; i < 30; i++) {
      setCurrentAcs(i, selectedAcs[i] ? { ...selectedAcs[i] } : null);
    }
  });

  const removeCharacter = (idx: number) => {
    setCurrentChs(idx, null);
    props.onChangeDeck?.({
      ...props.deck,
      characters: currentChs
        .filter((ch): ch is Character => ch !== null)
        .map((ch) => ch.i),
    });
  };
  const removeActionCard = (idx: number) => {
    setCurrentAcs(idx, null);
    props.onChangeDeck?.({
      ...props.deck,
      cards: currentAcs
        .filter((ac): ac is ActionCard => ac !== null)
        .map((ac) => ac.i),
    });
  };

  return (
    <div class="flex-shrink-0 flex flex-col items-center justify-center gap-3">
      <div>
        <ul class="flex flex-row gap-3">
          <Index each={currentChs}>
            {(ch, idx) => (
              <li
                class="w-[75px] aspect-ratio-[7/12] relative group"
                onClick={() => ch() && removeCharacter(idx)}
              >
                <Show
                  when={ch()}
                  fallback={
                    <div class="w-full h-full rounded-lg bg-gray-200" />
                  }
                >
                  {(ch) => (
                    <>
                      <Card id={ch().i} name={ch().n} />
                      <div class="absolute left-1/2 top-1/2 translate-x--1/2 translate-y--1/2 text-2xl group-hover:block hidden pointer-events-none text-red-500">
                        &#10060;
                      </div>
                    </>
                  )}
                </Show>
              </li>
            )}
          </Index>
        </ul>
      </div>
      <div>
        <ul class="grid grid-cols-6 gap-2">
          <Index each={currentAcs}>
            {(ac, idx) => (
              <li
                class="w-[50px] aspect-ratio-[7/12] relative group"
                onClick={() => ac() && removeActionCard(idx)}
              >
                <Show
                  when={ac()}
                  fallback={
                    <div class="w-full h-full rounded-lg bg-gray-200" />
                  }
                >
                  {(ac) => (
                    <>
                      <Card id={ac().i} name={ac().n} />
                      <div class="absolute left-1/2 top-1/2 translate-x--1/2 translate-y--1/2 text-2xl group-hover:block hidden pointer-events-none text-red-500">
                        &#10060;
                      </div>
                    </>
                  )}
                </Show>
              </li>
            )}
          </Index>
        </ul>
      </div>
    </div>
  );
}
