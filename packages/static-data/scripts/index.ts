// Copyright (C) 2024 theBowja, Guyutongxue
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

import { collateActionCards } from "./action_cards";
import { collateCharacters } from "./characters";
import { collateEntities } from "./entities";
import { collateKeywords } from "./keywords";
import { config } from "./config";
import { stringify as stringifyLossless } from "lossless-json";
import fs from "node:fs";

const USE_ES_JSON = true;
const stringify = USE_ES_JSON ? JSON.stringify : stringifyLossless;

export async function exportData(
  filename: string,
  langCode: string,
  collateFunc: (langCode: string) => any,
) {
  const data = await collateFunc(langCode);
  fs.mkdirSync(`${config.output}`, { recursive: true });
  const content = stringify(data, void 0, 2)!;
  fs.writeFileSync(`${config.output}/${filename}.json`, content);
  if (content.search("undefined") !== -1) {
    console.warn("undefined found in " + filename);
  }
}

await exportData("characters", "CHS", collateCharacters);
await exportData("action_cards", "CHS", collateActionCards);
await exportData("entities", "CHS", collateEntities);
await exportData("keywords", "CHS", collateKeywords);
