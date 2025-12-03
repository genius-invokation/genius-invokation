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

import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { WEB_CLIENT_BASE_PATH } from "@gi-tcg/config";
import { authPlugin } from "./auth";
import { usersPlugin } from "./users";
import { decksPlugin } from "./decks";
import { gamesPlugin } from "./games";
import { roomsPlugin } from "./rooms";
import { frontendPlugin } from "./frontend";
import { CORE_VERSION, CURRENT_VERSION, VERSIONS } from "@gi-tcg/core";
import simpleGit, { type LogResult } from "simple-git";

const git = simpleGit();

const fallbackGitLog = (): LogResult => {
  const latestLog: LogResult["latest"] = {
    message: "",
    hash: "unknown",
    author_email: "unknown@.local",
    author_name: "unknown",
    body: "",
    date: new Date().toISOString(),
    refs: "",
  };
  if (process.env.RAILWAY_SERVICE_NAME) {
    latestLog.message = process.env.RAILWAY_GIT_COMMIT_MESSAGE || "";
    latestLog.hash = process.env.RAILWAY_GIT_COMMIT_SHA || "unknown";
    latestLog.author_email = `${process.env.RAILWAY_SERVICE_NAME}@${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    latestLog.author_name = process.env.RAILWAY_GIT_AUTHOR || "unknown";
    latestLog.refs = `HEAD -> ${process.env.RAILWAY_GIT_BRANCH}, origin/${process.env.RAILWAY_GIT_BRANCH}`;
  }
  return {
    latest: latestLog,
    all: [latestLog],
    total: 1,
  };
};

const app = new Elysia()
  .use(frontendPlugin)
  .group(`${WEB_CLIENT_BASE_PATH}api`, (app) =>
    app
      .use(authPlugin)
      .use(usersPlugin)
      .use(decksPlugin)
      .use(gamesPlugin)
      .use(roomsPlugin)
      .get("/version", async () => {
        const { latest } = await git.log({ maxCount: 1 }).catch(fallbackGitLog);
        return {
          revision: latest,
          supportedGameVersions: VERSIONS,
          currentGameVersion: CURRENT_VERSION,
          coreVersion: CORE_VERSION,
        };
      })
      .get("/teapot", () => {
        return new Response("I'm a teapot~", { status: 418 });
      })
      .get("/hello", () => "Hello World!")
      .get("/healthz", () => {
        return { status: "ok" };
      }),
  )
  .onError(({ error, code }) => {
    console.error("Error:", error);
    if (code === "VALIDATION") {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  });

if (process.env.NODE_ENV !== "production") {
  app.use(cors({ origin: "*" }));
}

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`Server listening at http://[::]:${port}`);
});

export default app;
