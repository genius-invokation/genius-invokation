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

import mime from "mime";
import type { FastifyInstance } from "fastify";
import { WEB_CLIENT_BASE_PATH } from "@gi-tcg/config";

export async function frontend(app: FastifyInstance) {
  if (process.env.NODE_ENV === "production") {
    const { default: contents } = await import("@gi-tcg/web-client");
    const baseNoSuffix = WEB_CLIENT_BASE_PATH.replace(/(.+)\/$/, "$1");
    for (const [filename, content] of Object.entries(contents)) {
      app.get(`${WEB_CLIENT_BASE_PATH}${filename}`, (req, reply) => {
        reply.type(mime.getType(filename) ?? "application/octet-stream").send(Buffer.from(content, "base64"));
      });
    }
    const indexHtml = Buffer.from(contents["index.html"]!, "base64");
    app.get(baseNoSuffix, (_req, reply) => {
      reply.type("text/html").send(indexHtml);
    });
    app.get(`${WEB_CLIENT_BASE_PATH}*`, (_req, reply) => {
      reply.type("text/html").send(indexHtml);
    });
  }
}
