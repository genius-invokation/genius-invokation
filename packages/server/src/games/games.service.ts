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

import { Injectable } from "@nestjs/common";
import { DrizzleService } from "../db/drizzle.service";
import { games, playerOnGames, users } from "../db/schema";
import { eq, desc, sql } from "drizzle-orm";
import type { PaginationDto, PaginationResult } from "../utils";

export interface AddGameOption {
  playerIds: number[];
  coreVersion: string;
  gameVersion: string;
  data: string;
  winnerId: number | null;
}

type GameModel = typeof games.$inferSelect;
type PlayerOnGamesModel = typeof playerOnGames.$inferSelect;

interface GameNoData extends Omit<GameModel, "data"> {}

@Injectable()
export class GamesService {
  constructor(private drizzle: DrizzleService) {}

  async addGame({ playerIds, ...data }: AddGameOption): Promise<GameModel> {
    return await this.drizzle.db.transaction(async (tx) => {
      const [game] = await tx
        .insert(games)
        .values(data)
        .returning();

      const playerOnGamesData = playerIds.map((id, who) => ({
        playerId: id,
        gameId: game.id,
        who,
      }));

      await tx.insert(playerOnGames).values(playerOnGamesData);

      return game;
    });
  }

  async getAllGames({
    skip = 0,
    take = 10,
  }: PaginationDto): Promise<PaginationResult<GameNoData & { players: Array<{ player: { id: number }, who: number }> }>> {
    const countQuery = this.drizzle.db
      .select({ count: sql<number>`count(*)::int` })
      .from(games);
    
    const dataQuery = this.drizzle.db
      .select({
        id: games.id,
        coreVersion: games.coreVersion,
        gameVersion: games.gameVersion,
        winnerId: games.winnerId,
        createdAt: games.createdAt,
      })
      .from(games)
      .orderBy(desc(games.createdAt))
      .offset(skip)
      .limit(take);

    const [countResult, gamesData] = await Promise.all([
      countQuery,
      dataQuery,
    ]);

    const count = countResult[0]?.count ?? 0;

    // Fetch players for each game
    const data = await Promise.all(
      gamesData.map(async (game) => {
        const players = await this.drizzle.db
          .select({
            player: {
              id: users.id,
            },
            who: playerOnGames.who,
          })
          .from(playerOnGames)
          .innerJoin(users, eq(playerOnGames.playerId, users.id))
          .where(eq(playerOnGames.gameId, game.id));

        return {
          ...game,
          players,
        };
      })
    );

    return { count, data };
  }

  async getGame(gameId: number) {
    const [game] = await this.drizzle.db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);

    if (!game) {
      return null;
    }

    const players = await this.drizzle.db
      .select({
        player: {
          id: users.id,
        },
        who: playerOnGames.who,
      })
      .from(playerOnGames)
      .innerJoin(users, eq(playerOnGames.playerId, users.id))
      .where(eq(playerOnGames.gameId, gameId));

    return {
      ...game,
      players,
    };
  }

  async gamesHasUser(
    userId: number,
    { skip = 0, take = 10 }: PaginationDto,
  ): Promise<PaginationResult<PlayerOnGamesModel & { game: GameNoData }>> {
    const countQuery = this.drizzle.db
      .select({ count: sql<number>`count(*)::int` })
      .from(playerOnGames)
      .where(eq(playerOnGames.playerId, userId));

    const dataQuery = this.drizzle.db
      .select({
        playerId: playerOnGames.playerId,
        gameId: playerOnGames.gameId,
        who: playerOnGames.who,
        game: {
          id: games.id,
          coreVersion: games.coreVersion,
          gameVersion: games.gameVersion,
          winnerId: games.winnerId,
          createdAt: games.createdAt,
        },
      })
      .from(playerOnGames)
      .innerJoin(games, eq(playerOnGames.gameId, games.id))
      .where(eq(playerOnGames.playerId, userId))
      .orderBy(desc(games.createdAt))
      .offset(skip)
      .limit(take);

    const [countResult, data] = await Promise.all([
      countQuery,
      dataQuery,
    ]);

    const count = countResult[0]?.count ?? 0;

    return { data, count };
  }
}
