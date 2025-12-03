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
import { games, playerOnGames } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { authMiddleware } from "../auth";

export interface AddGameOption {
  playerIds: number[];
  coreVersion: string;
  gameVersion: string;
  data: string;
  winnerId: number | null;
}

export async function addGame({ playerIds, ...data }: AddGameOption) {
  const result = await db.transaction(async (tx) => {
    const [game] = await tx.insert(games).values({
      ...data,
      data: JSON.parse(data.data),
    }).returning();
    
    const playerOnGamesData = playerIds.map((id, who) => ({
      playerId: id,
      gameId: game!.id,
      who,
    }));
    
    await tx.insert(playerOnGames).values(playerOnGamesData);
    
    return game;
  });
  return result;
}

export const gamesPlugin = new Elysia({ prefix: "/games" })
  .use(authMiddleware)
  .get(
    "/",
    async ({ query }) => {
      const skip = query.skip ? parseInt(query.skip) : 0;
      const take = query.take ? Math.min(parseInt(query.take), 30) : 10;

      const [data, count] = await Promise.all([
        db.query.games.findMany({
          limit: take,
          offset: skip,
          orderBy: [desc(games.createdAt)],
          with: {
            players: {
              with: {
                player: {
                  columns: {
                    id: true,
                  },
                },
              },
            },
          },
          columns: {
            id: true,
            coreVersion: true,
            gameVersion: true,
            winnerId: true,
            createdAt: true,
          },
        }),
        db.$count(games),
      ]);

      return { data, count };
    },
    {
      query: t.Object({
        skip: t.Optional(t.String()),
        take: t.Optional(t.String()),
      }),
    },
  )
  .get(
    "/mine",
    async ({ userId, isGuest, query }) => {
      if (isGuest || userId === null) {
        throw new Error("Unauthorized");
      }
      const skip = query.skip ? parseInt(query.skip) : 0;
      const take = query.take ? Math.min(parseInt(query.take), 30) : 10;

      const [data, count] = await Promise.all([
        db.query.playerOnGames.findMany({
          where: eq(playerOnGames.playerId, userId as number),
          limit: take,
          offset: skip,
          with: {
            game: {
              columns: {
                id: true,
                coreVersion: true,
                gameVersion: true,
                winnerId: true,
                createdAt: true,
              },
            },
          },
        }),
        db.$count(playerOnGames, eq(playerOnGames.playerId, userId as number)),
      ]);

      return { data, count };
    },
    {
      query: t.Object({
        skip: t.Optional(t.String()),
        take: t.Optional(t.String()),
      }),
    },
  )
  .get(
    "/:gameId",
    async ({ params }) => {
      const game = await db.query.games.findFirst({
        where: eq(games.id, params.gameId),
        with: {
          players: {
            with: {
              player: {
                columns: {
                  id: true,
                },
              },
            },
          },
        },
      });
      if (!game) {
        throw new Error("Game not found");
      }
      return game;
    },
    {
      params: t.Object({
        gameId: t.Numeric(),
      }),
    },
  );
