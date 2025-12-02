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
  plugins: [inlineFrontendPlugin],
  target: "bun",
  conditions: ["bun", "es2015", "module"],
  env: "inline",
  // minify: true,
  sourcemap: "linked",
  naming: {
    asset: `[name].[ext]`,
  },
});
