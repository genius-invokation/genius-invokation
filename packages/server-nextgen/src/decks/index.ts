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

import { Elysia, t } from "elysia";
import { db } from "../db";
import { decks } from "../db/schema";
import { eq, and, lte, desc } from "drizzle-orm";
import { authMiddleware } from "../auth";
import { ASSETS_MANAGER, verifyDeck, type PaginationResult } from "../utils";
import { VERSIONS } from "@gi-tcg/core";
import type { Deck } from "@gi-tcg/typings";

const DeckSchema = t.Object({
  characters: t.Array(t.Integer(), { minItems: 3, maxItems: 3 }),
  cards: t.Array(t.Integer(), { minItems: 30, maxItems: 30 }),
});

interface DeckWithVersion extends Deck {
  code: string;
  requiredVersion: number;
}

async function deckToCode(deck: Deck): Promise<DeckWithVersion> {
  const sinceVersion = await verifyDeck(deck);
  const requiredVersion = VERSIONS.indexOf(sinceVersion);
  return {
    ...deck,
    code: ASSETS_MANAGER.encode(deck),
    requiredVersion,
  };
}

function codeToDeck(code: string): Deck {
  return ASSETS_MANAGER.decode(code);
}

export const decksPlugin = new Elysia({ prefix: "/decks" })
  .use(authMiddleware)
  .post(
    "/",
    async ({ userId, isGuest, body }) => {
      if (isGuest || userId === null) {
        throw new Error("Unauthorized");
      }
      const { code, requiredVersion } = await deckToCode(body);
      const result = await db.insert(decks).values({
        name: body.name,
        code,
        ownerUserId: userId as number,
        requiredVersion,
      }).returning();
      return {
        id: result[0]!.id,
        code: result[0]!.code,
      };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 64 }),
        characters: t.Array(t.Integer(), { minItems: 3, maxItems: 3 }),
        cards: t.Array(t.Integer(), { minItems: 30, maxItems: 30 }),
      }),
    },
  )
  .post(
    "/version",
    async ({ body }) => {
      return await deckToCode(body);
    },
    {
      body: t.Object({
        characters: t.Array(t.Integer(), { minItems: 3, maxItems: 3 }),
        cards: t.Array(t.Integer(), { minItems: 30, maxItems: 30 }),
      }),
    },
  )
  .get(
    "/",
    async ({ userId, isGuest, query }) => {
      if (isGuest || userId === null) {
        throw new Error("Unauthorized");
      }
      const skip = query.skip ? parseInt(query.skip) : 0;
      const take = query.take ? Math.min(parseInt(query.take), 30) : 100;
      const requiredVersion = query.requiredVersion
        ? parseInt(query.requiredVersion)
        : undefined;

      const conditions = [eq(decks.ownerUserId, userId as number)];
      if (requiredVersion !== undefined) {
        conditions.push(lte(decks.requiredVersion, requiredVersion));
      }

      const [data, countResult] = await Promise.all([
        db.query.decks.findMany({
          where: and(...conditions),
          limit: take,
          offset: skip,
          orderBy: [desc(decks.createdAt)],
        }),
        db.$count(decks, and(...conditions)),
      ]);

      const result = data.map((model) => {
        const { characters, cards } = codeToDeck(model.code);
        return {
          ...model,
          characters,
          cards,
        };
      });

      return { data: result, count: countResult };
    },
    {
      query: t.Object({
        skip: t.Optional(t.String()),
        take: t.Optional(t.String()),
        requiredVersion: t.Optional(t.String()),
      }),
    },
  )
  .get(
    "/:deckId",
    async ({ userId, isGuest, params }) => {
      if (isGuest || userId === null) {
        throw new Error("Unauthorized");
      }
      const model = await db.query.decks.findFirst({
        where: and(
          eq(decks.id, params.deckId),
          eq(decks.ownerUserId, userId as number),
        ),
      });
      if (!model) {
        throw new Error("Deck not found");
      }
      const { characters, cards } = codeToDeck(model.code);
      return {
        ...model,
        characters,
        cards,
      };
    },
    {
      params: t.Object({
        deckId: t.Numeric(),
      }),
    },
  )
  .patch(
    "/:deckId",
    async ({ userId, isGuest, params, body }) => {
      if (isGuest || userId === null) {
        throw new Error("Unauthorized");
      }
      let code: string | undefined;
      let requiredVersion: number | undefined;
      if (body.characters || body.cards) {
        if (!body.characters || !body.cards) {
          throw new Error("characters and cards must be provided together");
        }
        ({ code, requiredVersion } = await deckToCode({
          characters: body.characters,
          cards: body.cards,
        }));
      }
      const updateData: any = {};
      if (body.name) updateData.name = body.name;
      if (code) updateData.code = code;
      if (requiredVersion !== undefined)
        updateData.requiredVersion = requiredVersion;

      const result = await db
        .update(decks)
        .set(updateData)
        .where(
          and(
            eq(decks.id, params.deckId),
            eq(decks.ownerUserId, userId as number),
          ),
        )
        .returning();
      return result[0];
    },
    {
      params: t.Object({
        deckId: t.Numeric(),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 64 })),
        characters: t.Optional(t.Array(t.Integer(), { minItems: 3, maxItems: 3 })),
        cards: t.Optional(t.Array(t.Integer(), { minItems: 30, maxItems: 30 })),
      }),
    },
  )
  .delete(
    "/:deckId",
    async ({ userId, isGuest, params }) => {
      if (isGuest || userId === null) {
        throw new Error("Unauthorized");
      }
      await db
        .delete(decks)
        .where(
          and(
            eq(decks.id, params.deckId),
            eq(decks.ownerUserId, userId as number),
          ),
        );
      return { message: `deck ${params.deckId} deleted` };
    },
    {
      params: t.Object({
        deckId: t.Numeric(),
      }),
    },
  );
