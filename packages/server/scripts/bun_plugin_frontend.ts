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

import { Glob, plugin, type BunPlugin } from "bun";
import path from "node:path";

const frontendDir = path.join(import.meta.dirname, "../../web-client/dist");

const inlineFrontendPlugin: BunPlugin = {
  name: "Inline Frontend",
  setup: async (build) => {
    build.onResolve({ filter: /^@gi-tcg\/web-client$/ }, async () => ({
      path: "web-client",
      namespace: "virtual",
    }));
    build.onLoad({ filter: /^web-client$/, namespace: "virtual" }, async () => {
      const contents: Record<string, string> = {};
      for await (const filename of new Glob("**/*").scan(frontendDir)) {
        const filepath = path.resolve(frontendDir, filename);
        const content = await Bun.file(filepath).arrayBuffer();
        contents[filename] = Buffer.from(content).toString("base64");
      }
      return {
        loader: "json",
        contents: JSON.stringify(contents),
      };
    });
  },
};

plugin(inlineFrontendPlugin);

export default inlineFrontendPlugin;
