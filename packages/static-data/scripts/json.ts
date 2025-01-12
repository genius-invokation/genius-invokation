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

import { readFileSync } from "node:fs";
import { isSafeNumber, parse } from "lossless-json";

export function customNumberParser(value: string) {
  return isSafeNumber(value) ? parseFloat(value) : BigInt(value);
}

const cache: Record<string, any> = {};
export function readJson(path: string) {
  return (
    cache[path] ??
    (cache[path] = parse(
      readFileSync(path, "utf8"),
      void 0,
      customNumberParser,
    ))
  );
}
