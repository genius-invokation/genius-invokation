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

import a from "@gi-tcg/assets-manager/data/action_cards";
import c from "@gi-tcg/assets-manager/data/characters";
import e from "@gi-tcg/assets-manager/data/entities";
import k from "@gi-tcg/assets-manager/data/keywords";

import type {
  ActionCardRawData,
  CharacterRawData,
  EntityRawData,
  KeywordRawData,
} from "@gi-tcg/assets-manager";

export const actionCards: ActionCardRawData[] = a as ActionCardRawData[];
export const characters: CharacterRawData[] = c as CharacterRawData[];
export const entities: EntityRawData[] = e as EntityRawData[];
export const keywords: KeywordRawData[] = k as KeywordRawData[];
