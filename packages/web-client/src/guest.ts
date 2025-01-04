import { Accessor, createResource, createSignal } from "solid-js";
import { makePersisted } from "@solid-primitives/storage";
import type { DeckInfo } from "./pages/Decks";
import type { Deck } from "@gi-tcg/utils";
import axios from "axios";
import { createStore, produce } from "solid-js/store";

export interface GuestInfo {
  type: "guest";
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

const [guestInfo, setGuestInfo] = makePersisted(
  createSignal<GuestInfo | null>(null),
  { storage: localStorage },
);

export const useGuestInfo = () => [guestInfo, setGuestInfo] as const;

const [guestDeck, setGuestDeck] = makePersisted(createStore<DeckInfo[]>([]), {
  storage: localStorage,
});

type VersionResponse = Omit<DeckInfo, "id">;

export const useGuestDecks = (): GuestDeck => [
  () => guestDeck,
  {
    addGuestDeck: async (deck) => {
      const id = Date.now();
      const { data } = await axios.post<VersionResponse>("decks/version", deck);
      const deckInfo: DeckInfo = { ...data, ...deck, id };
      setGuestDeck((decks) => [...decks, deckInfo]);
      return deckInfo;
    },
    updateGuestDeck: async (id, newDeck) => {
      const index = guestDeck.findIndex((deck) => deck.id === id);
      if (index === -1) {
        throw new Error("Deck not found");
      }
      const oldDeck = guestDeck[index];
      const { data } = await axios.post<VersionResponse>("decks/version", {
        ...oldDeck,
        ...newDeck,
      });
      const result = { ...data, ...newDeck, id };
      setGuestDeck(
        produce((decks) => {
          decks[index] = result;
        }),
      );
      return result;
    },
    removeGuestDeck: async (id) => {
      const idx = guestDeck.findIndex((deck) => deck.id === id);
      if (idx === -1) {
        throw new Error("Deck not found");
      }
      setGuestDeck(
        produce((decks) => {
          decks.splice(idx, 1);
        }),
      );
    },
  },
];
