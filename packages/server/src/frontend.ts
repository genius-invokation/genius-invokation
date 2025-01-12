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

import path from "node:path";
import type { FastifyInstance } from "fastify";
import { fastifyStatic } from "@fastify/static";
import { WEB_CLIENT_BASE_PATH } from "@gi-tcg/config";

const indexHtml = await Bun.file(path.join(import.meta.dirname, "../../web-client/dist/index.html")).text();

export async function frontend(app: FastifyInstance) {
  if (process.env.NODE_ENV === "production") {
    await app.register(fastifyStatic, {
      root: path.join(import.meta.dirname, "../../web-client/dist"),
      index: false,
      prefix: WEB_CLIENT_BASE_PATH,
      wildcard: false,
    });
    const baseNoSuffix = WEB_CLIENT_BASE_PATH.replace(/(.+)\/$/, "$1");
    app.get(baseNoSuffix, (_req, reply) => {
      reply.type("text/html").send(indexHtml);
    });
    app.get(`${baseNoSuffix}/*`, (_req, reply) => {
      reply.type("text/html").send(indexHtml);
    });
  }
}
