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

import type { Draft } from "immer";
import {
  ActionValidity,
  DiceType,
  type DiceRequirement,
  type ReadonlyDiceRequirement,
} from "@gi-tcg/typings";
import { checkDice, chooseDiceValue, flip } from "@gi-tcg/utils";
import type {
  AnyState,
  CharacterState,
  EntityState,
  GameState,
  PlayerState,
} from "./base/state";
import type { EntityArea } from "./base/entity";
import {
  NATION_TAGS,
  WEAPON_TAGS,
  type CharacterDefinition,
  type CharacterTag,
  type ElementTag,
  type NationTag,
  type WeaponTag,
} from "./base/character";
import type { CardDefinition } from "./base/card";
import {
  defineSkillInfo,
  type EventNames,
  type InitiativeSkillDefinition,
  type InitiativeSkillInfo,
  type SkillDefinition,
  type SkillInfo,
  type SkillType,
  type TriggeredSkillDefinition,
  ZeroHealthEventArg,
} from "./base/skill";
import {
  GiTcgCoreInternalEntityNotFoundError,
  GiTcgCoreInternalError,
} from "./error";
import type { ActionInfoWithModification } from "./preview";

export type Writable<T> = {
  -readonly [P in keyof T]: T[P];
};

export function getEntityById(state: GameState, id: number): AnyState {
  for (const player of state.players) {
    for (const ch of player.characters) {
      if (ch.id === id) {
        return ch;
      }
      for (const entity of ch.entities) {
        if (entity.id === id) {
          return entity;
        }
      }
    }
    for (const key of [
      "combatStatuses",
      "summons",
      "supports",
      "hands",
      "removedEntities",
    ] as const) {
      const area = player[key];
      for (const entity of area) {
        if (entity.id === id) {
          return entity;
        }
      }
    }
  }
  throw new GiTcgCoreInternalError(`Cannot found entity ${id}`);
}

/**
 * 查找所有实体，按照通常响应顺序排序。不含已移除的实体。
 * @param state 游戏状态
 * @returns 实体状态列表
 */
export function allEntities(state: GameState): AnyState[] {
  const result: AnyState[] = [];
  for (const who of [state.currentTurn, flip(state.currentTurn)]) {
    const player = state.players[who];
    let activeIdx = 0;
    try {
      activeIdx = getActiveCharacterIndex(player);
    } catch {}
    const [active, ...standby] = player.characters.shiftLeft(activeIdx);

    // 游戏实际的响应顺序并非规则书所述，而是
    // 出战角色、出战角色装备和状态、出战状态、后台角色、后台角色装备和状态
    // 召唤物、支援牌
    // （即出战状态区夹在出战角色区和后台角色区之间）

    // 先列出倒下角色区上实体
    for (const ch of standby) {
      if (ch.variables.alive === 0) {
        result.push(ch, ...ch.entities);
      }
    }

    result.push(active, ...active.entities);
    result.push(...player.combatStatuses);
    for (const ch of standby) {
      if (ch.variables.alive === 1) {
        result.push(ch, ...ch.entities);
      }
    }
    result.push(...player.summons, ...player.supports);
    result.push(...player.hands);
  }
  return result;
}

export function allEntitiesInclPile(state: GameState): AnyState[] {
  return [
    ...allEntities(state),
    ...state.players[state.currentTurn].pile,
    ...state.players[flip(state.currentTurn)].pile,
  ];
}

export interface CallerAndTriggeredSkill {
  caller: AnyState;
  skill: TriggeredSkillDefinition;
}

export interface CallerAndInitiativeSkill {
  caller: AnyState;
  skill: InitiativeSkillDefinition;
}

/**
 * 显示当前玩家的主动技能列表。含当前出战角色的主动技能，和所装备的特技提供的技能。
 *
 * 不考虑是否可以打出。不含准备技能。
 * @param player
 * @returns
 */
export function initiativeSkillsOfPlayer(
  player: PlayerState,
): CallerAndInitiativeSkill[] {
  const activeCh = player.characters.find(
    (ch) => player.activeCharacterId === ch.id,
  );
  if (!activeCh) {
    return [];
  }
  return [
    ...activeCh.entities.flatMap((st) =>
      st.definition.skills
        .filter((sk) => sk.triggerOn === "initiative")
        .map((sk) => ({
          caller: st,
          skill: sk,
        })),
    ),
    ...activeCh.definition.skills
      .filter(
        (sk): sk is InitiativeSkillDefinition =>
          sk.triggerOn === "initiative" && !sk.initiativeSkillConfig.hidden,
      )
      .map((sk) => ({
        caller: activeCh,
        skill: sk,
      })),
  ];
}

/**
 * 检索 `state` 中所有响应 `triggerOn` 的技能。包括扩展点，不含已移除的实体。
 * @param state
 * @param triggerOn
 * @returns
 */
export function allSkills(
  state: GameState,
  triggerOn: EventNames,
): CallerAndTriggeredSkill[] {
  const result: CallerAndTriggeredSkill[] = [];
  const caller = getEntityById(
    state,
    state.players[state.currentTurn].activeCharacterId,
  ) as CharacterState;
  for (const ext of state.extensions) {
    for (const skill of ext.definition.skills) {
      if (skill.triggerOn === triggerOn) {
        result.push({ caller, skill });
      }
    }
  }
  for (const entity of allEntities(state)) {
    for (const skill of entity.definition.skills) {
      if (skill.triggerOn === triggerOn) {
        result.push({ caller: entity, skill });
      }
    }
  }
  return result;
}

export function getEntityArea(state: GameState, id: number): EntityArea {
  for (const who of [0, 1] as const) {
    const player = state.players[who];
    for (const ch of player.characters) {
      if (ch.id === id || ch.entities.find((e) => e.id === id)) {
        return {
          type: "characters",
          who,
          characterId: ch.id,
        };
      }
    }
    for (const key of [
      "combatStatuses",
      "summons",
      "supports",
      "hands",
      "removedEntities",
      "pile",
    ] as const) {
      if (player[key].find((e) => e.id === id)) {
        return {
          type: key,
          who,
        };
      }
    }
  }
  throw new GiTcgCoreInternalEntityNotFoundError(state, id);
}

export function allEntitiesAtArea(
  state: GameState,
  area: EntityArea,
): AnyState[] {
  const result: AnyState[] = [];
  const player = state.players[area.who];
  if (area.type === "characters") {
    const characters = player.characters;
    const idx = characters.findIndex((ch) => ch.id === area.characterId);
    if (idx === -1) {
      throw new GiTcgCoreInternalEntityNotFoundError(state, area.characterId);
    }
    result.push(characters[idx]);
    result.push(...characters[idx].entities);
  } else {
    result.push(...player[area.type]);
  }
  return result;
}

export function checkImmune(state: GameState, e: ZeroHealthEventArg) {
  for (const { caller, skill } of allSkills(state, "modifyZeroHealth")) {
    const skillInfo = defineSkillInfo({
      caller,
      definition: skill,
    });
    const filterResult = (0, skill.filter)(state, skillInfo, e);
    if (filterResult) {
      return true;
    }
  }
  return false;
}

export function removeEntity(state: Draft<GameState>, id: number) {
  for (const player of state.players) {
    for (const ch of player.characters) {
      const idx = ch.entities.findIndex((e) => e.id === id);
      if (idx !== -1) {
        player.removedEntities.push(...ch.entities.splice(idx, 1));
        return;
      }
    }
    for (const key of ["combatStatuses", "summons", "supports"] as const) {
      const area = player[key];
      const idx = area.findIndex((e) => e.id === id);
      if (idx !== -1) {
        player.removedEntities.push(...area.splice(idx, 1));
        return;
      }
    }
  }
  throw new GiTcgCoreInternalEntityNotFoundError(state, id);
}

/** 检查 `skill` 是否是角色主动技能（或者特技） */
export function isCharacterInitiativeSkill(
  skill: SkillInfo,
  allowTechnique = false,
): skill is InitiativeSkillInfo {
  const allowSkillType: SkillType[] = ["normal", "elemental", "burst"];
  if (allowTechnique) {
    allowSkillType.push("technique");
  }
  return (
    skill.definition.triggerOn === "initiative" &&
    allowSkillType.includes(skill.definition.initiativeSkillConfig.skillType)
  );
}

export function getActiveCharacterIndex(player: PlayerState): number {
  const activeIdx = player.characters.findIndex(
    (ch) => ch.id === player.activeCharacterId,
  );
  if (activeIdx === -1) {
    throw new GiTcgCoreInternalError(
      `Invalid active character id ${player.activeCharacterId}`,
    );
  }
  return activeIdx;
}

export interface CheckPreparingResult {
  status: EntityState;
  skillId: number;
}

export function findReplaceAction(character: CharacterState): SkillInfo | null {
  const candidates = character.entities
    .map(
      (st) =>
        [
          st,
          st.definition.skills.find((sk) => sk.triggerOn === "replaceAction"),
        ] as const,
    )
    .filter(([st, sk]) => sk);
  if (candidates.length === 0) {
    return null;
  }
  const [caller, definition] = candidates[0];
  return defineSkillInfo({
    caller,
    definition: definition as SkillDefinition,
  });
}

export function isSkillDisabled(character: CharacterState): boolean {
  return character.entities.some((st) =>
    st.definition.tags.includes("disableSkill"),
  );
}

export function applyAutoSelectedDiceToAction(
  actionInfo: ActionInfoWithModification,
  player: PlayerState,
): ActionInfoWithModification {
  if (actionInfo.validity !== ActionValidity.VALID) {
    return actionInfo;
  }
  if (actionInfo.type === "elementalTuning") {
    const tunningDice = player.dice.find(
      (d) => ![DiceType.Omni, actionInfo.result].includes(d),
    );
    if (!tunningDice) {
      return {
        ...actionInfo,
        validity: ActionValidity.NO_DICE,
      };
    } else {
      return {
        ...actionInfo,
        autoSelectedDice: [tunningDice],
      };
    }
  }
  const autoSelectedDice = chooseDiceValue(actionInfo.cost, player.dice);
  const ok = checkDice(actionInfo.cost, autoSelectedDice);
  if (!ok) {
    return {
      ...actionInfo,
      validity: ActionValidity.NO_DICE,
    };
  }
  const energy =
    player.characters[getActiveCharacterIndex(player)].variables.energy;
  const requiredEnergy = actionInfo.cost.get(DiceType.Energy) ?? 0;
  if (energy < requiredEnergy) {
    return {
      ...actionInfo,
      validity: ActionValidity.NO_ENERGY,
    };
  }
  return {
    ...actionInfo,
    autoSelectedDice,
  };
}

export function playSkillOfCard(
  card: CardDefinition,
): InitiativeSkillDefinition {
  const skillDefinition = card.skills.find(
    (sk): sk is InitiativeSkillDefinition =>
      sk.initiativeSkillConfig?.skillType === "playCard",
  );
  if (!skillDefinition) {
    throw new GiTcgCoreInternalError(
      `Card definition ${card.id} do not have a playCard skill`,
    );
  }
  return skillDefinition;
}

export function normalizeCost(req: DiceRequirement): DiceRequirement {
  const emptyDice = req
    .entries()
    .filter(([k, v]) => v === 0)
    .map(([k, v]) => k);
  for (const dice of emptyDice) {
    req.delete(dice);
  }
  if (req.size === 0) {
    req.set(DiceType.Aligned, 0);
  }
  return req;
}

export function costOfCard(card: CardDefinition): ReadonlyDiceRequirement {
  return playSkillOfCard(card).initiativeSkillConfig.requiredCost;
}

export function costSize(req: ReadonlyDiceRequirement): number {
  return req.entries().reduce((acc, [dice, count]) => acc + count, 0);
}

export function diceCostSize(req: ReadonlyDiceRequirement): number {
  return req
    .entries()
    .reduce(
      (acc, [dice, count]) => acc + (dice !== DiceType.Energy ? count : 0),
      0,
    );
}

export function diceCostOfCard(card: CardDefinition): number {
  return playSkillOfCard(card).initiativeSkillConfig.computed$diceCostSize;
}

export function elementOfCharacter(ch: CharacterDefinition): DiceType {
  const elementTags: Record<ElementTag, DiceType> = {
    cryo: DiceType.Cryo,
    hydro: DiceType.Hydro,
    pyro: DiceType.Pyro,
    electro: DiceType.Electro,
    anemo: DiceType.Anemo,
    geo: DiceType.Geo,
    dendro: DiceType.Dendro,
  };
  const element = ch.tags.find((tag): tag is ElementTag => tag in elementTags);
  if (typeof element === "undefined") {
    return DiceType.Void;
  }
  return elementTags[element];
}
export function weaponOfCharacter(ch: CharacterDefinition): WeaponTag {
  const weaponTags: readonly CharacterTag[] = WEAPON_TAGS;
  const weapon = ch.tags.find((tag): tag is WeaponTag =>
    weaponTags.includes(tag),
  );
  return weapon ?? "otherWeapon";
}
export function nationOfCharacter(ch: CharacterDefinition): NationTag[] {
  const nationTags: readonly CharacterTag[] = NATION_TAGS;
  return ch.tags.filter((tag): tag is NationTag => nationTags.includes(tag));
}

function toSortedBy<T, K extends number[] | number>(
  this: readonly T[],
  projection: (element: T) => K,
): T[] {
  return this.toSorted((a, b) => {
    let projectionA: number[] | number = projection(a);
    let projectionB: number[] | number = projection(b);
    if (!Array.isArray(projectionA)) {
      projectionA = [projectionA];
    }
    if (!Array.isArray(projectionB)) {
      projectionB = [projectionB];
    }
    const size = Math.min(projectionA.length, projectionB.length);
    for (let i = 0; i < size; i++) {
      if (projectionA[i] < projectionB[i]) {
        return -1;
      }
      if (projectionA[i] > projectionB[i]) {
        return 1;
      }
    }
    return projectionA.length - projectionB.length;
  });
}

/**
 * 骰子排序算法。每次修改骰子后都需要重新排序；排序依据是：
 * 1. 万能骰靠前
 * 2. 有效骰靠前
 * 3. 骰子数量多的靠前
 * 4. 骰子类型编号
 * @param player 当前玩家的状态，用以获取有效骰信息
 * @param dice
 * @returns
 */
export function sortDice(
  player: PlayerState,
  dice: readonly DiceType[],
): DiceType[] {
  const characterElements = player.characters
    .shiftLeft(getActiveCharacterIndex(player))
    .map((ch) => elementOfCharacter(ch.definition));
  const countMap = new Map<DiceType, number>();
  for (const d of dice) {
    countMap.set(d, (countMap.get(d) ?? 0) + 1);
  }
  return dice.toSortedBy((dice) => [
    dice === DiceType.Omni ? -1 : 0,
    characterElements.includes(dice) ? -1 : 0,
    -countMap.get(dice)!,
    dice,
  ]);
}

declare global {
  interface ReadonlyArray<T> {
    shiftLeft: typeof shiftLeft;
    last: typeof arrayLast;
    toSortedBy: typeof toSortedBy;
  }
  interface Array<T> {
    /** Won't mutate original array. */
    shiftLeft: typeof shiftLeft;
    last: typeof arrayLast;
    toSortedBy: typeof toSortedBy;
  }
}

function shiftLeft<T>(this: readonly T[], idx: number): T[] {
  return [...this.slice(idx), ...this.slice(0, idx)];
}
function arrayLast<T>(this: readonly T[]): T {
  return this[this.length - 1];
}
Array.prototype.shiftLeft = shiftLeft;
Array.prototype.last = arrayLast;
Array.prototype.toSortedBy = toSortedBy;

/** Shuffle an array. No use of state random generator */
export function shuffle<T>(arr: readonly T[]): readonly T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Mixins

type AbstractConstructor = abstract new (...args: any[]) => any;
type Constructor = new (...args: any[]) => any;

type InstanceOfConstructors<Ts extends AbstractConstructor[]> = Ts extends [
  infer Car extends AbstractConstructor,
  ...infer Cdr extends AbstractConstructor[],
]
  ? InstanceType<Car> & InstanceOfConstructors<Cdr>
  : {};

type MixinResult<
  T extends Constructor,
  Us extends AbstractConstructor[],
> = new (
  ...args: ConstructorParameters<T>
) => InstanceType<T> & InstanceOfConstructors<Us>;

export function mixins<
  T extends Constructor,
  const Us extends AbstractConstructor[],
>(derivedCtor: T, constructors: Us): MixinResult<T, Us> {
  class Mixed extends derivedCtor {
    constructor(...args: any[]) {
      super(...args);
      for (const baseCtor of constructors) {
        for (const name of Object.getOwnPropertyNames(baseCtor.prototype)) {
          if (name === "constructor") {
            continue;
          }
          Object.defineProperty(
            Mixed.prototype,
            name,
            Object.getOwnPropertyDescriptor(baseCtor.prototype, name) ||
              Object.create(null),
          );
        }
      }
    }
  }
  return Mixed as any;
}
