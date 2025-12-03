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
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import axios from "axios";
import { GET_USER_API_URL } from "../auth";
import { authMiddleware } from "../auth";

export interface UserInfo {
  id: number;
  login: string;
  name?: string;
  avatarUrl: string;
}

async function findUserById(id: number): Promise<UserInfo | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  });
  if (!user) {
    return null;
  }
  const userResponse = await axios.get(GET_USER_API_URL, {
    headers: {
      Authorization: `Bearer ${user.ghToken}`,
      Accept: `application/vnd.github+json`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    validateStatus: () => true,
  });
  if (userResponse.status !== 200) {
    console.error("Get User detail failure", userResponse.data);
    return null;
  }
  return {
    id: user.id,
    login: userResponse.data.login,
    name: userResponse.data.name,
    avatarUrl: userResponse.data.avatar_url,
  };
}

export const usersPlugin = new Elysia({ prefix: "/users" })
  .use(authMiddleware)
  .get("/me", async ({ userId, isGuest }) => {
    if (userId === null || isGuest) {
      return null;
    }
    const user = await findUserById(userId as number);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  })
  .get(
    "/:id",
    async ({ params }) => {
      const user = await findUserById(params.id);
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
    },
  );
