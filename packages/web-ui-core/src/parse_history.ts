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
  type CreateCharacterEM,
  type CreateEntityEM,
  flattenPbOneof,
  type ModifyEntityVarEM,
  PbCharacterState,
  PbEntityState,
  PbPhaseType,
  PbReactionType,
  type PbExposedMutation,
  type PbGameState,
  PbSkillType,
  PbCardArea,
  PbEntityArea,
  type SwitchActiveEM,
  PbPlayerFlag,
  Reaction,
  PbPlayerStatus,
  PbSwitchActiveFromAction,
  PbRemoveCardReason,
  PbDamageType,
  PbHealKind,
  PbTransferCardReason,
  DiceType,
  type ResetDiceEM,
  PbResetDiceReason,
  CreateCardEM,
} from "@gi-tcg/typings";
import type {
  AbsorbDiceHistoryChild,
  ConvertDiceHistoryChild,
  EnergyHistoryChild,
  GenerateDiceHistoryChild,
  HistoryBlock,
  HistoryChildren,
  HistoryDetailBlock,
  IncreaseMaxHealthHistoryChild,
  UseSkillHistoryBlock,
  VariableChangeHistoryChild,
} from "./history";
import { flip } from "@gi-tcg/utils";

export interface HistoryData {
  blocks: HistoryBlock[];
  currentIndent: number;
}

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
    const result = this.records.at(-1);
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
  readonly dice: [DiceType[], DiceType[]] = [[], []];

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
      for (const card of [...player.pileCard, ...player.handCard]) {
        this.area.set(card.id, { who, masterDefinitionId: null });
      }
      this.dice[who] = [...player.dice] as DiceType[];
    }
  }

  private initializeEntity(
    area: Area,
    entity: PbEntityState,
    entityType: EntityType,
  ) {
    this.area.set(entity.id, area);
    this.entityInitStates.set(entity.id, { ...entity, type: entityType });
    if (entity.variableName) {
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

  receiveModifyVar(
    varMut: ModifyEntityVarEM,
  ):
    | VariableChangeHistoryChild
    | IncreaseMaxHealthHistoryChild
    | EnergyHistoryChild
    | null {
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
    if (
      variableName === "maxHealth" &&
      (record = this.maxHealthVarRecords.get(varMut.entityId))
    ) {
      record.set(variableValue);
      const { oldValue = 0, newValue = 0 } = record.take() ?? {};
      return {
        type: "increaseMaxHealth",
        who: this.area.get(entityId)?.who ?? 0,
        characterDefinitionId: entityDefinitionId,
        oldMaxHealth: oldValue,
        newMaxHealth: newValue,
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

  receiveResetDice(
    mut: ResetDiceEM,
  ):
    | AbsorbDiceHistoryChild[]
    | ConvertDiceHistoryChild[]
    | GenerateDiceHistoryChild[] {
    const new_ = [...mut.dice] as DiceType[];
    const old = this.dice[mut.who as 0 | 1];
    this.dice[mut.who as 0 | 1] = new_;

    switch (mut.reason) {
      case PbResetDiceReason.CONVERT:
      case PbResetDiceReason.ELEMENTAL_TUNING: {
        const target = mut.conversionTargetHint as DiceType;
        if (!target) {
          return [];
        }
        const oldCount = old.filter((d) => d === target).length;
        const newCount = new_.filter((d) => d === target).length;
        const diceCount = newCount - oldCount;
        return [
          {
            type: "convertDice",
            who: mut.who as 0 | 1,
            diceType: target,
            count: diceCount,
            isTuning: mut.reason === PbResetDiceReason.ELEMENTAL_TUNING,
          },
        ];
      }
      case PbResetDiceReason.GENERATE: {
        const generated: DiceType[] = [];
        for (const d of new_) {
          const idx = old.indexOf(d);
          if (idx === -1) {
            generated.push(d);
          } else {
            old.splice(idx, 1);
          }
        }
        return Map.groupBy(generated, (i) => i)
          .entries()
          .toArray()
          .map(
            ([d, arr]): GenerateDiceHistoryChild => ({
              type: "generateDice",
              who: mut.who as 0 | 1,
              diceType: d,
              diceCount: arr.length,
            }),
          );
      }
      case PbResetDiceReason.ABSORB: {
        const diceCount = old.length - new_.length;
        return [
          {
            type: "absorbDice",
            who: mut.who as 0 | 1,
            diceCount,
          },
        ];
      }
      default: {
        return [];
      }
    }
  }

  getMasterDefinitionId(entityId: number) {
    const { who = 0, masterDefinitionId = null } =
      this.area.get(entityId) ?? {};
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
      throw new Error(`Unknown entity area: ${where}`);
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
  onNewCard(mut: CreateCardEM) {
    this.area.set(mut.card!.id, {
      who: mut.who as 0 | 1,
      masterDefinitionId: null,
    });
  }
  onSwitchActive(mut: SwitchActiveEM) {
    this.activeCharacterDefinitionIds[mut.who as 0 | 1] =
      mut.characterDefinitionId;
  }
}

export function updateHistory(
  previousState: PbGameState | undefined,
  mutations: PbExposedMutation[],
  history: HistoryData,
) {
  try {
    const lastMainBlock = history.blocks.at(-1);
    const lastHintBlock = history.blocks.findLast((b) => !("children" in b));

    let roundNumber = previousState?.roundNumber ?? 0;
    let phase = previousState?.phase ?? PbPhaseType.ACTION;

    let maybeEndPhaseDrawing = false;

    let mainBlock: HistoryDetailBlock | null = null;
    const children: HistoryChildren[] = [];
    const stateRecorder = new StateRecorder(previousState);

    const getLastChild = () => {
      return (
        children.at(-1) ??
        (lastMainBlock && "children" in lastMainBlock
          ? lastMainBlock.children.at(-1)
          : void 0)
      );
    };

    for (const pbm of mutations) {
      const m = flattenPbOneof(pbm.mutation!);
      console.log(m);
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
          history.blocks.push({
            type: "changePhase",
            roundNumber,
            newPhase,
          });
          phase = m.newPhase;
          break;
        }
        case "resetDice": {
          children.push(...stateRecorder.receiveResetDice(m));
          break;
        }
        case "modifyEntityVar": {
          const child = stateRecorder.receiveModifyVar(m);
          if (child) {
            children.push(child);
          }
          break;
        }
        case "applyAura": {
          children.push({
            type: "apply",
            who: stateRecorder.area.get(m.targetId)?.who ?? 0,
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
          if (m.damageType === PbDamageType.HEAL) {
            children.push({
              type: "heal",
              who: stateRecorder.area.get(m.targetId)?.who ?? 0,
              characterDefinitionId: m.targetDefinitionId,
              healValue: m.value,
              oldHealth: m.oldHealth,
              newHealth: m.newHealth,
              healType:
                m.healKind === PbHealKind.IMMUNE_DEFEATED
                  ? "immuneDefeated"
                  : m.healKind === PbHealKind.REVIVE
                    ? "revive"
                    : "normal",
            });
          } else {
            children.push({
              type: "damage",
              who: stateRecorder.area.get(m.targetId)?.who ?? 0,
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
          }
          break;
        }
        case "createCard": {
          stateRecorder.onNewCard(m as CreateCardEM);
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
              type: "playingCard",
              who: m.who as 0 | 1,
              cardDefinitionId: definitionId,
              children: [],
              indent: history.currentIndent,
            };
            if (m.reason === PbRemoveCardReason.PLAY_NO_EFFECT) {
              children.push({
                type: "forbidCard",
                who: m.who as 0 | 1,
                cardDefinitionId: definitionId,
              });
            }
          } else if (m.reason === PbRemoveCardReason.ELEMENTAL_TUNING) {
            mainBlock = {
              type: "elementalTuning",
              who: m.who as 0 | 1,
              cardDefinitionId: definitionId,
              children: [],
              indent: history.currentIndent,
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
          if (m.flagName === PbPlayerFlag.DECLARED_END && m.flagValue) {
            history.blocks.push({
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
          if (m.fromAction === PbSwitchActiveFromAction.NONE) {
            children.push({
              type: "switchActive",
              who,
              characterDefinitionId: m.characterDefinitionId,
              isOverloaded: m.viaSkillDefinitionId === Reaction.Overloaded,
            });
          } else {
            history.blocks.push({
              type: "switchActive",
              who: m.who as 0 | 1,
              characterDefinitionId: m.characterDefinitionId,
              children: [],
              how: "switch",
              indent: history.currentIndent,
            });
          }
          break;
        }
        case "transferCard": {
          if (phase < PbPhaseType.ACTION) {
            break;
          }
          if (m.reason === PbTransferCardReason.DRAW) {
            if (!mainBlock && phase === PbPhaseType.END) {
              maybeEndPhaseDrawing = true;
            }
            const lastChild = getLastChild();
            if (lastChild?.type === "drawCard" && lastChild.who === m.who) {
              lastChild.drawCardsCount += 1;
            } else {
              children.push({
                type: "drawCard",
                who: m.who as 0 | 1,
                drawCardsCount: 1,
              });
            }
          } else if (m.transferToOpp) {
            children.push({
              type: "stealHand",
              who: flip(m.who as 0 | 1),
              cardDefinitionId: m.card!.definitionId,
            });
          } else if (m.reason === PbTransferCardReason.UNDRAW) {
            const lastChild = getLastChild();
            if (lastChild?.type === "undrawCard" && lastChild.who === m.who) {
              lastChild.count += 1;
            } else {
              children.push({
                type: "undrawCard",
                who: m.who as 0 | 1,
                count: 1,
              });
            }
          }
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
            const { type } =
              stateRecorder.entityInitStates.get(m.callerId) ?? {};
            mainBlock = {
              type: "triggered",
              who: m.who as 0 | 1,
              masterOrCallerDefinitionId:
                stateRecorder.getMasterDefinitionId(m.callerId) ??
                m.callerDefinitionId,
              callerOrSkillDefinitionId: m.callerDefinitionId,
              children: [],
              indent: history.currentIndent,
              entityType: type,
            };
            const parentBlock = history.blocks.findLast(
              (b) => "indent" in b && b.indent < history.currentIndent,
            );
            if (parentBlock && "children" in parentBlock) {
              parentBlock.children.push({
                type: "willTriggered",
                who: m.who as 0 | 1,
                callerDefinitionId: m.callerDefinitionId,
              });
            }
          } else if (m.skillType === PbSkillType.CHARACTER_PASSIVE) {
            mainBlock = {
              type: "triggered",
              who: m.who as 0 | 1,
              masterOrCallerDefinitionId: m.callerDefinitionId,
              callerOrSkillDefinitionId: Math.floor(m.skillDefinitionId),
              children: [],
              indent: history.currentIndent,
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
              indent: history.currentIndent,
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
            const skip =
              lastHintBlock?.type === "action" && lastHintBlock.who === m.who;
            if (!skip) {
              history.blocks.push({
                type: "action",
                who: m.who as 0 | 1,
                actionType: "action",
              });
            }
          }
          break;
        }
        case "chooseActiveDone": {
          mainBlock = {
            type: "switchActive",
            who: m.who as 0 | 1,
            characterDefinitionId: m.characterDefinitionId,
            how:
              (previousState?.phase ?? PbPhaseType.ACTION) < PbPhaseType.ACTION
                ? "init"
                : "choose",
            children: [],
            indent: history.currentIndent,
          };
          break;
        }
        case "rerollDone": {
          if (phase < PbPhaseType.ACTION) {
            break;
          }
          const lastChild = getLastChild();
          if (lastChild?.type === "rerollDice" && lastChild.who === m.who) {
            lastChild.count += 1;
          } else {
            children.push({
              type: "rerollDice",
              who: m.who as 0 | 1,
              count: 1,
            });
          }
          break;
        }
        case "switchHandsDone": {
          if (phase < PbPhaseType.ACTION) {
            break;
          }
          const lastChild = getLastChild();
          if (lastChild?.type === "switchCard" && lastChild.who === m.who) {
            lastChild.count += 1;
          } else {
            children.push({
              type: "switchCard",
              who: m.who as 0 | 1,
              count: 1,
            });
          }
          break;
        }
        case "selectCardDone": {
          mainBlock = {
            type: "selectCard",
            who: m.who as 0 | 1,
            cardDefinitionId: m.selectedDefinitionId,
            children: [],
            indent: history.currentIndent,
          };
          break;
        }
        case "handleEvent": {
          if (m.isClose) {
            history.currentIndent = Math.max(0, history.currentIndent - 1);
          } else {
            history.currentIndent++;
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
      // trailing consume energy
      if (
        mainBlock.type === "useSkill" &&
        lastMainBlock?.type === "pocket" &&
        lastMainBlock.children.length === 1 &&
        lastMainBlock.children[0].type === "energy"
      ) {
        children.unshift(...lastMainBlock.children);
        history.blocks.pop();
      }
      mainBlock.children.push(...children);
      history.blocks.push(mainBlock);
    } else if (maybeEndPhaseDrawing) {
      history.blocks.push({
        type: "pocket",
        children,
        indent: history.currentIndent,
      });
    } else if (lastMainBlock && "children" in lastMainBlock) {
      lastMainBlock.children.push(...children);
    } else {
      if (children.length > 0) {
        history.blocks.push({
          type: "pocket",
          children,
          indent: history.currentIndent,
        });
      }
    }
  } catch (e) {
    console.error("Error while parsing history:", e);
  }
}
