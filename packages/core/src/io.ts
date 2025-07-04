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

import {
  PbCardArea,
  PbDiceRequirementType,
  PbDiceType,
  PbEquipmentType,
  PbRemoveCardReason,
  type Action,
  type PbCardState,
  type PbCharacterState,
  type PbEntityState,
  type ExposedMutation,
  type Notification,
  type PbPlayerState,
  type RpcMethod,
  type RpcRequest,
  type RpcResponse,
  type PbSkillInfo,
  type PbGameState,
  PbPhaseType,
  type ReadonlyDiceRequirement,
  type PbDiceRequirement,
  PbEntityArea,
  type RpcResponsePayloadOf,
  PbPlayerFlag,
  PbModifyDirection,
  CHARACTER_TAG_SHIELD,
  CHARACTER_TAG_BARRIER,
  CHARACTER_TAG_DISABLE_SKILL,
  CHARACTER_TAG_NIGHTSOULS_BLESSING,
  PbResetDiceReason,
  PbHealKind,
  PbPlayerStatus,
  PbTransferCardReason,
  CARD_TAG_NO_TUNNING,
  CHARACTER_TAG_BOND_OF_LIFE,
} from "@gi-tcg/typings";
import type {
  CardState,
  CharacterState,
  EntityState,
  EntityTag,
  GameState,
  PhaseType,
  PlayerState,
} from "./base/state";
import type {
  Mutation,
  PlayerFlag,
  RemoveCardM,
  TransferCardM,
} from "./base/mutation";
import type {
  ActionInfo,
  HealKind,
  InitiativeSkillDefinition,
} from "./base/skill";
import { GiTcgIoError } from "./error";
import { USAGE_PER_ROUND_VARIABLE_NAMES } from "./base/entity";
import { costOfCard, getEntityById, initiativeSkillsOfPlayer } from "./utils";

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
): asserts response is RpcResponsePayloadOf<M> {
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
      return PbPhaseType.INIT_ACTIVES;
    case "initHands":
      return PbPhaseType.INIT_HANDS;
    case "roll":
      return PbPhaseType.ROLL;
    case "action":
      return PbPhaseType.ACTION;
    case "end":
      return PbPhaseType.END;
    case "gameEnd":
      return PbPhaseType.GAME_END;
  }
}
function exposeCardWhere(where: "hands" | "pile"): PbCardArea {
  switch (where) {
    case "hands":
      return PbCardArea.HAND;
    case "pile":
      return PbCardArea.PILE;
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
    case "pushDelayingEvent":
    case "clearDelayingEvent":
    case "switchActive": // We will manually handle this
      return null;
    case "setPlayerFlag": {
      const FLAG_NAME_MAP: Partial<Record<PlayerFlag, PbPlayerFlag>> = {
        declaredEnd: PbPlayerFlag.DECLARED_END,
        legendUsed: PbPlayerFlag.LEGEND_USED,
      };
      const flagName = FLAG_NAME_MAP[m.flagName];
      if (flagName) {
        return {
          $case: "setPlayerFlag",
          who: m.who,
          flagName,
          flagValue: m.value,
        };
      } else {
        return null;
      }
    }
    case "swapCharacterPosition":
      return {
        $case: "swapCharacterPosition",
        who: m.who,
        character0Id: m.characters[0].id,
        character0DefinitionId: m.characters[0].definition.id,
        character1Id: m.characters[1].id,
        character1DefinitionId: m.characters[1].definition.id,
      };
    case "changePhase":
      const newPhase = exposePhaseType(m.newPhase);
      return {
        $case: "changePhase",
        newPhase,
      };
    case "stepRound":
      return { $case: "stepRound" };
    case "switchTurn":
      return { $case: "switchTurn" };
    case "setWinner":
      return { $case: "setWinner", winner: m.winner };
    case "transferCard": {
      const from = exposeCardWhere(m.from);
      let transferToOpp = false;
      let to: PbCardArea;
      switch (m.to) {
        case "hands": {
          to = PbCardArea.HAND;
          break;
        }
        case "pile": {
          to = PbCardArea.PILE;
          break;
        }
        case "oppHands": {
          to = PbCardArea.HAND;
          transferToOpp = true;
          break;
        }
        case "oppPile": {
          to = PbCardArea.PILE;
          transferToOpp = true;
          break;
        }
      }
      const hidden = m.who !== who && !transferToOpp;
      const REASON_MAP: Record<TransferCardM["reason"], PbTransferCardReason> =
        {
          draw: PbTransferCardReason.DRAW,
          undraw: PbTransferCardReason.UNDRAW,
          steal: PbTransferCardReason.STEAL,
          switch: PbTransferCardReason.SWITCH,
          swap: PbTransferCardReason.SWAP,
        };
      return {
        $case: "transferCard",
        who: m.who,
        from,
        to,
        transferToOpp,
        targetIndex: m.targetIndex,
        card: exposeCard(null, m.value, hidden),
        reason: REASON_MAP[m.reason] ?? PbTransferCardReason.UNSPECIFIED,
      };
    }
    case "removeCard": {
      const hide =
        m.who !== who && ["overflow", "elementalTuning"].includes(m.reason);
      const from = exposeCardWhere(m.where);
      const REASON_MAP: Record<RemoveCardM["reason"], PbRemoveCardReason> = {
        play: PbRemoveCardReason.PLAY,
        elementalTuning: PbRemoveCardReason.ELEMENTAL_TUNING,
        overflow: PbRemoveCardReason.HANDS_OVERFLOW,
        disposed: PbRemoveCardReason.DISPOSED,
        playNoEffect: PbRemoveCardReason.PLAY_NO_EFFECT,
        onDrawTriggered: PbRemoveCardReason.ON_DRAW_TRIGGERED,
      };
      const reason = REASON_MAP[m.reason];
      return {
        $case: "removeCard",
        who: m.who,
        from,
        reason,
        card: exposeCard(null, m.oldState, hide),
      };
    }
    case "createCard": {
      const to = exposeCardWhere(m.target);
      return {
        $case: "createCard",
        who: m.who,
        card: exposeCard(null, m.value, m.who !== who),
        to,
        targetIndex: m.targetIndex,
      };
    }
    case "createCharacter": {
      return {
        $case: "createCharacter",
        who: m.who,
        character: exposeCharacter(null, null, m.value),
      };
    }
    case "createEntity": {
      let where: PbEntityArea = PbEntityArea.UNSPECIFIED;
      switch (m.where.type) {
        case "characters":
          where = PbEntityArea.CHARACTER;
          break;
        case "combatStatuses":
          where = PbEntityArea.COMBAT_STATUS;
          break;
        case "summons":
          where = PbEntityArea.SUMMON;
          break;
        case "supports":
          where = PbEntityArea.SUPPORT;
          break;
      }
      return {
        $case: "createEntity",
        who: m.where.who,
        where,
        entity: exposeEntity(null, m.value),
        masterCharacterId:
          m.where.type === "characters" ? m.where.characterId : void 0,
      };
    }
    case "removeEntity": {
      return {
        $case: "removeEntity",
        entity: exposeEntity(null, m.oldState as EntityState),
      };
    }
    case "modifyEntityVar": {
      const direction: PbModifyDirection =
        m.direction === null
          ? PbModifyDirection.UNSPECIFIED
          : m.direction === "increase"
            ? PbModifyDirection.INCREASE
            : PbModifyDirection.DECREASE;
      return {
        $case: "modifyEntityVar",
        entityId: m.state.id,
        entityDefinitionId: m.state.definition.id,
        variableName: m.varName,
        variableValue: m.value,
        direction,
      };
    }
    case "transformDefinition": {
      return {
        $case: "transformDefinition",
        entityId: m.state.id,
        newEntityDefinitionId: m.newDefinition.id,
      };
    }
    case "resetDice": {
      const dice =
        m.who === who
          ? ([...m.value] as PbDiceType[])
          : Array.from(m.value, () => PbDiceType.UNSPECIFIED);
      const reason =
        {
          roll: PbResetDiceReason.ROLL,
          consume: PbResetDiceReason.CONSUME,
          elementalTuning: PbResetDiceReason.ELEMENTAL_TUNING,
          generate: PbResetDiceReason.GENERATE,
          convert: PbResetDiceReason.CONVERT,
          absorb: PbResetDiceReason.ABSORB,
          other: PbResetDiceReason.UNSPECIFIED,
        }[m.reason] ?? PbResetDiceReason.UNSPECIFIED;
      return {
        $case: "resetDice",
        who: m.who,
        dice,
        reason,
        conversionTargetHint: m.conversionTargetHint as PbDiceType | undefined,
      };
    }
    default: {
      const _check: never = m;
      return null;
    }
  }
}

const EXPOSED_TAGS: Partial<Record<EntityTag, number>> = {
  shield: CHARACTER_TAG_SHIELD,
  barrier: CHARACTER_TAG_BARRIER,
  disableSkill: CHARACTER_TAG_DISABLE_SKILL,
  nightsoulsBlessing: CHARACTER_TAG_NIGHTSOULS_BLESSING,
  bondOfLife: CHARACTER_TAG_BOND_OF_LIFE,
};
function exposeTag(tags: EntityTag[]) {
  return tags.reduce(
    (acc, tag) => (EXPOSED_TAGS[tag] ? acc | EXPOSED_TAGS[tag]! : acc),
    0,
  );
}

export function exposeEntity(
  state: GameState | null,
  e: EntityState,
): PbEntityState {
  let equipment: PbEquipmentType | undefined = void 0;
  if (e.definition.type === "equipment") {
    if (e.definition.tags.includes("artifact")) {
      equipment = PbEquipmentType.ARTIFACT;
    } else if (e.definition.tags.includes("weapon")) {
      equipment = PbEquipmentType.WEAPON;
    } else if (e.definition.tags.includes("technique")) {
      equipment = PbEquipmentType.TECHNIQUE;
    } else {
      equipment = PbEquipmentType.OTHER;
    }
  }
  const descriptionDictionary =
    state === null
      ? {}
      : Object.fromEntries(
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
  state: GameState | null,
  c: CardState,
  hide: boolean,
): PbCardState {
  if (c.id === 0) {
    hide = true;
  }
  const descriptionDictionary =
    hide || state === null
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
        type: PbDiceRequirementType.LEGEND,
        count: 1,
      });
    }
  }
  return {
    id: c.id,
    descriptionDictionary,
    definitionId: hide ? 0 : c.definition.id,
    definitionCost,
    // TODO: using a lookup table instead
    tags: c.definition.tags.includes("noTuning") ? CARD_TAG_NO_TUNNING : 0,
  };
}

function exposeCharacter(
  state: GameState | null,
  player: PlayerState | null,
  ch: CharacterState,
): PbCharacterState {
  const tags = exposeTag(
    [
      ...(player?.activeCharacterId === ch.id
        ? [...player.combatStatuses, ...player.summons]
        : []),
      ...ch.entities,
    ].flatMap((e) => e.definition.tags),
  );
  let energy = ch.variables.energy;
  let maxEnergy = ch.variables.maxEnergy;
  let specialEnergyName: string | undefined = void 0;
  if (ch.definition.specialEnergy) {
    specialEnergyName = ch.definition.specialEnergy.variableName;
    energy = ch.variables[specialEnergyName];
    maxEnergy = ch.definition.specialEnergy.slotSize;
  }
  return {
    id: ch.id,
    definitionId: ch.definition.id,
    defeated: !ch.variables.alive,
    entity: ch.entities.map((e) => exposeEntity(state, e)),
    health: ch.variables.health,
    energy,
    maxHealth: ch.variables.maxHealth,
    maxEnergy,
    aura: ch.variables.aura,
    tags,
    specialEnergyName,
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
          : p.dice.map(() => PbDiceType.UNSPECIFIED);
      return {
        activeCharacterId: p.activeCharacterId,
        pileCard: p.pile.map((c) => exposeCard(state, c, true)),
        handCard: p.hands.map((c) => exposeCard(state, c, i !== who)),
        character: p.characters.map((ch) => exposeCharacter(state, p, ch)),
        dice,
        combatStatus: p.combatStatuses.map((e) => exposeEntity(state, e)),
        support: p.supports.map((e) => exposeEntity(state, e)),
        summon: p.summons.map((e) => exposeEntity(state, e)),
        initiativeSkill: i === who ? skills.map(exposeInitiativeSkill) : [],
        declaredEnd: p.declaredEnd,
        legendUsed: p.legendUsed,
        status: PbPlayerStatus.UNSPECIFIED,
      };
    }),
  };
}

export function exposeAction(action: ActionInfo): Action {
  const BASE = {
    requiredCost: exposeDiceRequirement(action.cost),
    autoSelectedDice: action.autoSelectedDice as PbDiceType[],
    validity: action.validity,
    preview: action.preview ?? [],
    isFast: action.fast,
  };
  switch (action.type) {
    case "useSkill": {
      return {
        action: {
          $case: "useSkill",
          value: {
            skillDefinitionId: action.skill.definition.id,
            targetIds: action.targets.map((t) => t.id),
            mainDamageTargetId: action.mainDamageTargetId,
          },
        },
        ...BASE,
      };
    }
    case "playCard": {
      return {
        action: {
          $case: "playCard",
          value: {
            cardId: action.skill.caller.id,
            cardDefinitionId: action.skill.caller.definition.id,
            targetIds: action.targets.map((t) => t.id),
            willBeEffectless: action.willBeEffectless,
          },
        },
        ...BASE,
      };
    }
    case "switchActive": {
      return {
        action: {
          $case: "switchActive",
          value: {
            characterId: action.to.id,
            characterDefinitionId: action.to.definition.id,
          },
        },
        ...BASE,
      };
    }
    case "elementalTuning": {
      return {
        action: {
          $case: "elementalTuning",
          value: {
            removedCardId: action.card.id,
            targetDice: action.result as PbDiceType,
          },
        },
        ...BASE,
      };
    }
    case "declareEnd": {
      return {
        action: {
          $case: "declareEnd",
          value: {},
        },
        ...BASE,
      };
    }
  }
}

export function exposeHealKind(healKind: HealKind | null): PbHealKind {
  if (healKind === null) {
    return PbHealKind.NOT_A_HEAL;
  }
  return {
    common: PbHealKind.COMMON,
    immuneDefeated: PbHealKind.IMMUNE_DEFEATED,
    revive: PbHealKind.REVIVE,
    increaseMaxHealth: PbHealKind.INCREASE_MAX_HEALTH,
    distribution: PbHealKind.DISTRIBUTION,
  }[healKind];
}
