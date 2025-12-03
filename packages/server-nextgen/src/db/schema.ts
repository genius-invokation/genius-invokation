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

import { pgTable, integer, text, timestamp, serial, json, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("User", {
  id: integer("id").primaryKey(),
  ghToken: text("ghToken"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const games = pgTable("Game", {
  id: serial("id").primaryKey(),
  coreVersion: text("coreVersion").notNull(),
  gameVersion: text("gameVersion").notNull(),
  data: json("data").notNull(),
  winnerId: integer("winnerId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const playerOnGames = pgTable("PlayerOnGames", {
  playerId: integer("playerId").notNull().references(() => users.id),
  gameId: integer("gameId").notNull().references(() => games.id),
  who: integer("who").notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.playerId, table.gameId] }),
}));

export const decks = pgTable("Deck", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  requiredVersion: integer("requiredVersion").notNull(),
  ownerUserId: integer("ownerUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  games: many(playerOnGames),
  decks: many(decks),
}));

export const gamesRelations = relations(games, ({ many }) => ({
  players: many(playerOnGames),
}));

export const playerOnGamesRelations = relations(playerOnGames, ({ one }) => ({
  player: one(users, {
    fields: [playerOnGames.playerId],
    references: [users.id],
  }),
  game: one(games, {
    fields: [playerOnGames.gameId],
    references: [games.id],
  }),
}));

export const decksRelations = relations(decks, ({ one }) => ({
  owner: one(users, {
    fields: [decks.ownerUserId],
    references: [users.id],
  }),
}));
