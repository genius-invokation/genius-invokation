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

export { character } from "./character";
export { skill } from "./skill";
export { card } from "./card";
export { summon, status, combatStatus } from "./entity";
export { extension } from "./extension";
export {
  beginRegistration,
  endRegistration,
  type GameData,
  type GameDataGetter,
} from "./registry";
export type {
  CardHandle,
  CharacterHandle,
  CombatStatusHandle,
  EntityHandle,
  EquipmentHandle,
  SkillHandle,
  StatusHandle,
  SummonHandle,
  SupportHandle,
  PassiveSkillHandle,
  ExtensionHandle,
} from "./type";
export { DiceType, DamageType, Aura, Reaction } from "@gi-tcg/typings";
export type { CharacterState, CardState, EntityState } from "../base/state";

export { diceCostOfCard } from "../utils";
export { flip, pair } from "@gi-tcg/utils";

// INTERNAL exports
// 为其他包提供一些内部接口，如 @gi-tcg/test, @gi-tcg/data-vscode-ext

import { builderWeakRefs } from "./registry";
import { CardBuilder } from "./card";
import {
  TriggeredSkillBuilder,
  InitiativeSkillBuilder,
  TechniqueBuilder,
} from "./skill";
import { EntityBuilder } from "./entity";
import { CharacterBuilder } from "./character";
import { ExtensionBuilder } from "./extension";
import { SkillContext } from "./context/skill";
import { EVENT_MAP } from "../base/skill";

export const internal = {
  builderWeakRefs,
  CardBuilder,
  EntityBuilder,
  CharacterBuilder,
  TriggeredSkillBuilder,
  InitiativeSkillBuilder,
  TechniqueBuilder,
  ExtensionBuilder,
  SkillContext,
  EVENT_MAP,
};
