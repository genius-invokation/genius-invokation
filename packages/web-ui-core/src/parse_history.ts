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
  PbCardArea,
  PbEntityArea,
  SwitchActiveAction,
  SwitchActiveEM,
  PbPlayerFlag,
  Reaction,
  PbPlayerStatus,
  PbSwitchActiveFromAction,
  PbRemoveCardReason,
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
type EntityType =
  | "equipment"
  | "status"
  | "combatStatus"
  | "summon"
  | "support";

/**
 * 收集所有的 ModifyEntityVarEM，以记录 VariableChangeHistoryChild
 * 等需要使用的旧值
 */
class StateRecorder {
  readonly visibleVarRecords = new Map<number, VariableRecord>();
  readonly energyVarRecords = new Map<number, VariableRecord>();
  readonly maxHealthVarRecords = new Map<number, VariableRecord>();

  readonly maxEnergies = new Map<number, number>();
  readonly entityInitStates = new Map<
    number,
    PbEntityState & { type: EntityType }
  >();
  readonly area = new Map<number, Area>();
  readonly activeCharacterDefinitionIds = [void 0, void 0] as [
    number | undefined,
    number | undefined,
  ];
  readonly isChoosingActive = [false, false] as [boolean, boolean];

  constructor(private readonly previousState: PbGameState | undefined) {
    if (!previousState) {
      return;
    }
    for (const who of [0, 1] as const) {
      const player = previousState.player[who];
      for (const ch of player.character) {
        if (ch.id === player.activeCharacterId) {
          this.activeCharacterDefinitionIds[who] = ch.definitionId;
        }
        this.initializeCharacter(who, ch);
      }
      for (const prop of ["combatStatus", "summon", "support"] as const) {
        const area = { who, masterDefinitionId: null };
        for (const entity of player[prop]) {
          this.initializeEntity(area, entity, prop);
        }
      }
    }
  }

  private initializeEntity(
    area: Area,
    entity: PbEntityState,
    entityType: EntityType,
  ) {
    this.area.set(entity.id, area);
    if (entity.variableName) {
      this.entityInitStates.set(entity.id, { ...entity, type: entityType });
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
      this.initializeEntity(
        area,
        entity,
        entity.equipment ? "equipment" : "status",
      );
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

    if (this.entityInitStates.get(entityId)?.variableName === variableName) {
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

  getMasterDefinitionId(entityId: number) {
    const { who = 0, masterDefinitionId = null } =
      this.area.get(entityId) ?? {};
    console.log(this.entityInitStates.get(entityId));
    if (this.entityInitStates.get(entityId)?.type === "combatStatus") {
      return this.activeCharacterDefinitionIds[who];
    }
    return masterDefinitionId ?? void 0;
  }

  onNewEntity(mut: CreateEntityEM) {
    const { who, where, masterCharacterId, entity } = mut as CreateEntityEM & {
      entity: PbEntityState;
    };
    let masterDefinitionId: number | null = null;
    if (masterCharacterId) {
      masterDefinitionId =
        this.area.get(masterCharacterId)?.masterDefinitionId ?? null;
    }
    let entityType:
      | "equipment"
      | "status"
      | "combatStatus"
      | "summon"
      | "support";
    if (where === PbEntityArea.CHARACTER) {
      if (entity.equipment) {
        entityType = "equipment";
      } else {
        entityType = "status";
      }
    } else if (where === PbEntityArea.COMBAT_STATUS) {
      entityType = "combatStatus";
    } else if (where === PbEntityArea.SUMMON) {
      entityType = "summon";
    } else if (where === PbEntityArea.SUPPORT) {
      entityType = "support";
    } else {
      return;
    }
    this.initializeEntity(
      { who: who as 0 | 1, masterDefinitionId },
      entity,
      entityType,
    );
  }
  onNewCharacter(mut: CreateCharacterEM) {
    const { who, character } = mut as CreateCharacterEM & {
      character: PbEntityState;
    };
    this.initializeCharacter(who as 0 | 1, character);
  }
  onSwitchActive(mut: SwitchActiveEM) {
    this.activeCharacterDefinitionIds[mut.who as 0 | 1] =
      mut.characterDefinitionId;
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
  const stateRecorder = new StateRecorder(previousState);

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
        const child = stateRecorder.receive(m);
        if (child) {
          children.push(child);
        }
        break;
      }
      case "applyAura": {
        children.push({
          type: "apply",
          who: stateRecorder.area.get(m.targetId)?.who ?? null,
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
          who: stateRecorder.area.get(m.targetId)?.who ?? null,
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
        children.push({
          type: "createCard",
          who: m.who as 0 | 1,
          cardDefinitionId: m.card!.definitionId,
          target: m.to === PbCardArea.HAND ? "hands" : "pile",
        });
        break;
      }
      case "createCharacter": {
        stateRecorder.onNewCharacter(m);
        break;
      }
      case "createEntity": {
        stateRecorder.onNewEntity(m);
        const { definitionId, id } = m.entity!;
        const { type } = stateRecorder.entityInitStates.get(id)!;
        children.push({
          type: "createEntity",
          who: m.who as 0 | 1,
          masterDefinitionId: stateRecorder.getMasterDefinitionId(id),
          entityDefinitionId: definitionId,
          entityType: type,
        });
        break;
      }
      case "removeCard": {
        const definitionId = m.card!.definitionId;
        if (
          m.reason === PbRemoveCardReason.PLAY ||
          m.reason === PbRemoveCardReason.PLAY_NO_EFFECT
        ) {
          mainBlock = {
            type: "triggered",
            who: m.who as 0 | 1,
            masterOrCallerDefinitionId: definitionId,
            callerOrSkillDefinitionId: definitionId,
            children:
              m.reason === PbRemoveCardReason.PLAY_NO_EFFECT
                ? [
                    {
                      type: "forbidCard",
                      who: m.who as 0 | 1,
                      cardDefinitionId: definitionId,
                    },
                  ]
                : [],
          };
        } else if (m.reason !== PbRemoveCardReason.HANDS_OVERFLOW) {
          children.push({
            type: "disposeCard",
            who: m.who as 0 | 1,
            cardDefinitionId: definitionId,
          });
        }
        break;
      }
      case "removeEntity": {
        const { definitionId, id } = m.entity!;
        const area = stateRecorder.area.get(id);
        const { type } = stateRecorder.entityInitStates.get(id)!;
        children.push({
          type: "removeEntity",
          who: area?.who ?? 0,
          masterDefinitionId: stateRecorder.getMasterDefinitionId(id),
          entityDefinitionId: definitionId,
          entityType: type,
        });
        break;
      }
      case "setPlayerFlag": {
        if (m.flagName === PbPlayerFlag.DECLARED_END) {
          result.push({
            type: "action",
            who: m.who as 0 | 1,
            actionType: "declareEnd",
          });
        }
        break;
      }
      case "switchActive": {
        stateRecorder.onSwitchActive(m);
        const who = m.who as 0 | 1;
        console.log(m);
        if (m.fromAction === PbSwitchActiveFromAction.NONE) {
          children.push({
            type: "switchActive",
            who,
            characterDefinitionId: m.characterDefinitionId,
            isOverloaded: m.viaSkillDefinitionId === Reaction.Overloaded,
          });
        } else if (stateRecorder.isChoosingActive[who]) {
          stateRecorder.isChoosingActive[who] = false;
          result.push({
            type: "switchActive",
            who,
            characterDefinitionId: m.characterDefinitionId,
            how:
              (previousState?.phase ?? PbPhaseType.ACTION) < PbPhaseType.ACTION
                ? "init"
                : "choose",
            children: [],
          });
        } else {
          result.push({
            type: "switchActive",
            who: m.who as 0 | 1,
            characterDefinitionId: m.characterDefinitionId,
            children: [],
            how: "switch",
          });
        }
        break;
      }
      case "transferCard": {
        // TODO
        break;
      }
      case "transformDefinition": {
        const area = stateRecorder.area.get(m.entityId);
        const state = stateRecorder.entityInitStates.get(m.entityId);
        const oldDefinitionId = state?.definitionId ?? 0;
        if (state) {
          state.definitionId = m.newEntityDefinitionId;
        }
        children.push(
          {
            type: "transformDefinition",
            who: area?.who ?? 0,
            cardDefinitionId: oldDefinitionId,
            stage: "old",
          },
          {
            type: "transformDefinition",
            who: area?.who ?? 0,
            cardDefinitionId: m.newEntityDefinitionId,
            stage: "new",
          },
        );
        break;
      }
      case "skillUsed": {
        if (m.skillType === PbSkillType.TRIGGERED) {
          mainBlock = {
            type: "triggered",
            who: m.who as 0 | 1,
            masterOrCallerDefinitionId:
              stateRecorder.area.get(m.callerId)?.masterDefinitionId ??
              m.callerDefinitionId,
            callerOrSkillDefinitionId: m.callerDefinitionId,
            children: [],
          };
        } else if (m.skillType === PbSkillType.CHARACTER_PASSIVE) {
          mainBlock = {
            type: "triggered",
            who: m.who as 0 | 1,
            masterOrCallerDefinitionId: m.callerDefinitionId,
            callerOrSkillDefinitionId: Math.floor(m.skillDefinitionId),
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
      case "playerStatusChange": {
        if (m.status === PbPlayerStatus.ACTING) {
          result.push({
            type: "action",
            who: m.who as 0 | 1,
            actionType: "action",
          });
        } else if (m.status === PbPlayerStatus.CHOOSING_ACTIVE) {
          stateRecorder.isChoosingActive[m.who as 0 | 1] = true;
        }
        break;
      }
      case "switchTurn":
      case "setWinner":
      case "swapCharacterPosition": {
        break;
      }
      default: {
        const _: never = m;
        continue;
      }
    }
  }
  if (mainBlock) {
    mainBlock.children.push(
      ...children.map((child) => ({
        ...child,
        who: child.who ?? mainBlock.who,
      })),
    );
    result.push(mainBlock);
  }
  return result;
}
