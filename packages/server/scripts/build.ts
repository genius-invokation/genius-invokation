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

import inlineFrontendPlugin from "./bun_plugin_frontend";
import simpleGit from "simple-git";

let latestLog;
try {
  latestLog = await simpleGit().log({ maxCount: 1 });
} catch {
  latestLog = {
    latest: {
      message: process.env.GIT_MESSAGE,
      hash: process.env.GIT_HASH,
      date: process.env.GIT_DATE ?? new Date().toISOString(),
    },
  };
}

await Bun.build({
  entrypoints: [`${import.meta.dirname}/../src/main.ts`],
  outdir: `${import.meta.dirname}/../dist`,
  external: [
    "@nestjs/platform-express",
    "@nestjs/microservices",
    "@nestjs/websockets",
    "@fastify/view",
    "@fastify/static",
  ],
  define: {
    __LATEST_GIT_LOG__: JSON.stringify(latestLog),
  },
  plugins: [inlineFrontendPlugin],
  target: "bun",
  conditions: ["bun", "es2015", "module", "import", "default"],
  minify: true,
  naming: {
    asset: `[name].[ext]`,
  },
});
