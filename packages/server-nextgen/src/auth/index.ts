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
import { jwt } from "@elysiajs/jwt";
import axios from "axios";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-change-in-production";

export const CODE_EXCHANGE_URL =
  process.env.GH_CODE_EXCHANGE_URL ||
  `https://github.com/login/oauth/access_token`;
export const GET_USER_API_URL =
  process.env.GH_GET_USER_API_URL || `https://api.github.com/user`;

async function getGitHubId(code: string) {
  const response = await axios.post(
    CODE_EXCHANGE_URL,
    {
      client_id: process.env.GH_CLIENT_ID,
      client_secret: process.env.GH_CLIENT_SECRET,
      code,
    },
    {
      headers: {
        Accept: "application/json",
      },
      validateStatus: () => true,
    },
  );
  if (response.status >= 400 || !response.data?.access_token) {
    console.error("Code exchange failure", response.data);
    throw new Error(
      `code exchange failure: ${response.data?.error_description}`,
    );
  }
  const accessToken = response.data.access_token;
  const userResponse = await axios.get(GET_USER_API_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: `application/vnd.github+json`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    validateStatus: () => true,
  });
  if (userResponse.status >= 400) {
    console.error("Get User detail failure", userResponse.data);
    throw new Error(
      `get user detail failure: ${userResponse.data?.message}`,
    );
  }
  return {
    id: userResponse.data.id,
    ghToken: accessToken,
  };
}

async function createOrUpdateUser(id: number, ghToken: string) {
  const existing = await db.query.users.findFirst({
    where: eq(users.id, id),
  });
  
  if (existing) {
    await db.update(users).set({ ghToken }).where(eq(users.id, id));
  } else {
    await db.insert(users).values({ id, ghToken });
  }
}

export const authPlugin = new Elysia({ prefix: "/auth" })
  .use(jwt({ name: "jwt", secret: JWT_SECRET }))
  .post(
    "/login",
    async ({ body, jwt }) => {
      const { id, ghToken } = await getGitHubId(body.code);
      await createOrUpdateUser(id, ghToken);
      const payload = { user: 1, sub: id };
      const accessToken = await jwt.sign(payload);
      return { accessToken };
    },
    {
      body: t.Object({
        code: t.String(),
      }),
    },
  )
  .post(
    "/guest",
    async ({ body, jwt }) => {
      const payload = { user: 0, sub: body.playerId };
      const accessToken = await jwt.sign(payload);
      return { accessToken };
    },
    {
      body: t.Object({
        playerId: t.String(),
      }),
    },
  );

export const authMiddleware = (app: Elysia) =>
  app
    .use(jwt({ name: "jwt", secret: JWT_SECRET }))
    .derive(async ({ headers, jwt }) => {
      const auth = headers.authorization;
      if (!auth || !auth.startsWith("Bearer ")) {
        return { userId: null, isGuest: false };
      }
      const token = auth.substring(7);
      const payload = await jwt.verify(token);
      if (!payload) {
        return { userId: null, isGuest: false };
      }
      const isGuest = payload.user === 0;
      const userId = isGuest ? (payload.sub as string) : (payload.sub as number);
      return { userId, isGuest };
    });
