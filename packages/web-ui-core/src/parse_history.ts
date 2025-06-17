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
  CreateCharacterEM,
  CreateEntityEM,
  DamageEM,
  ApplyAuraEM,
  flattenPbOneof,
  ModifyEntityVarEM,
  PbCharacterState,
  PbEntityState,
  PbPhaseType,
  PbReactionType,
  type PbExposedMutation,
  type PbGameState,
  PbSkillType,
} from "@gi-tcg/typings";
import type {
  ApplyHistoryChild,
  DamageHistoryChild,
  EnergyHistoryChild,
  HistoryBlock,
  HistoryChildren,
  UseSkillHistoryBlock,
  VariableChangeHistoryChild,
} from "./history";

interface VariableRecordEntry {
  oldValue: number;
  newValue: number;
}

class VariableRecord {
  readonly records: VariableRecordEntry[] = [];
  constructor(private readonly initValue = 0) {}

  set(current: number) {
    const oldValue = this.records.at(-1)?.newValue ?? this.initValue;
    this.records.push({
      oldValue,
      newValue: current,
    });
  }

  take() {
    const result = this.records.shift();
    return result ?? null;
  }
}

type Area = { who: 0 | 1; masterDefinitionId: number | null };

/**
 * 收集所有的 ModifyEntityVarEM，以记录 VariableChangeHistoryChild
 * 等需要使用的旧值
 */
class VariableRecorder {
  readonly visibleVarRecords = new Map<number, VariableRecord>();
  readonly energyVarRecords = new Map<number, VariableRecord>();
  readonly maxHealthVarRecords = new Map<number, VariableRecord>();

  readonly maxEnergies = new Map<number, number>();
  readonly visibleVarNames = new Map<number, string>();
  readonly area = new Map<number, Area>();

  constructor(private readonly previousState: PbGameState | undefined) {
    if (!previousState) {
      return;
    }
    for (const who of [0, 1] as const) {
      const player = previousState.player[who];
      for (const ch of player.character) {
        this.initializeCharacter(who, ch);
      }
      for (const prop of ["combatStatus", "summon", "support"] as const) {
        const area = { who, masterDefinitionId: null };
        for (const entity of player[prop]) {
          this.initializeEntity(area, entity);
        }
      }
    }
  }

  private initializeEntity(area: Area, entity: PbEntityState) {
    this.area.set(entity.id, area);
    if (entity.variableName) {
      this.visibleVarNames.set(entity.id, entity.variableName);
      this.visibleVarRecords.set(
        entity.id,
        new VariableRecord(entity.variableValue ?? 0),
      );
    }
  }

  private initializeCharacter(who: 0 | 1, character: PbCharacterState) {
    const area = { who, masterDefinitionId: character.definitionId };
    this.area.set(character.id, area);
    this.energyVarRecords.set(
      character.id,
      new VariableRecord(character.energy),
    );
    this.maxHealthVarRecords.set(
      character.id,
      new VariableRecord(character.maxHealth),
    );
    this.maxEnergies.set(character.id, character.maxEnergy);
    for (const entity of character.entity) {
      this.initializeEntity(area, entity);
    }
  }

  receive(
    varMut: ModifyEntityVarEM,
  ): VariableChangeHistoryChild | EnergyHistoryChild | null {
    const { entityId, entityDefinitionId, variableName, variableValue } =
      varMut;
    let record: VariableRecord | undefined;
    if (
      variableName === "energy" &&
      (record = this.energyVarRecords.get(varMut.entityId))
    ) {
      record.set(variableValue);
      const { oldValue = 0, newValue = 0 } = record.take() ?? {};
      return {
        type: "energy",
        who: this.area.get(entityId)?.who ?? 0,
        characterDefinitionId: entityDefinitionId,
        oldEnergy: oldValue,
        newEnergy: newValue,
      };
    }

    if (this.visibleVarNames.get(entityId) === variableName) {
      const record = this.visibleVarRecords.get(entityId);
      if (record) {
        record.set(variableValue);
        const { oldValue = 0, newValue = 0 } = record.take() ?? {};
        return {
          type: "variableChange",
          who: this.area.get(entityId)?.who ?? 0,
          cardDefinitionId: entityDefinitionId,
          variableName,
          oldValue,
          newValue,
        };
      }
    }
    return null;
  }

  onNewEntity(mut: CreateEntityEM) {
    const { who, masterCharacterId, entity } = mut as CreateEntityEM & {
      entity: PbEntityState;
    };
    let masterDefinitionId: number | null = null;
    if (masterCharacterId) {
      masterDefinitionId =
        this.area.get(masterCharacterId)?.masterDefinitionId ?? null;
    }
    this.initializeEntity({ who: who as 0 | 1, masterDefinitionId }, entity);
  }
  onNewCharacter(mut: CreateCharacterEM) {
    const { who, character } = mut as CreateCharacterEM & {
      character: PbEntityState;
    };
    this.initializeCharacter(who as 0 | 1, character);
  }
}

export function parseToHistory(
  previousState: PbGameState | undefined,
  mutations: PbExposedMutation[],
): HistoryBlock[] {
  const result: HistoryBlock[] = [];
  let roundNumber = previousState?.roundNumber ?? 0;
  let mainBlock: Extract<HistoryBlock, { children: unknown }> | null = null;
  type LossChildrenImpl<T> = T extends any
    ? { [K in Exclude<keyof T, "who">]: T[K] } & { who: 0 | 1 | null }
    : never;
  type LooseChildren = LossChildrenImpl<HistoryChildren>;
  const children: LooseChildren[] = [];
  const varRecorder = new VariableRecorder(previousState);
  for (const pbm of mutations) {
    const m = flattenPbOneof(pbm.mutation!);
    switch (m.$case) {
      case "changePhase": {
        const newPhase = (
          {
            [PbPhaseType.INIT_HANDS]: "initHands",
            [PbPhaseType.INIT_ACTIVES]: "initActives",
            [PbPhaseType.ACTION]: "action",
            [PbPhaseType.END]: "end",
            [PbPhaseType.ROLL]: null,
            [PbPhaseType.GAME_END]: null,
          } as const
        )[m.newPhase];
        if (!newPhase) {
          continue;
        }
        result.push({
          type: "changePhase",
          roundNumber,
          newPhase,
        });
        break;
      }
      case "resetDice": {
        // TODO
        break;
      }
      case "modifyEntityVar": {
        const child = varRecorder.receive(m);
        if (child) {
          children.push(child);
        }
        break;
      }
      case "applyAura": {
        children.push({
          type: "apply",
          who: null,
          characterDefinitionId: m.targetDefinitionId,
          elementType: m.elementType,
          reaction:
            m.reactionType === PbReactionType.UNSPECIFIED
              ? void 0
              : m.reactionType,
          oldAura: m.oldAura,
          newAura: m.newAura,
        });
        break;
      }
      case "damage": {
        children.push({
          type: "damage",
          who: varRecorder.area.get(m.targetId)?.who ?? null,
          characterDefinitionId: m.targetDefinitionId,
          damageType: m.damageType,
          damageValue: m.value,
          causeDefeated: m.causeDefeated,
          reaction:
            m.reactionType === PbReactionType.UNSPECIFIED
              ? void 0
              : m.reactionType,
          oldAura: m.oldAura,
          newAura: m.newAura,
          newHealth: m.newHealth,
          oldHealth: m.oldHealth,
        });
        break;
      }
      case "createCard": {
        // TODO
        break;
      }
      case "createCharacter": {
        varRecorder.onNewCharacter(m);
        break;
      }
      case "createEntity": {
        // TODO
        varRecorder.onNewEntity(m);
        break;
      }
      case "removeCard": {
        // TODO
        break;
      }
      case "removeEntity": {
        // TODO
        break;
      }
      case "setPlayerFlag": {
        // TODO
        break;
      }
      case "switchActive": {
        // TODO
        break;
      }
      case "transferCard": {
        // TODO
        break;
      }
      case "transformDefinition": {
        // TODO
        break;
      }
      case "skillUsed": {
        if (m.skillType === PbSkillType.TRIGGERED) {
          mainBlock = {
            type: "triggered",
            who: m.who as 0 | 1,
            masterOrCallerDefinitionId:
              varRecorder.area.get(m.callerId)?.masterDefinitionId ??
              m.callerDefinitionId,
            callerOrSkillDefinitionId: m.callerDefinitionId,
            children: [],
          };
        } else if (m.skillType === PbSkillType.CHARACTER_PASSIVE) {
          mainBlock = {
            type: "triggered",
            who: m.who as 0 | 1,
            masterOrCallerDefinitionId: m.callerDefinitionId,
            callerOrSkillDefinitionId: m.skillDefinitionId,
            children: [],
          };
        } else {
          const SKILL_TYPE_MAP = {
            [PbSkillType.NORMAL]: "normal",
            [PbSkillType.ELEMENTAL]: "elemental",
            [PbSkillType.BURST]: "burst",
            [PbSkillType.TECHNIQUE]: "technique",
          } as const;
          mainBlock = {
            type: "useSkill",
            who: m.who as 0 | 1,
            callerDefinitionId: m.callerDefinitionId,
            skillDefinitionId: m.skillDefinitionId,
            skillType: SKILL_TYPE_MAP[m.skillType],
            children: [],
          };
        }
        break;
      }
      case "stepRound": {
        roundNumber++;
        break;
      }
      case "switchTurn":
      case "setWinner":
      case "swapCharacterPosition":
      case "playerStatusChange": {
        break;
      }
      default: {
        const _: never = m;
        continue;
      }
    }
  }
  if (mainBlock) {
    mainBlock.children = children.map((child) => ({
      ...child,
      who: child.who ?? mainBlock.who,
    }));
    result.push(mainBlock);
  }
  return result;
}
