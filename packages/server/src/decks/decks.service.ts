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

import { BadRequestException, Injectable } from "@nestjs/common";
import { DrizzleService } from "../db/drizzle.service";
import { decks } from "../db/schema";
import { eq, and, lte, sql } from "drizzle-orm";
import type {
  CreateDeckDto,
  QueryDeckDto,
  UpdateDeckDto,
} from "./decks.controller";
import { type Deck } from "@gi-tcg/typings";
import {
  ASSETS_MANAGER,
  verifyDeck,
  type PaginationResult,
} from "../utils";
import { VERSIONS } from "@gi-tcg/core";

type DeckModel = typeof decks.$inferSelect;

interface DeckWithVersion extends Deck {
  code: string;
  requiredVersion: number;
}

export interface DeckWithDeckModel extends DeckWithVersion, DeckModel {}

@Injectable()
export class DecksService {
  constructor(private drizzle: DrizzleService) {}

  async deckToCode(deck: Deck): Promise<DeckWithVersion> {
    try {
      const sinceVersion = await verifyDeck(deck);
      const requiredVersion = VERSIONS.indexOf(sinceVersion);
      return {
        ...deck,
        code: ASSETS_MANAGER.encode(deck),
        requiredVersion,
      };
    } catch (e) {
      if (e instanceof Error) {
        throw new BadRequestException(e.message);
      } else {
        throw e;
      }
    }
  }

  private codeToDeck(code: string): Deck {
    const deck = ASSETS_MANAGER.decode(code);
    return {
      // code,
      ...deck,
    };
  }

  async createDeck(userId: number, deck: CreateDeckDto): Promise<DeckModel> {
    const { code, requiredVersion } = await this.deckToCode(deck);
    const [result] = await this.drizzle.db
      .insert(decks)
      .values({
        name: deck.name,
        code,
        ownerUserId: userId,
        requiredVersion,
      })
      .returning();
    return result;
  }

  async getAllDecks(
    userId: number,
    { skip = 0, take = 100, requiredVersion }: QueryDeckDto,
  ): Promise<PaginationResult<DeckWithDeckModel>> {
    const countQuery = this.drizzle.db
      .select({ count: sql<number>`count(*)::int` })
      .from(decks)
      .where(
        and(
          eq(decks.ownerUserId, userId),
          lte(decks.requiredVersion, requiredVersion)
        )
      );

    const modelsQuery = this.drizzle.db
      .select()
      .from(decks)
      .where(
        and(
          eq(decks.ownerUserId, userId),
          lte(decks.requiredVersion, requiredVersion)
        )
      )
      .offset(skip)
      .limit(take);

    const [countResult, models] = await Promise.all([
      countQuery,
      modelsQuery,
    ]);

    const count = countResult[0]?.count ?? 0;

    const data = models.map((model) => {
      const { characters, cards } = this.codeToDeck(model.code);
      return {
        ...model,
        characters,
        cards,
      };
    });
    return { data, count };
  }

  async getDeck(
    userId: number,
    deckId: number,
  ): Promise<DeckWithDeckModel | null> {
    const [model] = await this.drizzle.db
      .select()
      .from(decks)
      .where(
        and(
          eq(decks.id, deckId),
          eq(decks.ownerUserId, userId)
        )
      )
      .limit(1);
    
    if (model === undefined) {
      return null;
    }
    const { characters, cards } = this.codeToDeck(model.code);
    return {
      ...model,
      characters,
      cards,
    };
  }

  async updateDeck(
    userId: number,
    deckId: number,
    deck: UpdateDeckDto,
  ) {
    let code: string | undefined;
    let requiredVersion: number | undefined;
    if (!deck.characters || !deck.cards) {
      if (!deck.characters && !deck.cards) {
        code = void 0;
      } else {
        throw new BadRequestException(
          `characters and cards must be provided together`,
        );
      }
    } else {
      ({ code, requiredVersion } = await this.deckToCode({
        characters: deck.characters,
        cards: deck.cards,
      }));
    }
    
    const updateData: Partial<typeof decks.$inferInsert> = {
      ...(deck.name !== undefined && { name: deck.name }),
      ...(code !== undefined && { code }),
      ...(requiredVersion !== undefined && { requiredVersion }),
    };

    const [model] = await this.drizzle.db
      .update(decks)
      .set(updateData)
      .where(
        and(
          eq(decks.id, deckId),
          eq(decks.ownerUserId, userId)
        )
      )
      .returning();
    
    if (!model) {
      throw new BadRequestException("Deck not found or access denied");
    }
    
    return model;
  }

  async deleteDeck(userId: number, deckId: number) {
    await this.drizzle.db
      .delete(decks)
      .where(
        and(
          eq(decks.id, deckId),
          eq(decks.ownerUserId, userId)
        )
      );
  }
}
