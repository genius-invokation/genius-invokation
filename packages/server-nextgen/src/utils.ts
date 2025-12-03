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
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import type { Deck } from "@gi-tcg/typings";
import {
  DEFAULT_ASSETS_MANAGER,
  type ActionCardRawData,
  type AnyData,
  type CharacterRawData,
} from "@gi-tcg/assets-manager";
import { CURRENT_VERSION, VERSIONS, type Version } from "@gi-tcg/core";
import { semver } from "bun";
import { createId as createCuid, isCuid } from "@paralleldrive/cuid2";

export enum DeckVerificationErrorCode {
  SizeError = "SizeError",
  NotFoundError = "NotFoundError",
  CountLimitError = "CountLimitError",
  RelationError = "RelationError",
}

export class DeckVerificationError extends Error {
  constructor(
    public readonly code: DeckVerificationErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export const ASSETS_MANAGER = DEFAULT_ASSETS_MANAGER;

ASSETS_MANAGER.prepareForSync();

const getData = <T extends AnyData>(id: number): Promise<T | undefined> => {
  return ASSETS_MANAGER.getData(id) as Promise<T | undefined>;
};

export async function verifyDeck({
  characters,
  cards,
}: Deck): Promise<Version> {
  const DEC = DeckVerificationErrorCode;
  const versions = new Set<string | undefined>();
  const characterSet = new Set(characters);
  if (characterSet.size !== 3) {
    throw new DeckVerificationError(
      DEC.SizeError,
      "deck must contain 3 characters",
    );
  }
  if (cards.length !== 30) {
    throw new DeckVerificationError(
      DEC.SizeError,
      "deck must contain 30 cards",
    );
  }
  const characterTags = [];
  for (const chId of characters) {
    const character = await getData<CharacterRawData>(chId);
    if (!character) {
      throw new DeckVerificationError(
        DEC.NotFoundError,
        `character id ${chId} not found`,
      );
    }
    if (!character.obtainable) {
      throw new DeckVerificationError(
        DEC.NotFoundError,
        `character id ${chId} not obtainable`,
      );
    }
    characterTags.push(...character.tags);
    versions.add(character.sinceVersion);
  }
  const cardCounts = new Map<number, number>();
  for (const cardId of cards) {
    const card = await getData<ActionCardRawData>(cardId);
    if (!card) {
      throw new DeckVerificationError(
        DEC.NotFoundError,
        `card id ${cardId} not found`,
      );
    }
    const cardMaxCount = card?.tags.includes("GCG_TAG_LEGEND") ? 1 : 2;
    if (cardCounts.has(cardId)) {
      const count = cardCounts.get(cardId)! + 1;
      if (count > cardMaxCount) {
        throw new DeckVerificationError(
          DEC.CountLimitError,
          `card id ${cardId} exceeds max count`,
        );
      }
      cardCounts.set(cardId, count);
    } else {
      if (!card.obtainable) {
        throw new DeckVerificationError(
          DEC.RelationError,
          `card id ${cardId} not obtainable`,
        );
      }
      if (
        card.relatedCharacterId !== null &&
        !characters.includes(card.relatedCharacterId)
      ) {
        throw new DeckVerificationError(
          DEC.RelationError,
          `card id ${cardId} related character not in deck`,
        );
      }
      const tempCharacterTags = [...characterTags];
      for (const requiredTag of card.relatedCharacterTags) {
        const idx = tempCharacterTags.indexOf(requiredTag);
        if (idx === -1) {
          throw new DeckVerificationError(
            DEC.RelationError,
            `card id ${cardId} related character tags not in deck`,
          );
        }
        tempCharacterTags.splice(idx, 1);
      }
      cardCounts.set(cardId, 1);
      versions.add(card.sinceVersion);
    }
  }
  return maxVersion(versions);
}

function maxVersion(versions: Iterable<string | undefined>): Version {
  const ver = [...versions]
    .filter((v): v is string => !!v)
    .toSorted(semver.order)
    .last();
  if (!VERSIONS.includes(ver as Version)) {
    return CURRENT_VERSION;
  } else {
    return ver as Version;
  }
}

export async function minimumRequiredVersionOfDeck({
  characters,
  cards,
}: Deck): Promise<Version> {
  return maxVersion(
    await Promise.all(
      [...characters, ...cards].map((p) =>
        getData<CharacterRawData | ActionCardRawData>(p).then(
          (d) => d?.sinceVersion as Version | undefined,
        ),
      ),
    ),
  );
}

export function createGuestId() {
  return `guest-${createCuid()}`;
}

export function isGuestId(id: unknown): id is string {
  if (typeof id !== "string") {
    return false;
  }
  const [tag, cuid] = id.split("-");
  return tag === "guest" && !!cuid && isCuid(cuid);
}

export interface PaginationParams {
  skip?: number;
  take?: number;
}

export interface PaginationResult<T> {
  count: number;
  data: T[];
}
