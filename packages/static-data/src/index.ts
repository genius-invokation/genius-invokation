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

import a from "./data/action_cards.json"/*  with { type: "json" } */;
import c from "./data/characters.json"/*  with { type: "json" } */;
import e from "./data/entities.json"/*  with { type: "json" } */;
import k from "./data/keywords.json"/*  with { type: "json" } */;

import type {
  ActionCardRawData,
  CharacterRawData,
  EntityRawData,
  KeywordRawData,
} from "../scripts/typings";

export const actionCards: ActionCardRawData[] = a as ActionCardRawData[];
export const characters: CharacterRawData[] = c;
export const entities: EntityRawData[] = e as EntityRawData[];
export const keywords: KeywordRawData[] = k;

export type * from "../scripts/typings";
