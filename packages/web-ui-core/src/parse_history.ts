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
} from "@gi-tcg/typings";
import type {
  ApplyHistoryChild,
  DamageHistoryChild,
  EnergyHistoryChild,
  HistoryBlock,
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

  peek() {
    return this.records[0];
  }

  take() {
    const result = this.records.shift();
    return result;
  }
}

/**
 * 收集所有的 ModifyEntityVarEM。
 * - 将生命值和 Aura 与 DamageEM 合并为 DamageHistoryChild
 * - 将 Entity 的可见变量，角色的能量值、最大生命值记录为 VariableChangeHistoryChild
 */
class VariableRecorder {
  readonly visibleVarRecords = new Map<number, VariableRecord>();
  readonly healthVarRecords = new Map<number, VariableRecord>();
  readonly auraVarRecords = new Map<number, VariableRecord>();
  readonly energyVarRecords = new Map<number, VariableRecord>();
  readonly maxHealthVarRecords = new Map<number, VariableRecord>();

  readonly maxEnergies = new Map<number, number>();
  readonly visibleVarNames = new Map<number, string>();
  readonly area = new Map<number, 0 | 1>();

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
        for (const entity of player[prop]) {
          this.initializeEntity(who, entity);
        }
      }
    }
  }

  private initializeEntity(who: 0 | 1, entity: PbEntityState) {
    this.area.set(entity.id, who);
    if (entity.variableName) {
      this.visibleVarNames.set(entity.id, entity.variableName);
      this.visibleVarRecords.set(
        entity.id,
        new VariableRecord(entity.variableValue ?? 0),
      );
    }
  }

  private initializeCharacter(who: 0 | 1, character: PbCharacterState) {
    this.area.set(character.id, who);
    this.healthVarRecords.set(
      character.id,
      new VariableRecord(character.health),
    );
    this.auraVarRecords.set(character.id, new VariableRecord(character.aura));
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
      this.initializeEntity(who, entity);
    }
  }

  receive(
    varMut: ModifyEntityVarEM,
  ): VariableChangeHistoryChild | EnergyHistoryChild | null {
    const { entityId, entityDefinitionId, variableName, variableValue } =
      varMut;
    let record: VariableRecord | undefined;
    if (
      variableName === "health" &&
      (record = this.healthVarRecords.get(varMut.entityId))
    ) {
      record.set(variableValue);
      return null; // 在 composeDamage 中返回
    }
    if (
      variableName === "aura" &&
      (record = this.auraVarRecords.get(varMut.entityId))
    ) {
      record.set(variableValue);
      return null; // 在 composeDamage / composeApply 中返回
    }
    if (
      variableName === "energy" &&
      (record = this.energyVarRecords.get(varMut.entityId))
    ) {
      record.set(variableValue);
      const { oldValue = 0, newValue = 0 } = record.take() ?? {};
      return {
        type: "energy",
        who: this.area.get(entityId) ?? 0,
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
          who: this.area.get(entityId) ?? 0,
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
    const { who, entity } = mut as CreateEntityEM & { entity: PbEntityState };
    this.initializeEntity(who as 0 | 1, entity);
  }
  onNewCharacter(mut: CreateCharacterEM) {
    const { who, character } = mut as CreateCharacterEM & {
      character: PbEntityState;
    };
    this.initializeCharacter(who as 0 | 1, character);
  }

  composeDamage(dmgMut: DamageEM): DamageHistoryChild {
    const { oldValue = 0, newValue = 0 } =
      this.healthVarRecords.get(dmgMut.targetId)?.take() ?? {};
    if (dmgMut.reactionType !== PbReactionType.UNSPECIFIED) {
      return {
        type: "damage",
        who: this.area.get(dmgMut.targetId) ?? 0,
        characterDefinitionId: dmgMut.targetDefinitionId,
        oldHealth: oldValue,
        newHealth: newValue,
        damageType: dmgMut.damageType,
        oldAura,
        newAura,
        causeDefeated,
        damageValue,
        reaction,
      };
    }
  }
  composeApply(applyMut: ApplyAuraEM): ApplyHistoryChild {
    const { oldValue = 0, newValue = 0 } =
      this.auraVarRecords.get(applyMut.targetId)?.take() ?? {};
    return {
      type: "apply",
      elementType: applyMut.elementType,
      who: this.area.get(applyMut.targetId) ?? 0,
      characterDefinitionId: applyMut.targetDefinitionId,
      oldAura: oldValue,
      newAura: newValue,
    };
  }
}

export function parseToHistory(
  previousState: PbGameState | undefined,
  mutations: PbExposedMutation[],
): HistoryBlock[] {
  const result: HistoryBlock[] = [];
  let currentSkillBlock: Extract<HistoryBlock, { children: unknown[] }> | null =
    null;
  const currentDone = () => {
    if (currentSkillBlock) {
      result.push(currentSkillBlock);
    }
    currentSkillBlock = null;
  };
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
        currentDone();
        result.push({
          type: "changePhase",
          roundNumber: previousState?.roundNumber ?? 0,
          newPhase,
        });
        break;
      }
      case "resetDice": {
        // TODO
        break;
      }
      case "modifyEntityVar": {
        varRecorder.receive(m);
        break;
      }
      case "damage": {
        break;
      }
    }
  }
  throw new Error(`unimplemented`);
}
