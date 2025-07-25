// Copyright (C) 2025 Guyutongxue
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

import { Glob } from "bun";
import path from "node:path";
import { parse, ParseResult } from "./parser";
import { fileURLToPath } from "node:url";
import { analyzeExport } from "./analyzer";

const base = fileURLToPath(new URL("../../data/src", import.meta.url).href);

const parsedFiles: ParseResult[] = [];

const parsingPromises: Promise<void>[] = [];
for await (const file of new Glob("**/*.ts").scan(base)) {
  const filepath = path.join(base, file);
  parsingPromises.push((async () => {
    const content = await Bun.file(filepath).text();
    const result = parse(filepath, content);
    if (result.chainCalls.length > 0) {
      parsedFiles.push(result);
    }
  })());
}
await Promise.all(parsingPromises);


import * as ts from "typescript";
const exports = analyzeExport(parsedFiles);
