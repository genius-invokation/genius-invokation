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

import {
  CardDefinition,
  CharacterDefinition,
  EntityDefinition,
  ExtensionDefinition,
  GameData,
  Version,
} from "@gi-tcg/core";
import type { CustomData } from "@gi-tcg/assets-manager";

import getOfficialData from "@gi-tcg/data";
import { BuilderContext } from "./builder_context";

export { getOfficialData };

export class CustomDataLoader {
  private version?: Version;
  private nextId = 10_000_000;
  private customGameData: GameData[] = [];
  private customData: CustomData[] = [];

  constructor() {}

  setVersion(version: Version): this {
    this.version = version;
    return this;
  }

  loadMod(...sources: string[]): this {
    for (const src of sources) {
      const fn = new Function("BuilderContext", `"use strict";` + src);
      const ctx = new BuilderContext(() => this.nextId++);
      const param = ctx.beginRegistration();
      fn(param);
      const { gameData, customData } = ctx.endRegistration();
      this.customGameData.push(gameData);
      this.customData.push(customData);
    }
    return this;
  }

  getData(): GameData {
    const data = getOfficialData(this.version);
    const result = {
      version: data.version,
      characters: new Map<number, CharacterDefinition>(),
      cards: new Map<number, CardDefinition>(),
      entities: new Map<number, EntityDefinition>(),
      extensions: new Map<number, ExtensionDefinition>(),
    } satisfies GameData;
    for (const gameData of [data, ...this.customGameData]) {
      for (const [key, value] of gameData.characters) {
        result.characters.set(key, value);
      }
      for (const [key, value] of gameData.cards) {
        result.cards.set(key, value);
      }
      for (const [key, value] of gameData.entities) {
        result.entities.set(key, value);
      }
      for (const [key, value] of gameData.extensions) {
        result.extensions.set(key, value);
      }
    }
    return result;
  }

  getCustomData(): CustomData[] {
    return this.customData;
  }
}
