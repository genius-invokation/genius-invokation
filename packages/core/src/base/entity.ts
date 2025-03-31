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

import type { GameState } from "./state";
import type { EquipmentTag, SupportTag } from "./card";
import type { SkillDefinition } from "./skill";
import type { VersionInfo } from "./version";

export type EntityTag =
  | "disableSkill" // 禁用技能（仅角色状态）
  | "immuneControl" // 免疫冻结石化眩晕，禁用效果切人（仅角色状态）
  | "shield" // 护盾
  | "preparingSkill" // 角色将准备技能（仅角色状态）
  | "eventEffectless" // 禁用事件牌效果（仅出战状态）
  | "normalAsPlunging" // 普通攻击视为下落攻击
  | "nightsoulsBlessing" // 夜魂加持（仅角色状态）
  | EquipmentTag
  | SupportTag;

export type EntityType =
  | "status"
  | "combatStatus"
  | "equipment"
  | "support"
  | "summon";

export interface EntityDefinition {
  readonly __definition: "entities";
  readonly type: EntityType;
  readonly id: number;
  readonly version: VersionInfo;
  readonly visibleVarName: string | null;
  readonly tags: readonly EntityTag[];
  readonly hintText: string | null;
  readonly varConfigs: EntityVariableConfigs;
  readonly skills: readonly SkillDefinition[];
  readonly descriptionDictionary: DescriptionDictionary;
}

export type EntityArea =
  | {
      readonly type:
        | "pile"
        | "hands"
        | "combatStatuses"
        | "supports"
        | "summons"
        | "removedEntities";
      readonly who: 0 | 1;
    }
  | {
      readonly type: "characters";
      readonly who: 0 | 1;
      readonly characterId: number;
    };

export interface VariableConfig<ValueT extends number = number> {
  readonly initialValue: ValueT;
  readonly recreateBehavior: VariableRecreateBehavior<ValueT>;
}

export type VariableRecreateBehavior<ValueT extends number = number> =
  | {
      readonly type: "overwrite";
    }
  | {
      readonly type: "takeMax";
    }
  | {
      readonly type: "append";
      readonly appendValue: ValueT;
      readonly appendLimit: ValueT;
    };

export const USAGE_PER_ROUND_VARIABLE_NAMES = [
  "usagePerRound",
  "usagePerRound1",
  "usagePerRound2",
  "usagePerRound3",
  "usagePerRound4",
  "usagePerRound5",
  "usagePerRound6",
  "usagePerRound7",
  "usagePerRound8",
  "usagePerRound9",
  "usagePerRound10",
  "usagePerRound11",
  "usagePerRound12",
  "usagePerRound13",
  "usagePerRound14",
  "usagePerRound15",
] as const;

export type UsagePerRoundVariableNames =
  (typeof USAGE_PER_ROUND_VARIABLE_NAMES)[number];

export type EntityVariableConfigs = {
  readonly usage?: VariableConfig;
  readonly duration?: VariableConfig;
  readonly disposeWhenUsageIsZero?: VariableConfig<1>;
} & {
  readonly [x in UsagePerRoundVariableNames]?: VariableConfig;
} & {
  readonly [x: string]: VariableConfig;
};

export type VariableOfConfig<C extends Record<string, VariableConfig>> = {
  readonly [K in keyof C]: Required<C>[K] extends VariableConfig<infer T>
    ? T
    : never;
};

export type DescriptionDictionaryKey = `[${string}]`;
export type DescriptionDictionaryEntry = (st: GameState, id: number) => string;
export type DescriptionDictionary = Readonly<
  Record<DescriptionDictionaryKey, DescriptionDictionaryEntry>
>;

export function stringifyEntityArea(area: EntityArea) {
  return `${
    area.type === "characters" ? `character (${area.characterId})` : area.type
  } of player ${area.who}`;
}
