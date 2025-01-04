import { Accessor } from "solid-js";
import type { DeckInfo } from "./pages/Decks";
import type { Deck } from "@gi-tcg/utils";
import axios from "axios";

export interface GuestInfo {
  isGuest: true;
  name: string;
  id: string | null;
}

export interface DeckWithName extends Deck {
  name: string;
}

export type GuestDeck = readonly [
  Accessor<DeckInfo[]>,
  {
    addGuestDeck: (deck: DeckWithName) => Promise<DeckInfo>;
    updateGuestDeck: (
      id: number,
      deck: Partial<DeckWithName>,
    ) => Promise<DeckInfo>;
    removeGuestDeck: (id: number) => Promise<void>;
  },
];

export const useGuestInfo = () => {
  return (): GuestInfo | null => {
    const name = localStorage.getItem("guestName");
    if (!name) {
      return null;
    }
    const id = localStorage.getItem("guestId");
    return { isGuest: true, name, id };
  };
};

const getGuestDecks = (): DeckInfo[] => {
  const decks = localStorage.getItem("guestDecks");
  if (!decks) {
    return [];
  }
  return JSON.parse(decks);
};

type VersionResponse = Omit<DeckInfo, "id">;

export const useGuestDecks = (): GuestDeck => [
  getGuestDecks,
  {
    addGuestDeck: async (deck) => {
      const decks = getGuestDecks();
      const id = Date.now();
      const { data } = await axios.post<VersionResponse>("decks/version", deck);
      const deckInfo: DeckInfo = { ...data, ...deck, id };
      decks.push(deckInfo);
      localStorage.setItem("guestDecks", JSON.stringify(decks));
      return deckInfo;
    },
    updateGuestDeck: async (id, newDeck) => {
      const decks = getGuestDecks();
      const index = decks.findIndex((deck) => deck.id === id);
      if (index === -1) {
        throw new Error("Deck not found");
      }
      const oldDeck = decks[index];
      const { data } = await axios.post<VersionResponse>("decks/version", {
        ...oldDeck,
        ...newDeck,
      });
      decks[index] = { ...data, ...newDeck, id };
      console.log(decks);
      localStorage.setItem("guestDecks", JSON.stringify(decks));
      return decks[index];
    },
    removeGuestDeck: async (id) => {
      const decks = getGuestDecks();
      const idx = decks.findIndex((deck) => deck.id === id);
      if (idx === -1) {
        throw new Error("Deck not found");
      }
      decks.splice(idx, 1);
      localStorage.setItem("guestDecks", JSON.stringify(decks));
    },
  },
];
