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

import path from "node:path";
import { Glob } from "bun";

const srcDir = path.join(import.meta.dirname, "../src");
const glob = new Glob("**/*.ts");

let todos = 0;
let total = 0;
for await (const filepath of glob.scan(srcDir)) {
  const text = await Bun.file(path.join(srcDir, filepath)).text();
  const todoMatches = text.match(/\/\/\s*TODO/g);
  if (todoMatches) {
    todos += todoMatches.length;
  }
  const totalMatches = text.match(/\.done\(\)/g);
  if (totalMatches) {
    total += totalMatches.length;
  }
}

console.log(`TODOs: ${todos}`);
console.log(`Total: ${total}`);
console.log(`Progress: ${((total - todos) / total * 100).toFixed(2)}%`);
