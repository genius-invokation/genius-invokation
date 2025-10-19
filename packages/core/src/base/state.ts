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
import { randomSeed } from "../random";
import type { Version } from "..";
import { versionLt } from "./version";

// 为不同层级的 state object 添加 marker symbol
export type StateKind =
  | "game"
  | "player"
  | "card"
  | "character"
  | "entity"
  | "extension";
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

export const getDefaultGameConfig = (): GameConfig => ({
  errorLevel: "strict",
  initialDiceCount: 8,
  initialHandsCount: 5,
  maxDiceCount: 16,
  maxHandsCount: 10,
  maxPileCount: 200,
  maxRoundsCount: 15,
  maxSummonsCount: 4,
  maxSupportsCount: 4,
  randomSeed: randomSeed(),
});

/**
 * 记录不同版本的核心结算差异。
 */
export interface VersionBehavior {
  /**
   * 实体重复入场时，`default` 行为。
   * @note v3.5.0 起设置为 `takeMax`，此前为 `overwrite`
   */
  readonly defaultRecreateBehavior: "takeMax" | "overwrite";

  /**
   * 带有 `injuredOnly` 的食物事件牌，是否可以对满生命值角色使用。
   * @note v6.1.0 起设置为 `true`
   */
  readonly foodOmitInjuredOnly: boolean;

  /**
   * `disposeMaxCostHands` 是否终止预览。
   * @note v6.1.0 起设置为 `true`
   */
  readonly disposeMaxCostHandsAbortPreview: boolean;
}

export const getVersionBehavior = (version: Version): VersionBehavior => ({
  defaultRecreateBehavior: versionLt(version, "v3.5.0") ? "overwrite" : "takeMax",
  // TODO: update when 6.1 out
  foodOmitInjuredOnly: true,
  disposeMaxCostHandsAbortPreview: true,
});

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
  readonly versionBehavior: VersionBehavior;
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
