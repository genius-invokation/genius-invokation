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

import { CHARACTER_CARDS } from "./AllCharacterCards";
import { ACTION_CARDS } from "./AllActionCards";
import { T as tagMap } from "./data.json";
import type { Deck } from "@gi-tcg/utils";

const LEGEND = tagMap.indexOf("GCG_TAG_LEGEND");

const takeRandomOne = <T>(source: T[]) => {
  const i = Math.floor(Math.random() * source.length);
  return source.splice(i, 1)[0];
};

export const generateRandomDeck = () => {
  const characters = Object.values(CHARACTER_CARDS);
  const characterTags: number[] = [];

  const decks: Deck = {
    characters: [],
    cards: [],
  };
  for (let i = 0; i < 3; i++) {
    const ch = takeRandomOne(characters);
    decks.characters.push(ch.i);
    characterTags.push(...ch.t);
  }

  const actionCards = Object.values(ACTION_CARDS).flatMap((c) => {
    let included = true;
    if (typeof c.rc === "number" && !decks.characters.includes(c.rc)) {
      included &&= false;
    }
    if (
      typeof c.rt === "number" &&
      characterTags.filter((t) => t === c.rt).length < 2
    ) {
      included &&= false;
    }
    if (included) {
      return c.t.includes(LEGEND) ? [c] : [c, c];
    } else {
      return [];
    }
  });

  for (let i = 0; i < 30; i++) {
    const ac = takeRandomOne(actionCards);
    decks.cards.push(ac.i);
  }

  return decks;
};
