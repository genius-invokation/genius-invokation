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
import fastifyEtag from "@fastify/etag";
import { WEB_CLIENT_BASE_PATH } from "@gi-tcg/config";

// 判断是否应该长期缓存（非 HTML 文件）
function shouldLongCache(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase();
  return !["html", "htm"].includes(ext ?? "");
}

export async function frontend(app: FastifyInstance) {
  // 注册 ETag 插件
  await app.register(fastifyEtag as any);

  if (process.env.NODE_ENV === "production") {
    const { default: contents } = await import("@gi-tcg/web-client");
    const baseNoSuffix = WEB_CLIENT_BASE_PATH.replace(/(.+)\/$/, "$1");

    // 预计算所有文件的 Buffer
    const fileCache = new Map<string, Buffer>();
    for (const [filename, content] of Object.entries(contents)) {
      const buffer = Buffer.from(content, "base64");
      fileCache.set(filename, buffer);
    }

    for (const [filename, _content] of Object.entries(contents)) {
      app.get(`${WEB_CLIENT_BASE_PATH}${filename}`, (_req, reply) => {
        const buffer = fileCache.get(filename)!;

        // 设置缓存头
        if (shouldLongCache(filename)) {
          // 静态资源：1 年缓存
          reply.header("Cache-Control", "public, max-age=31536000, immutable");
        } else {
          // HTML 文件：协商缓存
          reply.header("Cache-Control", "public, no-cache, must-revalidate");
        }

        reply
          .type(mime.getType(filename) ?? "application/octet-stream")
          .send(buffer);
      });
    }

    const indexHtml = fileCache.get("index.html")!;

    app.get(baseNoSuffix, (_req, reply) => {
      reply
        .header("Cache-Control", "public, no-cache, must-revalidate")
        .type("text/html")
        .send(indexHtml);
    });

    app.get(`${WEB_CLIENT_BASE_PATH}*`, (_req, reply) => {
      reply
        .header("Cache-Control", "public, no-cache, must-revalidate")
        .type("text/html")
        .send(indexHtml);
    });
  }
}
