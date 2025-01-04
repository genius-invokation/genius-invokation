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

import {
  Action,
  PbCardState,
  PbCharacterState,
  PbEntityState,
  ExposedMutation,
  Notification,
  PbPlayerState,
  RpcMethod,
  RpcRequest,
  RpcResponse,
  PbSkillInfo,
  PbGameState,
  PbPhaseType,
  PbDiceType,
  PbEquipmentType,
  ReadonlyDiceRequirement,
  PbDiceRequirement,
  PbDiceRequirementType,
  PbCardArea,
  PbRemoveCardReason,
  PbCreateEntityArea,
} from "@gi-tcg/typings";
import {
  CardState,
  CharacterState,
  EntityState,
  GameState,
  PhaseType,
} from "./base/state";
import { Mutation } from "./base/mutation";
import { ActionInfo, InitiativeSkillDefinition } from "./base/skill";
import { GiTcgIoError } from "./error";
import { USAGE_PER_ROUND_VARIABLE_NAMES } from "./base/entity";
import { costOfCard, initiativeSkillsOfPlayer } from "./utils";

export interface PlayerIO {
  notify: (notification: Notification) => void;
  rpc: (request: RpcRequest) => Promise<RpcResponse>;
}

export type PauseHandler = (
  state: GameState,
  mutations: Mutation[],
  canResume: boolean,
) => Promise<unknown>;

export type IoErrorHandler = (e: GiTcgIoError) => void;

/**
 * 由于 ts-proto 没有校验功能，所以额外编写校验 rpc 响应的代码
 *
 * 抛出的 Error 会被外层 catch 并转换为 GiTcgIoError
 * @param method rpc 方法
 * @param response rpc 响应
 */
export function verifyRpcResponse<M extends RpcMethod>(
  method: M,
  response: unknown,
): asserts response is Required<RpcResponse>[M] {
  if (typeof response !== "object" || response === null) {
    throw new Error(`Invalid response of ${method}: ${response}`);
  }
  switch (method) {
    case "action": {
      if (
        !("chosenActionIndex" in response) ||
        typeof response.chosenActionIndex !== "number"
      ) {
        throw new Error("Invalid response of action: no chosenActionIndex");
      }
      if (
        !("usedDice" in response) ||
        !Array.isArray(response.usedDice) ||
        response.usedDice.some((d) => typeof d !== "number")
      ) {
        throw new Error("Invalid response of action: no usedDice");
      }
      break;
    }
    case "chooseActive": {
      if (
        !("activeCharacterId" in response) ||
        typeof response.activeCharacterId !== "number"
      ) {
        throw new Error(
          "Invalid response of chooseActive: no activeCharacterId",
        );
      }
      break;
    }
    case "rerollDice": {
      if (
        !("diceToReroll" in response) ||
        !Array.isArray(response.diceToReroll) ||
        response.diceToReroll.some((d) => typeof d !== "number")
      ) {
        throw new Error("Invalid response of rerollDice: no diceToReroll");
      }
      break;
    }
    case "selectCard": {
      if (
        !("selectedDefinitionId" in response) ||
        typeof response.selectedDefinitionId !== "number"
      ) {
        throw new Error(
          "Invalid response of selectCard: no selectedDefinitionId",
        );
      }
      break;
    }
    case "switchHands": {
      if (
        !("removedHandIds" in response) ||
        !Array.isArray(response.removedHandIds) ||
        response.removedHandIds.some((d) => typeof d !== "number")
      ) {
        throw new Error("Invalid response of switchHands: no removedHandIds");
      }
      break;
    }
    default: {
      const _check: never = method;
      throw new Error(`Unknown method: ${method}`);
    }
  }
}

function exposePhaseType(phase: PhaseType): PbPhaseType {
  switch (phase) {
    case "initActives":
      return PbPhaseType.PHASE_INIT_ACTIVES;
    case "initHands":
      return PbPhaseType.PHASE_INIT_HANDS;
    case "roll":
      return PbPhaseType.PHASE_ROLL;
    case "action":
      return PbPhaseType.PHASE_ACTION;
    case "end":
      return PbPhaseType.PHASE_END;
    case "gameEnd":
      return PbPhaseType.PHASE_GAME_END;
  }
}
function exposeCardWhere(where: "hands" | "pile"): PbCardArea {
  switch (where) {
    case "hands":
      return PbCardArea.CARD_AREA_HAND;
    case "pile":
      return PbCardArea.CARD_AREA_PILE;
  }
}

export function exposeMutation(
  who: 0 | 1,
  m: Mutation,
): ExposedMutation | null {
  switch (m.type) {
    case "stepRandom":
    case "mutateExtensionState":
    case "pushRoundSkillLog":
    case "clearRoundSkillLog":
    case "clearRemovedEntities":
    case "setPlayerFlag":
    case "switchActive": // We will manually handle this
      return null;
    case "swapCharacterPosition":
      return {
        swapCharacterPosition: {
          who: m.who,
          character0Id: m.characters[0].id,
          character0DefinitionId: m.characters[0].definition.id,
          character1Id: m.characters[1].id,
          character1DefinitionId: m.characters[1].definition.id,
        }
      }
    case "changePhase":
      const newPhase = exposePhaseType(m.newPhase);
      return {
        changePhase: { newPhase },
      };
    case "stepRound":
      return { stepRound: m };
    case "switchTurn":
      return { switchTurn: m };
    case "setWinner":
      return { setWinner: m };
    case "transferCard": {
      const from = exposeCardWhere(m.from);
      let transferToOpp = false;
      let to: PbCardArea;
      switch (m.to) {
        case "hands": {
          to = PbCardArea.CARD_AREA_HAND;
          break;
        }
        case "pile": {
          to = PbCardArea.CARD_AREA_PILE;
          break;
        }
        case "oppHands": {
          to = PbCardArea.CARD_AREA_HAND;
          transferToOpp = true;
          break;
        }
        case "oppPile": {
          to = PbCardArea.CARD_AREA_PILE;
          transferToOpp = true;
          break;
        }
      }
      return {
        transferCard: {
          who: m.who,
          from,
          to,
          transferToOpp,
          cardId: m.value.id,
          cardDefinitionId: m.who === who ? m.value.definition.id : 0,
        },
      };
    }
    case "removeCard": {
      const hide =
        m.who !== who && ["overflow", "elementalTuning"].includes(m.reason);
      const from = exposeCardWhere(m.where);
      let reason: PbRemoveCardReason;
      switch (m.reason) {
        case "play": {
          reason = PbRemoveCardReason.REMOVE_CARD_REASON_PLAY;
          break;
        }
        case "elementalTuning": {
          reason = PbRemoveCardReason.REMOVE_CARD_REASON_ELEMENTAL_TUNING;
          break;
        }
        case "overflow": {
          reason = PbRemoveCardReason.REMOVE_CARD_REASON_HANDS_OVERFLOW;
          break;
        }
        case "disposed": {
          reason = PbRemoveCardReason.REMOVE_CARD_REASON_DISPOSED;
          break;
        }
        case "disabled": {
          reason = PbRemoveCardReason.REMOVE_CARD_REASON_DISABLED;
          break;
        }
        case "onDrawTriggered": {
          reason = PbRemoveCardReason.REMOVE_CARD_REASON_ON_DRAW_TRIGGERED;
          break;
        }
      }
      return {
        removeCard: {
          who: m.who,
          from,
          reason,
          cardId: m.oldState.id,
          cardDefinitionId: hide ? 0 : m.oldState.definition.id,
        },
      };
    }
    case "createCard": {
      const to = exposeCardWhere(m.target);
      return {
        createCard: {
          who: m.who,
          cardId: m.target === "hands" ? m.value.id : 0,
          cardDefinitionId: m.who === who ? m.value.definition.id : 0,
          to,
        },
      };
    }
    case "createCharacter": {
      return {
        createCharacter: {
          who: m.who,
          characterId: m.value.id,
          characterDefinitionId: m.value.definition.id,
        },
      };
    }
    case "createEntity": {
      let where: PbCreateEntityArea =
        PbCreateEntityArea.ENTITY_AREA_UNSPECIFIED;
      switch (m.where.type) {
        case "characters":
          where = PbCreateEntityArea.ENTITY_AREA_CHARACTER;
          break;
        case "combatStatuses":
          where = PbCreateEntityArea.ENTITY_AREA_COMBAT_STATUS;
          break;
        case "summons":
          where = PbCreateEntityArea.ENTITY_AREA_SUMMON;
          break;
        case "supports":
          where = PbCreateEntityArea.ENTITY_AREA_SUPPORT;
          break;
      }
      return {
        createEntity: {
          who: m.where.who,
          where,
          entityId: m.value.id,
          entityDefinitionId: m.value.definition.id,
        },
      };
    }
    case "removeEntity": {
      return {
        removeEntity: {
          entityId: m.oldState.id,
          entityDefinitionId: m.oldState.definition.id,
        },
      };
    }
    case "modifyEntityVar": {
      return {
        modifyEntityVar: {
          entityId: m.state.id,
          entityDefinitionId: m.state.definition.id,
          variableName: m.varName,
          variableValue: m.value,
        },
      };
    }
    case "transformDefinition": {
      return {
        transformDefinition: {
          entityId: m.state.id,
          newEntityDefinitionId: m.newDefinition.id,
        },
      };
    }
    case "resetDice": {
      const dice =
        m.who === who
          ? ([...m.value] as PbDiceType[])
          : Array.from(m.value, () => PbDiceType.DICE_UNSPECIFIED);
      return {
        resetDice: {
          who: m.who,
          dice,
        },
      };
    }
    default: {
      const _check: never = m;
      return null;
    }
  }
}

export function exposeEntity(state: GameState, e: EntityState): PbEntityState {
  let equipment: PbEquipmentType | undefined = void 0;
  if (e.definition.type === "equipment") {
    if (e.definition.tags.includes("artifact")) {
      equipment = PbEquipmentType.EQUIPMENT_ARTIFACT;
    } else if (e.definition.tags.includes("weapon")) {
      equipment = PbEquipmentType.EQUIPMENT_WEAPON;
    } else if (e.definition.tags.includes("technique")) {
      equipment = PbEquipmentType.EQUIPMENT_TECHNIQUE;
    } else {
      equipment = PbEquipmentType.EQUIPMENT_OTHER;
    }
  }
  const descriptionDictionary = Object.fromEntries(
    Object.entries(e.definition.descriptionDictionary).map(([k, v]) => [
      k,
      v(state, e.id),
    ]),
  );
  const hasUsagePerRound = USAGE_PER_ROUND_VARIABLE_NAMES.some(
    (name) => e.variables[name],
  );
  return {
    id: e.id,
    definitionId: e.id === 0 ? 0 : e.definition.id,
    variableValue: e.definition.visibleVarName
      ? e.variables[e.definition.visibleVarName] ?? void 0
      : void 0,
    variableName: e.definition.visibleVarName ?? void 0,
    hasUsagePerRound,
    hintIcon: e.variables.hintIcon ?? void 0,
    hintText: e.definition.hintText ?? void 0,
    equipment,
    descriptionDictionary,
  };
}

function exposeDiceRequirement(
  req: ReadonlyDiceRequirement,
): PbDiceRequirement[] {
  return req
    .entries()
    .map(([k, v]) => ({ type: k as PbDiceRequirementType, count: v }))
    .toArray();
}

function exposeCard(
  state: GameState,
  c: CardState,
  hide: boolean,
): PbCardState {
  if (c.id === 0) {
    hide = true;
  }
  const descriptionDictionary = hide
    ? {}
    : Object.fromEntries(
        Object.entries(c.definition.descriptionDictionary).map(([k, v]) => [
          k,
          v(state, c.id),
        ]),
      );
  const definitionCost: PbDiceRequirement[] = [];
  if (!hide) {
    definitionCost.push(...exposeDiceRequirement(costOfCard(c.definition)));
    if (c.definition.tags.includes("legend")) {
      definitionCost.push({
        type: PbDiceRequirementType.DICE_REQ_LEGEND,
        count: 1,
      });
    }
  }
  return {
    id: c.id,
    descriptionDictionary,
    definitionId: hide ? 0 : c.definition.id,
    definitionCost,
  };
}

function exposeCharacter(
  state: GameState,
  ch: CharacterState,
): PbCharacterState {
  return {
    id: ch.id,
    definitionId: ch.definition.id,
    defeated: !ch.variables.alive,
    entity: ch.entities.map((e) => exposeEntity(state, e)),
    health: ch.variables.health,
    energy: ch.variables.energy,
    maxHealth: ch.variables.maxHealth,
    maxEnergy: ch.variables.maxEnergy,
    aura: ch.variables.aura,
  };
}

function exposeInitiativeSkill(skill: InitiativeSkillDefinition): PbSkillInfo {
  return {
    definitionId: skill.id,
    definitionCost: exposeDiceRequirement(
      skill.initiativeSkillConfig.requiredCost,
    ),
  };
}

export function exposeState(who: 0 | 1, state: GameState): PbGameState {
  return {
    phase: exposePhaseType(state.phase),
    currentTurn: state.currentTurn,
    roundNumber: state.roundNumber,
    winner: state.winner ?? void 0,
    player: state.players.map<PbPlayerState>((p, i) => {
      const skills = initiativeSkillsOfPlayer(p).map(({ skill }) => skill);
      const dice =
        i === who
          ? ([...p.dice] as PbDiceType[])
          : p.dice.map(() => PbDiceType.DICE_UNSPECIFIED);
      return {
        activeCharacterId: p.activeCharacterId,
        pileCard: p.pile.map((c) => exposeCard(state, c, true)),
        handCard: p.hands.map((c) => exposeCard(state, c, i !== who)),
        character: p.characters.map((ch) => exposeCharacter(state, ch)),
        dice,
        combatStatus: p.combatStatuses.map((e) => exposeEntity(state, e)),
        support: p.supports.map((e) => exposeEntity(state, e)),
        summon: p.summons.map((e) => exposeEntity(state, e)),
        initiativeSkill: i === who ? skills.map(exposeInitiativeSkill) : [],
        declaredEnd: p.declaredEnd,
        legendUsed: p.legendUsed,
      };
    }),
  };
}

export function exposeAction(action: ActionInfo): Action {
  switch (action.type) {
    case "useSkill": {
      return {
        useSkill: {
          skillId: action.skill.definition.id,
          targetIds: action.targets.map((t) => t.id),
        },
        requiredCost: exposeDiceRequirement(action.cost),
        preview: action.preview ?? [],
      };
    }
    case "playCard": {
      return {
        playCard: {
          cardId: action.skill.caller.id,
          targetIds: action.targets.map((t) => t.id),
        },
        requiredCost: exposeDiceRequirement(action.cost),
        preview: action.preview ?? [],
      };
    }
    case "switchActive": {
      return {
        switchActive: {
          characterId: action.to.id,
        },
        requiredCost: exposeDiceRequirement(action.cost),
        preview: action.preview ?? [],
      };
    }
    case "elementalTuning": {
      return {
        elementalTuning: {
          removedCardId: action.card.id,
          targetDice: action.result as PbDiceType,
        },
        requiredCost: exposeDiceRequirement(action.cost),
        preview: [],
      };
    }
    case "declareEnd": {
      return {
        declareEnd: {},
        requiredCost: [],
        preview: [],
      };
    }
  }
}
