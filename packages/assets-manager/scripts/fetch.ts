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

import path from "node:path";
import {
  ALL_CATEGORIES,
  getDeckData,
  DEFAULT_ASSETS_MANAGER,
  type ActionCardRawData,
  type CharacterRawData,
  type EntityRawData,
  type KeywordRawData,
} from "#src/index";

const [actionCards, characters, entities, keywords] = (await Promise.all(
  ALL_CATEGORIES.map((category) =>
    DEFAULT_ASSETS_MANAGER.getCategory(category),
  ),
)) as [
  ActionCardRawData[],
  CharacterRawData[],
  EntityRawData[],
  KeywordRawData[],
];

const names = Object.fromEntries([
  ...[...characters, ...actionCards, ...entities, ...keywords].flatMap((e) => [
    [e.id, e.name],
    ...("skills" in e ? e.skills.map((s) => [s.id, s.name]) : []),
  ]),
]);

const deckData = getDeckData(characters, actionCards);

const shareMap = Object.fromEntries(
  [...characters, ...actionCards].map((card) => [card.shareId, card.id]),
);

const mapReplacer = (key: string, value: unknown) => {
  if (value instanceof Map) {
    return Object.fromEntries(value.entries());
  }
  return value;
};

const DESTINATION_DIR = path.resolve(import.meta.dirname, "../src/data");
const write = async (data: unknown, ...paths: string[]) => {
  const finalPath = path.resolve(DESTINATION_DIR, ...paths);
  await Bun.write(finalPath, JSON.stringify(data, mapReplacer, 2) + "\n");
  console.log(`Wrote ${finalPath}`);
};

await write(deckData, "deck.json");
await write(names, "names.json");
await write(actionCards, "action_cards.json");
await write(characters, "characters.json");
await write(entities, "entities.json");
await write(keywords, "keywords.json");
await write(shareMap, "share_id.json");
