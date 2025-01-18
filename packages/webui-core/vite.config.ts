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
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { resolve } from "node:path";
import { defaultClientConditions, defineConfig } from "vite";
import devtools from "solid-devtools/vite";
import solid from "vite-plugin-solid";
import nodeExternals from "rollup-plugin-node-externals";
import dts from "vite-plugin-dts";

export default defineConfig({
  esbuild: {
    target: "ES2022",
  },
  resolve: {
    conditions: ["bun", ...defaultClientConditions],
  },
  plugins: [
    {
      ...nodeExternals(),
      enforce: "pre",
    },
    // devtools({
    //   autoname: true,
    //   locator: {
    //     targetIDE: "vscode",
    //     key: "Ctrl",
    //     jsxLocation: true,
    //     componentLocation: true,
    //   },
    // }),
    solid(),
    !process.env.NO_TYPING &&
      dts({
        bundledPackages: ["@gi-tcg/core", "@gi-tcg/typings"],
        rollupTypes: true,
      }),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
      cssFileName: "style",
    },
  },
});
