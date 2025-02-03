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

import type { EntityState, EntityVariables } from "../../base/state";
import { GiTcgDataError } from "../../error";
import {
  type EntityArea,
  type EntityDefinition,
  USAGE_PER_ROUND_VARIABLE_NAMES,
} from "../../base/entity";
import { getEntityArea, getEntityById } from "../../utils";
import { Character } from "./character";
import type { ContextMetaBase, SkillContext } from "./skill";

export class Entity<Meta extends ContextMetaBase> {
  private readonly _area: EntityArea;
  constructor(
    private readonly skillContext: SkillContext<Meta>,
    public readonly id: number,
  ) {
    this._area = getEntityArea(skillContext.state, id);
  }

  get state(): EntityState {
    return getEntityById(this.skillContext.state, this.id) as EntityState;
  }
  get definition(): EntityDefinition {
    return this.state.definition;
  }
  get area(): EntityArea {
    return this._area;
  }
  get who() {
    return this._area.who;
  }
  isMine() {
    return this.area.who === this.skillContext.callerArea.who;
  }
  getVariable<Name extends string>(
    name: Name,
  ): NonNullable<EntityVariables[Name]> {
    return this.state.variables[name];
  }

  master() {
    if (this._area.type !== "characters") {
      throw new GiTcgDataError("master() expect a character area");
    }
    return new Character<Meta>(this.skillContext, this._area.characterId);
  }

  setVariable(prop: string, value: number) {
    this.skillContext.setVariable(prop, value, this.state);
  }
  addVariable(prop: string, value: number) {
    this.skillContext.addVariable(prop, value, this.state);
  }
  addVariableWithMax(prop: string, value: number, maxLimit: number) {
    this.skillContext.addVariableWithMax(prop, value, maxLimit, this.state);
  }
  consumeUsage(count = 1) {
    this.skillContext.consumeUsage(count, this.state);
  }
  resetUsagePerRound() {
    for (const [name, cfg] of Object.entries(
      this.state.definition.varConfigs,
    )) {
      if (
        (USAGE_PER_ROUND_VARIABLE_NAMES as readonly string[]).includes(name)
      ) {
        this.setVariable(name, cfg.initialValue);
      }
    }
  }
  dispose() {
    this.skillContext.dispose(this.state);
  }
}

type EntityMutativeProps =
  | "setVariable"
  | "addVariable"
  | "addVariableWithMax"
  | "consumeUsage"
  | "resetUsagePerRound"
  | "dispose";

export type TypedEntity<Meta extends ContextMetaBase> =
  Meta["readonly"] extends true
    ? Omit<Entity<Meta>, EntityMutativeProps>
    : Entity<Meta>;
