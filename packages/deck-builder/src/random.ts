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
