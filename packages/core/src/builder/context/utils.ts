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

/** This file provides a wrapper of getEntityById/getEntityArea with getRaw */

import type { CardState, CharacterState, EntityState, GameState, StateSymbol } from "../../base/state";
import { getRaw } from "./reactive";
import {
  getEntityArea as getEntityAreaOriginal,
  getEntityById as getEntityByIdOriginal,
} from "../../utils";
import type { ExEntityType } from "../type";

export function getEntityArea(state: GameState, id: number) {
  return getEntityAreaOriginal(getRaw(state), id);
}

export function getEntityById(state: GameState, id: number) {
  return getEntityByIdOriginal(getRaw(state), id);
}

export {
  elementOfCharacter,
  getActiveCharacterIndex,
  nationOfCharacter,
  weaponOfCharacter,
  allSkills,
  diceCostOfCard,
  isCharacterInitiativeSkill,
  sortDice,
} from "../../utils";


export type CharacterStateBase = Omit<CharacterState, StateSymbol>;
export type EntityStateBase = Omit<EntityState, StateSymbol>;
export type CardStateBase = Omit<CardState, StateSymbol>;
export type AnyStateBase = CharacterStateBase | EntityStateBase | CardStateBase;
export type ExEntityStateBase<TypeT extends ExEntityType> = TypeT extends "character"
  ? CharacterStateBase
  : TypeT extends "card"
    ? CardStateBase
    : EntityStateBase;
