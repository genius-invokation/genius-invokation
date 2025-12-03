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
import { Stream } from "@elysiajs/stream";
import { authMiddleware } from "../auth";
import { RoomsService } from "./rooms.service";
import type { Deck } from "@gi-tcg/typings";
import { VERSIONS } from "@gi-tcg/core";

const DeckSchema = t.Object({
  characters: t.Array(t.Integer(), { minItems: 3, maxItems: 3 }),
  cards: t.Array(t.Integer(), { minItems: 30, maxItems: 30 }),
});

const CreateRoomDtoSchema = t.Object({
  hostFirst: t.Optional(t.Boolean()),
  gameVersion: t.Optional(t.Integer({ minimum: 0, maximum: VERSIONS.length - 1 })),
  initTotalActionTime: t.Optional(t.Number({ minimum: 0, maximum: 300 })),
  rerollTime: t.Optional(t.Number({ minimum: 25, maximum: 300 })),
  roundTotalActionTime: t.Optional(t.Number({ minimum: 0, maximum: 300 })),
  actionTime: t.Optional(t.Number({ minimum: 25, maximum: 300 })),
  randomSeed: t.Optional(t.Number({ minimum: 0, maximum: 2147483546 })),
  watchable: t.Optional(t.Boolean()),
  private: t.Optional(t.Boolean()),
  allowGuest: t.Optional(t.Boolean()),
});

const roomsService = new RoomsService();

export const roomsPlugin = new Elysia({ prefix: "/rooms" })
  .use(authMiddleware)
  .decorate("roomsService", roomsService)
  .get("/", ({ userId }) => {
    return roomsService.getAllRooms(userId === null);
  })
  .post(
    "/",
    async ({ userId, isGuest, body, roomsService }) => {
      if (!isGuest && userId !== null) {
        // User room creation
        return await roomsService.createRoomFromUser(userId as number, body as any);
      } else {
        // Guest room creation
        const result = await roomsService.createRoomFromGuest(body as any);
        return result;
      }
    },
    {
      body: t.Union([
        t.Intersect([
          CreateRoomDtoSchema,
          t.Object({
            hostDeckId: t.Integer(),
          }),
        ]),
        t.Intersect([
          CreateRoomDtoSchema,
          t.Object({
            name: t.String({ minLength: 1, maxLength: 64 }),
            deck: DeckSchema,
          }),
        ]),
      ]),
    },
  )
  .get("/current", ({ userId, roomsService }) => {
    if (userId !== null) {
      return roomsService.currentRoom(userId);
    }
    return null;
  })
  .get(
    "/:roomId",
    ({ userId, params, roomsService }) => {
      const room = roomsService.getRoom(params.roomId);
      if (userId === null && !room.config.allowGuest) {
        throw new Error("This room does not allow guests");
      }
      return room;
    },
    {
      params: t.Object({
        roomId: t.Numeric(),
      }),
    },
  )
  .get(
    "/:roomId/gameLog",
    ({ userId, params, roomsService }) => {
      if (userId === null) {
        throw new Error("Unauthorized");
      }
      return roomsService.getRoomGameLog(userId, params.roomId);
    },
    {
      params: t.Object({
        roomId: t.Numeric(),
      }),
    },
  )
  .delete(
    "/:roomId",
    ({ userId, params, roomsService }) => {
      if (userId === null) {
        throw new Error("Unauthorized");
      }
      return roomsService.deleteRoom(userId, params.roomId);
    },
    {
      params: t.Object({
        roomId: t.Numeric(),
      }),
    },
  )
  .post(
    "/:roomId/players",
    async ({ userId, isGuest, params, body, roomsService }) => {
      if (!isGuest && userId !== null) {
        // User joining
        return await roomsService.joinRoomFromUser(
          userId as number,
          params.roomId,
          (body as any).deckId,
        );
      } else {
        // Guest joining
        const result = await roomsService.joinRoomFromGuest(
          params.roomId,
          body as any,
        );
        return result;
      }
    },
    {
      params: t.Object({
        roomId: t.Numeric(),
      }),
      body: t.Union([
        t.Object({
          deckId: t.Integer(),
        }),
        t.Object({
          name: t.String({ minLength: 1, maxLength: 64 }),
          deck: DeckSchema,
        }),
      ]),
    },
  )
  .get(
    "/:roomId/players/:targetPlayerId/notification",
    ({ userId, params, roomsService }) => {
      const targetPlayerId =
        typeof params.targetPlayerId === "string" &&
        params.targetPlayerId.startsWith("guest-")
          ? params.targetPlayerId
          : parseInt(params.targetPlayerId as string);

      return new Stream(
        roomsService.playerNotification(
          params.roomId,
          userId,
          targetPlayerId,
        ),
      );
    },
    {
      params: t.Object({
        roomId: t.Numeric(),
        targetPlayerId: t.String(),
      }),
    },
  )
  .post(
    "/:roomId/players/:targetPlayerId/actionResponse",
    ({ userId, params, body, roomsService }) => {
      const targetPlayerId =
        typeof params.targetPlayerId === "string" &&
        params.targetPlayerId.startsWith("guest-")
          ? params.targetPlayerId
          : parseInt(params.targetPlayerId as string);

      if (userId !== targetPlayerId) {
        throw new Error("You can only post your own action responses");
      }
      roomsService.receivePlayerResponse(params.roomId, userId!, body as any);
      return { message: "response received" };
    },
    {
      params: t.Object({
        roomId: t.Numeric(),
        targetPlayerId: t.String(),
      }),
      body: t.Object({
        id: t.Integer(),
        response: t.Any(),
      }),
    },
  )
  .post(
    "/:roomId/players/:targetPlayerId/giveUp",
    ({ userId, params, roomsService }) => {
      const targetPlayerId =
        typeof params.targetPlayerId === "string" &&
        params.targetPlayerId.startsWith("guest-")
          ? params.targetPlayerId
          : parseInt(params.targetPlayerId as string);

      if (userId !== targetPlayerId) {
        throw new Error("You can only give up your own game");
      }
      roomsService.receivePlayerGiveUp(params.roomId, userId!);
      return { message: "given up" };
    },
    {
      params: t.Object({
        roomId: t.Numeric(),
        targetPlayerId: t.String(),
      }),
    },
  );
