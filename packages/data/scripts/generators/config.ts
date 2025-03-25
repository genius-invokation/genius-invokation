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
import { IS_BETA, BETA_VERSION } from "@gi-tcg/config";
import { existsSync } from "node:fs";

export const OLD_VERSION = "v5.4.0";
export const NEW_VERSION: string = IS_BETA ? BETA_VERSION : "v5.5.0";
export const SAVE_OLD_CODES = !IS_BETA;

if (SAVE_OLD_CODES && existsSync(path.resolve(import.meta.dirname, `../../src/old_versions/${OLD_VERSION}`))) {
  throw new Error("Old version already exists; you may forgot to update (OLD|NEW)_VERSION at scripts/generators/config.ts .");
}

export const BASE_PATH = path.resolve(
  import.meta.dirname,
  "../../src",
).replace(/\\/g, "/");

export const LICENSE = `// Copyright (C) 2024-2025 Guyutongxue
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

`;
