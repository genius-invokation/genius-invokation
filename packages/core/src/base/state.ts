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

import { DiceType } from "@gi-tcg/typings";

import type { CardDefinition, CardType, CardTag } from "./card";
import type {
  CharacterDefinition,
  CharacterTag,
  CharacterVariableConfigs,
} from "./character";
import type {
  EntityDefinition,
  EntityTag,
  EntityType,
  EntityVariableConfigs,
  VariableOfConfig,
} from "./entity";
import type { GameData } from "../builder/registry";
import type { ExtensionDefinition } from "./extension";
import type {
  SkillDefinition,
  InitiativeSkillDefinition,
  TriggeredSkillDefinition,
} from "./skill";

// 为不同层级的 state object 添加 marker symbol
export type StateKind = "game" | "player" | "card" | "character" | "entity" | "extension";
export const StateSymbol: unique symbol = Symbol("GiTcgCoreState");
export type StateSymbol = typeof StateSymbol;

export type ErrorLevel = "strict" | "toleratePreview" | "skipPhase";

export interface GameConfig {
  readonly errorLevel: ErrorLevel;
  readonly randomSeed: number;
  readonly initialHandsCount: number;
  readonly maxHandsCount: number;
  readonly maxPileCount: number;
  readonly maxRoundsCount: number;
  readonly maxSupportsCount: number;
  readonly maxSummonsCount: number;
  readonly initialDiceCount: number;
  readonly maxDiceCount: number;
}

export interface IteratorState {
  readonly random: number;
  readonly id: number;
}

export type PhaseType =
  | "initActives"
  | "initHands"
  | "roll"
  | "action"
  | "end"
  | "gameEnd";

export interface GameState {
  readonly [StateSymbol]: "game";
  readonly data: GameData;
  readonly config: GameConfig;
  readonly iterators: IteratorState;
  readonly phase: PhaseType;
  readonly roundNumber: number;
  readonly currentTurn: 0 | 1;
  readonly winner: 0 | 1 | null;
  readonly players: readonly [PlayerState, PlayerState];
  readonly extensions: readonly ExtensionState[];
  readonly delayingEventArgs: readonly (readonly [string, unknown])[];
}

export interface PlayerState {
  readonly [StateSymbol]: "player";
  readonly who: 0 | 1;
  readonly initialPile: readonly CardDefinition[];
  readonly pile: readonly CardState[];
  readonly activeCharacterId: number;
  readonly hands: readonly CardState[];
  readonly characters: readonly CharacterState[];
  readonly combatStatuses: readonly EntityState[];
  readonly supports: readonly EntityState[];
  readonly summons: readonly EntityState[];
  readonly dice: readonly DiceType[];
  readonly declaredEnd: boolean;
  readonly hasDefeated: boolean;
  readonly canCharged: boolean;
  readonly canPlunging: boolean;
  readonly legendUsed: boolean;
  readonly skipNextTurn: boolean;
  /**
   * 每回合使用技能列表。
   * 键为技能发起者的角色定义 id，值为该定义下使用过的技能 id 列表
   */
  readonly roundSkillLog: ReadonlyMap<number, number[]>;
  readonly removedEntities: readonly AnyState[];
}

export interface CardState {
  readonly [StateSymbol]: "card";
  readonly id: number;
  readonly definition: CardDefinition;
  readonly variables: Record<string, undefined>;
}

export interface CharacterState {
  readonly [StateSymbol]: "character";
  readonly id: number;
  readonly definition: CharacterDefinition;
  readonly entities: readonly EntityState[];
  readonly variables: CharacterVariables;
}

export type CharacterVariables = VariableOfConfig<CharacterVariableConfigs>;

export interface EntityState {
  readonly [StateSymbol]: "entity";
  readonly id: number;
  /** 支援牌、装备牌从手牌打出时的手牌 id */
  readonly fromCardId: number | null;
  readonly definition: EntityDefinition;
  readonly variables: EntityVariables;
}

export type EntityVariables = VariableOfConfig<EntityVariableConfigs>;

export type AnyState = CharacterState | EntityState | CardState;

export interface ExtensionState {
  readonly [StateSymbol]: "extension";
  readonly definition: ExtensionDefinition;
  readonly state: unknown;
}

export function stringifyState(st: Omit<AnyState, StateSymbol>): string {
  let type: string;
  if (st.definition.__definition === "cards") {
    type = "card";
  } else {
    type = st.definition.type;
  }
  return `[${type}:${st.definition.id}](${st.id})`;
}

export type {
  GameData,
  CharacterDefinition,
  CharacterTag,
  EntityDefinition,
  EntityType,
  EntityTag,
  CardDefinition,
  CardType,
  CardTag,
  ExtensionDefinition,
  SkillDefinition,
  InitiativeSkillDefinition,
  TriggeredSkillDefinition,
};
