// Copyright (C) 2024 Guyutongxue
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

import { Aura } from "@gi-tcg/typings";
import { CharacterTag } from "../base/character";
import { registerCharacter, builderWeakRefs } from "./registry";
import { CharacterHandle, PassiveSkillHandle, SkillHandle } from "./type";
import { createVariable } from "./utils";
import { VariableConfig } from "../base/entity";
import { Version, VersionInfo, DEFAULT_VERSION_INFO } from "../base/version";

class CharacterBuilder {
  private readonly _tags: CharacterTag[] = [];
  private _maxHealth = 10;
  private _maxEnergy = 3;
  private _varConfigs: Record<number, VariableConfig> = {};
  private readonly _skillIds: number[] = [];
  private _versionInfo: VersionInfo = DEFAULT_VERSION_INFO;
  constructor(private readonly id: number) {
    builderWeakRefs.add(new WeakRef(this));
  }

  since(version: Version) {
    this._versionInfo = { predicate: "since", version };
    return this;
  }
  until(version: Version) {
    this._versionInfo = { predicate: "until", version };
    return this;
  }

  tags(...tags: CharacterTag[]) {
    this._tags.push(...tags);
    return this;
  }

  skills(...skills: (SkillHandle | PassiveSkillHandle)[]) {
    this._skillIds.push(...skills);
    return this;
  }

  health(value: number) {
    this._maxHealth = value;
    return this;
  }
  energy(value: number) {
    this._maxEnergy = value;
    return this;
  }

  done(): CharacterHandle {
    registerCharacter({
      __definition: "characters",
      type: "character",
      id: this.id,
      version: this._versionInfo,
      tags: this._tags,
      varConfigs: {
        ...this._varConfigs,
        health: createVariable(this._maxHealth),
        energy: createVariable(0),
        alive: createVariable(1),
        aura: createVariable(Aura.None),
        maxHealth: createVariable(this._maxHealth),
        maxEnergy: createVariable(this._maxEnergy),
      },
      skillIds: this._skillIds,
    });
    return this.id as CharacterHandle;
  }
}

export function character(id: number) {
  return new CharacterBuilder(id);
}
