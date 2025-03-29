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
  DamageType,
  DiceType,
  type ExposedMutation,
  Reaction,
} from "@gi-tcg/typings";

import {
  type EntityArea,
  type EntityDefinition,
  type EntityType,
  stringifyEntityArea,
} from "../../base/entity";
import type { CreateCardM, Mutation, TransferCardM } from "../../base/mutation";
import {
  type ConsumeNightsoulInfo,
  type DamageInfo,
  DamageOrHealEventArg,
  type DisposeOrTuneMethod,
  type EventAndRequest,
  type EventAndRequestConstructorArgs,
  type EventAndRequestNames,
  type EventArgOf,
  GenericModifyDamageEventArg,
  GenericModifyHealEventArg,
  type HealInfo,
  type HealKind,
  type InlineEventNames,
  type StateMutationAndExposedMutation,
  type ReactionInfo,
  type SkillDescription,
  type SkillDescriptionReturn,
  type SkillInfo,
  type SkillInfoOfContextConstruction,
  constructEventAndRequestArg,
  CustomEventEventArg,
  type UseSkillRequestOption,
} from "../../base/skill";
import {
  type AnyState,
  type CardState,
  type CharacterState,
  type EntityState,
  type GameState,
  stringifyState,
} from "../../base/state";
import {
  allSkills,
  diceCostOfCard,
  getActiveCharacterIndex,
  getEntityArea,
  getEntityById,
  isCharacterInitiativeSkill,
  sortDice,
} from "../../utils";
import { executeQuery } from "../../query";
import type {
  AppliableDamageType,
  CardHandle,
  CharacterHandle,
  CombatStatusHandle,
  ExEntityState,
  ExtensionHandle,
  HandleT,
  ExEntityType,
  SkillHandle,
  StatusHandle,
  SummonHandle,
  TypedExEntity,
  EquipmentHandle,
} from "../type";
import type { CardDefinition, CardTag, CardType } from "../../base/card";
import type { GuessedTypeOfQuery } from "../../query/types";
import { REACTION_MAP, type NontrivialDamageType } from "../../base/reaction";
import {
  CALLED_FROM_REACTION,
  type ReactionDescriptionEventArg,
  getReactionDescription,
} from "../reaction";
import { flip } from "@gi-tcg/utils";
import { GiTcgDataError } from "../../error";
import { DetailLogType } from "../../log";
import {
  type CreateEntityOptions,
  GiTcgPreviewAbortedError,
  type InternalNotifyOption,
  type MutatorConfig,
  StateMutator,
} from "../../mutator";
import { type Draft, produce } from "immer";
import { nextRandom } from "../../random";
import { Character, type TypedCharacter } from "./character";
import { Entity, type TypedEntity } from "./entity";
import { Card } from "./card";
import type { CustomEvent } from "../../base/custom_event";

type CharacterTargetArg = CharacterState | CharacterState[] | string;
type EntityTargetArg = EntityState | EntityState[] | string;

type CardDefinitionFilterFn = (card: CardDefinition) => boolean;

interface MaxCostHandsOpt {
  who?: "my" | "opp";
  useTieBreak?: boolean;
}

interface DrawCardsOpt {
  who?: "my" | "opp";
  /** 抽取带有特定标签的牌 */
  withTag?: CardTag | null;
  /** 抽取选定定义的牌。设置此选项会忽略 withTag */
  withDefinition?: CardHandle | null;
}

export const ENABLE_SHORTCUT = Symbol("withShortcut");

export interface HealOption {
  kind?: HealKind;
}

type InsertPilePayload =
  | Omit<CreateCardM, "targetIndex" | "who">
  | Omit<TransferCardM, "targetIndex" | "who">;

type InsertPileStrategy =
  | "top"
  | "bottom"
  | "random"
  | "spaceAround"
  | `topRange${number}`
  | `topIndex${number}`;

type Setter<T> = (draft: Draft<T>) => void;

export type ContextMetaBase = {
  readonly: boolean;
  eventArgType: unknown;
  callerVars: string;
  callerType: ExEntityType;
  associatedExtension: ExtensionHandle;
  shortcutReceiver: unknown;
};

type ShortcutReturn<
  Meta extends ContextMetaBase,
  T = void,
> = Meta["shortcutReceiver"] extends {}
  ? Meta["shortcutReceiver"] & { [ENABLE_SHORTCUT]: true }
  : T;

/**
 * 用于描述技能的上下文对象。
 * 它们出现在 `.do()` 形式内，将其作为参数传入。
 */
export class SkillContext<Meta extends ContextMetaBase> {
  private readonly mutator: StateMutator;
  public readonly callerArea: EntityArea;

  private readonly eventAndRequests: EventAndRequest[] = [];
  private mainDamage: DamageInfo | null = null;

  private enableShortcut(): ShortcutReturn<Meta>;
  private enableShortcut<T>(value: T): ShortcutReturn<Meta, T>;
  private enableShortcut(value?: unknown) {
    return value;
  }

  /**
   * 获取正在执行逻辑的实体的 `Character` 或 `Entity`。
   * @returns
   */
  private readonly _self: TypedExEntity<Meta, Meta["callerType"]>;

  /**
   *
   * @param state 触发此技能之前的游戏状态
   * @param skillInfo
   */
  constructor(
    state: GameState,
    public readonly skillInfo: SkillInfoOfContextConstruction,
    public readonly eventArg: Meta["eventArgType"] extends object
      ? Omit<Meta["eventArgType"], `_${string}`>
      : Meta["eventArgType"],
  ) {
    const mutatorConfig: MutatorConfig = {
      logger: skillInfo.logger,
      onNotify: (opt) => this.onNotify(opt),
      onPause: () =>
        Promise.reject(
          new GiTcgDataError(`Async operation is not permitted in skill`),
        ),
    };
    this.callerArea = getEntityArea(state, skillInfo.caller.id);
    this.mutator = new StateMutator(state, mutatorConfig);
    this._self = this.of<Meta["callerType"]>(this.skillInfo.caller);
  }

  /**
   * 对技能返回的事件列表预处理。
   * - 将重复目标的“伤害事件”合并。
   */
  private preprocessEventList() {
    const result: EventAndRequest[] = [];
    const damageEventIndexInResultBasedOnTarget = new Map<number, number>();
    for (const event of this.eventAndRequests) {
      const [name, arg] = event;
      if (name === "onDamageOrHeal" && arg.isDamageTypeDamage()) {
        const previousIndex = damageEventIndexInResultBasedOnTarget.get(
          arg.target.id,
        );
        if (previousIndex) {
          // combine current event with previous event
          const previousArg = result[
            previousIndex
          ][1] as DamageOrHealEventArg<DamageInfo>;
          const combinedDamageInfo: DamageInfo = {
            ...previousArg.damageInfo,
            value: previousArg.damageInfo.value + arg.damageInfo.value,
            causeDefeated:
              previousArg.damageInfo.causeDefeated ||
              arg.damageInfo.causeDefeated,
            fromReaction:
              previousArg.damageInfo.fromReaction ||
              arg.damageInfo.fromReaction,
          };
          result[previousIndex][1] = new DamageOrHealEventArg(
            previousArg.onTimeState,
            combinedDamageInfo,
          );
        } else {
          damageEventIndexInResultBasedOnTarget.set(
            arg.target.id,
            result.length,
          );
          result.push(event);
        }
      } else {
        result.push(event);
      }
    }
    return result;
  }

  /**
   * 技能执行完毕，发出通知，禁止后续改动。
   * @internal
   */
  _terminate(): SkillDescriptionReturn {
    this.mutator.notify();
    Object.freeze(this);
    const emittedEvents = this.preprocessEventList();
    return [
      this.state,
      {
        emittedEvents,
        innerNotify: this._savedNotify,
        mainDamage: this.mainDamage,
      },
    ];
  }

  private readonly _savedNotify: StateMutationAndExposedMutation = {
    stateMutations: [],
    exposedMutations: [],
  };

  // 将技能中引发的通知保存下来，最后调用 _terminate 时返回
  private onNotify(opt: InternalNotifyOption): void {
    this._savedNotify.stateMutations.push(...opt.stateMutations);
    this._savedNotify.exposedMutations.push(...opt.exposedMutations);
  }

  private executeInlineSkill<Arg>(
    skillDescription: SkillDescription<Arg>,
    skill: SkillInfo,
    arg: Arg,
  ) {
    this.mutator.notify();
    const [newState, { innerNotify, emittedEvents }] = skillDescription(
      this.state,
      skill,
      arg,
    );
    this.mutator.resetState(newState, innerNotify);
    this.eventAndRequests.push(...emittedEvents);
  }

  mutate(mut: Mutation) {
    return this.mutator.mutate(mut);
  }

  get self() {
    if (this._self === null) {
      throw new GiTcgDataError("Self entity not available");
    }
    return this._self;
  }

  get isPreview(): boolean {
    return !!this.skillInfo.isPreview;
  }

  get state() {
    return this.mutator.state;
  }

  get player() {
    return this.state.players[this.callerArea.who];
  }
  get oppPlayer() {
    return this.state.players[flip(this.callerArea.who)];
  }
  /** Latest caller state */
  private get callerState(): AnyState {
    return getEntityById(this.state, this.skillInfo.caller.id);
  }
  isMyTurn() {
    return this.state.currentTurn === this.callerArea.who;
  }

  private handleInlineEvent<E extends InlineEventNames>(
    event: E,
    arg: EventArgOf<E>,
  ) {
    using l = this.mutator.subLog(
      DetailLogType.Event,
      `Handling inline event ${event} (${arg.toString()}):`,
    );
    const infos = allSkills(this.state, event).map<SkillInfo>(
      ({ caller, skill }) => ({
        caller,
        definition: skill,
        requestBy: null,
        charged: false,
        plunging: false,
        prepared: false,
        isPreview: this.skillInfo.isPreview,
      }),
    );
    for (const info of infos) {
      arg._currentSkillInfo = info;
      try {
        getEntityById(this.state, info.caller.id);
      } catch {
        continue;
      }
      if (
        "filter" in info.definition &&
        !(0, info.definition.filter)(this.state, info, arg as any)
      ) {
        continue;
      }
      using l = this.mutator.subLog(
        DetailLogType.Skill,
        `Using skill [skill:${info.definition.id}]`,
      );
      const desc = info.definition.action as SkillDescription<EventArgOf<E>>;
      this.executeInlineSkill(desc, info, arg);
    }
  }

  $<const Q extends string>(
    arg: Q,
  ): TypedExEntity<Meta, GuessedTypeOfQuery<Q>> | undefined {
    const result = this.$$(arg);
    return result[0];
  }

  $$<const Q extends string>(
    arg: Q,
  ): TypedExEntity<Meta, GuessedTypeOfQuery<Q>>[] {
    return executeQuery(this, arg);
  }

  // Get context of given entity state
  of(entityState: EntityState): TypedEntity<Meta>;
  of(entityState: CharacterState): TypedCharacter<Meta>;
  of<T extends ExEntityType = ExEntityType>(
    entityId: AnyState | number,
  ): TypedExEntity<Meta, T>;
  of(entityState: AnyState | number): unknown {
    if (typeof entityState === "number") {
      entityState = getEntityById(this.state, entityState);
    }
    if (entityState.definition.type === "character") {
      return new Character(this, entityState.id);
    } else if (entityState.definition.type === "card") {
      return new Card(this, entityState.id);
    } else {
      return new Entity(this, entityState.id);
    }
  }

  private queryOrOf<TypeT extends ExEntityType>(
    q: AnyState | AnyState[] | string,
  ): TypedExEntity<Meta, TypeT>[] {
    if (Array.isArray(q)) {
      return q.map((s) => this.of(s));
    } else if (typeof q === "string") {
      return this.$$(q) as TypedExEntity<Meta, TypeT>[];
    } else {
      return [this.of(q)];
    }
  }

  private queryCoerceToCharacters(
    arg: CharacterTargetArg,
  ): TypedCharacter<Meta>[] {
    const result = this.queryOrOf(arg);
    for (const r of result) {
      if (r instanceof Character) {
        continue;
      } else {
        throw new GiTcgDataError(
          `Expected character target, but query ${arg} found noncharacter entities`,
        );
      }
    }
    return result as TypedCharacter<Meta>[];
  }

  getExtensionState(): Meta["associatedExtension"]["type"] {
    if (typeof this.skillInfo.associatedExtensionId === "undefined") {
      throw new GiTcgDataError("No associated extension registered");
    }
    const ext = this.state.extensions.find(
      (ext) => ext.definition.id === this.skillInfo.associatedExtensionId,
    );
    if (!ext) {
      throw new GiTcgDataError("Associated extension not found");
    }
    return ext.state;
  }
  /** 本回合已使用多少次本技能（仅限角色主动技能）。 */
  countOfSkill(): number;
  /**
   * 本回合我方 `characterId` 角色已使用了多少次技能 `skillId`。
   *
   * `characterId` 是定义 id 而非实体 id。
   */
  countOfSkill(characterId: CharacterHandle, skillId: SkillHandle): number;
  countOfSkill(characterId?: number, skillId?: number): number {
    characterId ??= this.callerState.definition.id;
    skillId ??= this.skillInfo.definition.id;
    return (
      this.player.roundSkillLog.get(characterId)?.filter((e) => e === skillId)
        .length ?? 0
    );
  }

  /**
   * 某方玩家手牌，并按照原本元素骰费用降序排序
   * @param who 我方还是对方
   * @param useTiebreak 是否使用“破平值”，若否，使用“手牌序”（即摸上来的顺序）
   */
  private costSortedHands(
    who: "my" | "opp",
    useTieBreak: boolean,
  ): CardState[] {
    const player = who === "my" ? this.player : this.oppPlayer;
    const tb = useTieBreak
      ? (card: CardState) => {
          return nextRandom(card.id) ^ this.state.iterators.random;
        }
      : (_: CardState) => 0;
    const sortData = new Map(
      player.hands.map(
        (c) =>
          [c.id, { cost: diceCostOfCard(c.definition), tb: tb(c) }] as const,
      ),
    );
    return player.hands
      .toSortedBy((card) => [
        sortData.get(card.id)!.cost,
        sortData.get(card.id)!.tb,
      ])
      .toReversed();
  }

  /** 我方或对方原本元素骰费用最多的 `count` 张手牌 */
  maxCostHands(count: number, opt: MaxCostHandsOpt = {}): CardState[] {
    const who = opt.who ?? "my";
    const useTieBreak = opt.useTieBreak ?? false;
    return this.costSortedHands(who, useTieBreak).slice(0, count);
  }

  isInInitialPile(card: CardState): boolean {
    const defId = card.definition.id;
    return this.player.initialPile.some((c) => c.id === defId);
  }

  /** 我方或对方支援区剩余空位 */
  remainingSupportCount(who: "my" | "opp" = "my"): number {
    const player = who === "my" ? this.player : this.oppPlayer;
    return this.state.config.maxSupportsCount - player.supports.length;
  }

  /**
   * 返回所有行动牌（指定类别/标签或自定义 filter）；通常用于随机选取其中一张。
   */
  allCardDefinitions(
    filterArg?: CardType | CardTag | CardDefinitionFilterFn,
  ): CardDefinition[] {
    const filterFn: CardDefinitionFilterFn =
      typeof filterArg === "undefined"
        ? (c) => true
        : typeof filterArg === "function"
          ? filterArg
          : ["event", "support", "equipment"].includes(filterArg)
            ? (c) => c.cardType === filterArg
            : (c) => c.tags.includes(filterArg as CardTag);
    return this.state.data.cards
      .values()
      .filter((c) => {
        if (!c.obtainable) {
          return false;
        }
        return filterFn(c);
      })
      .toArray();
  }

  // MUTATIONS

  get events() {
    return this.eventAndRequests;
  }

  emitEvent<E extends EventAndRequestNames>(
    event: E,
    ...args: EventAndRequestConstructorArgs<E>
  ) {
    const arg = constructEventAndRequestArg(event, ...args);
    this.mutator.log(
      DetailLogType.Other,
      `Event ${event} (${arg.toString()}) emitted`,
    );
    this.eventAndRequests.push([event, arg] as EventAndRequest);
  }

  emitCustomEvent(event: CustomEvent<void>): ShortcutReturn<Meta>;
  emitCustomEvent<T>(event: CustomEvent<T>, arg: T): ShortcutReturn<Meta>;
  emitCustomEvent<T>(event: CustomEvent<T>, arg?: T) {
    this.emitEvent("onCustomEvent", this.state, this.callerState, event, arg);
    return this.enableShortcut();
  }

  abortPreview() {
    if (this.isPreview) {
      throw new GiTcgPreviewAbortedError();
    }
    return this.enableShortcut();
  }

  switchActive(target: CharacterTargetArg) {
    const RET = this.enableShortcut();
    const targets = this.queryCoerceToCharacters(target);
    if (targets.length !== 1) {
      throw new GiTcgDataError(
        "Expected exactly one target when switching active",
      );
    }
    const switchToTarget = targets[0];
    const playerWho = switchToTarget.who;
    const from =
      this.state.players[playerWho].characters[
        getActiveCharacterIndex(this.state.players[playerWho])
      ];
    if (from.id === switchToTarget.id) {
      return RET;
    }
    let immuneControlStatus: EntityState | undefined;
    if (
      (immuneControlStatus = from.entities.find((st) =>
        st.definition.tags.includes("immuneControl"),
      ))
    ) {
      this.mutator.log(
        DetailLogType.Other,
        `Switch active from ${stringifyState(from)} to ${stringifyState(
          switchToTarget.state,
        )}, but ${stringifyState(immuneControlStatus)} disabled this!`,
      );
      return RET;
    }
    using l = this.mutator.subLog(
      DetailLogType.Primitive,
      `Switch active from ${stringifyState(from)} to ${stringifyState(
        switchToTarget.state,
      )}`,
    );
    this.mutate({
      type: "switchActive",
      who: playerWho,
      value: switchToTarget.state,
    });
    this.emitEvent("onSwitchActive", this.state, {
      type: "switchActive",
      who: playerWho,
      from: from,
      via: this.skillInfo,
      fromReaction: this.fromReaction !== null,
      to: switchToTarget.state,
    });
    return RET;
  }

  gainEnergy(value: number, target: CharacterTargetArg) {
    const targets = this.queryCoerceToCharacters(target);
    for (const t of targets) {
      using l = this.mutator.subLog(
        DetailLogType.Primitive,
        `Gain ${value} energy to ${stringifyState(t.state)}`,
      );
      const targetState = t.state;
      const finalValue = Math.min(
        value,
        targetState.variables.maxEnergy - targetState.variables.energy,
      );
      this.mutate({
        type: "modifyEntityVar",
        state: targetState,
        varName: "energy",
        value: targetState.variables.energy + finalValue,
      });
    }
    return this.enableShortcut();
  }

  private doHeal(
    value: number,
    targetState: CharacterState,
    option: Required<HealOption>,
  ) {
    const damageType = DamageType.Heal;
    if (!targetState.variables.alive) {
      if (option.kind === "revive") {
        this.mutator.log(
          DetailLogType.Other,
          `Before healing ${stringifyState(targetState)}, revive him.`,
        );
        this.mutate({
          type: "modifyEntityVar",
          state: targetState,
          varName: "alive",
          value: 1,
        });
        this.emitEvent("onRevive", this.state, targetState);
      } else {
        // Cannot apply non-revive heal on a dead character
        return;
      }
    }
    using l = this.mutator.subLog(
      DetailLogType.Primitive,
      `Heal ${value} to ${stringifyState(targetState)}`,
    );
    const targetInjury =
      targetState.variables.maxHealth - targetState.variables.health;
    const finalValue = Math.min(value, targetInjury);

    let healInfo: HealInfo = {
      type: damageType,
      cancelled: false,
      expectedValue: value,
      value: finalValue,
      healKind: option.kind,
      source: this.skillInfo.caller,
      via: this.skillInfo,
      target: targetState,
      causeDefeated: false,
      fromReaction: null,
    };
    const modifier = new GenericModifyHealEventArg(this.state, healInfo);
    this.handleInlineEvent("modifyHeal0", modifier);
    this.handleInlineEvent("modifyHeal1", modifier);
    if (modifier.cancelled) {
      return;
    }
    healInfo = modifier.healInfo;
    this.mutate({
      type: "modifyEntityVar",
      state: targetState,
      varName: "health",
      value: targetState.variables.health + healInfo.value,
    });
    this.mutator.notify({
      mutations: [
        {
          $case: "damage",
          damageType: healInfo.type,
          sourceId: this.skillInfo.caller.id,
          sourceDefinitionId: this.skillInfo.caller.definition.id,
          value: healInfo.value,
          targetId: targetState.id,
          targetDefinitionId: targetState.definition.id,
          isSkillMainDamage: false,
        },
      ],
    });
    this.emitEvent("onDamageOrHeal", this.state, healInfo);
  }

  /** 治疗角色 */
  heal(
    value: number,
    target: CharacterTargetArg,
    { kind = "common" }: HealOption = {},
  ) {
    const targets = this.queryCoerceToCharacters(target);
    for (const t of targets) {
      this.doHeal(value, t.state, { kind });
    }
    return this.enableShortcut();
  }

  /** 增加最大生命值 */
  increaseMaxHealth(value: number, target: CharacterTargetArg) {
    const targets = this.queryCoerceToCharacters(target);
    for (const t of targets) {
      using l = this.mutator.subLog(
        DetailLogType.Primitive,
        `Increase ${value} max health to ${stringifyState(t.state)}`,
      );
      const targetState = t.state;
      this.mutate({
        type: "modifyEntityVar",
        state: targetState,
        varName: "maxHealth",
        value: targetState.variables.maxHealth + value,
      });
      // Note: `t.state` is a getter that gets latest state.
      // Do not write `targetState` here
      this.doHeal(value, t.state, { kind: "increaseMaxHealth" });
    }
    return this.enableShortcut();
  }

  damage(
    type: DamageType,
    value: number,
    target: CharacterTargetArg = "opp active",
  ) {
    if (type === DamageType.Heal) {
      return this.heal(value, target);
    }
    const targets = this.queryCoerceToCharacters(target);
    for (const t of targets) {
      using l = this.mutator.subLog(
        DetailLogType.Primitive,
        `Deal ${value} [damage:${type}] damage to ${stringifyState(t.state)}`,
      );
      const targetState = t.state;
      let isSkillMainDamage = false;
      if (
        isCharacterInitiativeSkill(this.skillInfo) &&
        !this.fromReaction &&
        !this.mainDamage &&
        type !== DamageType.Piercing
      ) {
        isSkillMainDamage = true;
      }
      let damageInfo: DamageInfo = {
        source: this.skillInfo.caller,
        target: targetState,
        type,
        value,
        via: this.skillInfo,
        isSkillMainDamage,
        causeDefeated:
          !!targetState.variables.alive &&
          targetState.variables.health <= value,
        fromReaction: this.fromReaction,
      };
      if (damageInfo.type !== DamageType.Piercing) {
        const modifier = new GenericModifyDamageEventArg(
          this.state,
          damageInfo,
        );
        this.handleInlineEvent("modifyDamage0", modifier);
        modifier.increaseDamageByReaction();
        this.handleInlineEvent("modifyDamage1", modifier);
        this.handleInlineEvent("modifyDamage2", modifier);
        this.handleInlineEvent("modifyDamage3", modifier);
        damageInfo = modifier.damageInfo;
      }
      this.mutator.log(
        DetailLogType.Other,
        `Damage info: ${damageInfo.log || "(no modification)"}`,
      );
      const finalHealth = Math.max(
        0,
        targetState.variables.health - damageInfo.value,
      );
      this.mutate({
        type: "modifyEntityVar",
        state: targetState,
        varName: "health",
        value: finalHealth,
      });
      if (damageInfo.target.variables.alive) {
        this.mutator.notify({
          mutations: [
            {
              $case: "damage",
              damageType: damageInfo.type,
              sourceId: damageInfo.source.id,
              sourceDefinitionId: damageInfo.source.definition.id,
              value: damageInfo.value,
              targetId: damageInfo.target.id,
              targetDefinitionId: damageInfo.target.definition.id,
              isSkillMainDamage: damageInfo.isSkillMainDamage,
            },
          ],
        });
      }
      this.emitEvent("onDamageOrHeal", this.state, damageInfo);
      if (isSkillMainDamage) {
        this.mainDamage = damageInfo;
      }
      if (
        damageInfo.type !== DamageType.Physical &&
        damageInfo.type !== DamageType.Piercing
      ) {
        this.doApply(t, damageInfo.type, damageInfo);
      }
    }
    return this.enableShortcut();
  }

  /**
   * 为某角色附着元素。
   * @param type 附着的元素类型
   * @param target 角色目标
   */
  apply(type: AppliableDamageType, target: CharacterTargetArg) {
    const characters = this.queryCoerceToCharacters(target);
    for (const ch of characters) {
      using l = this.mutator.subLog(
        DetailLogType.Primitive,
        `Apply [damage:${type}] to ${stringifyState(ch.state)}`,
      );
      this.doApply(ch, type);
    }
    return this.enableShortcut();
  }

  private get fromReaction(): Reaction | null {
    return (this as any)[CALLED_FROM_REACTION] ?? null;
  }

  private doApply(
    target: TypedCharacter<Meta>,
    type: NontrivialDamageType,
    fromDamage?: DamageInfo,
  ) {
    if (!target.state.variables.alive) {
      return;
    }
    const aura = target.state.variables.aura;
    const [newAura, reaction] = REACTION_MAP[aura][type];
    this.mutate({
      type: "modifyEntityVar",
      state: target.state,
      varName: "aura",
      value: newAura,
    });
    if (reaction !== null) {
      this.mutator.log(
        DetailLogType.Other,
        `Apply reaction ${reaction} to ${stringifyState(target.state)}`,
      );
      const reactionInfo: ReactionInfo = {
        target: target.state,
        type: reaction,
        via: this.skillInfo,
        fromDamage,
      };
      this.mutator.notify({
        mutations: [
          {
            $case: "elementalReaction",
            reactionType: reaction,
            characterId: target.state.id,
            characterDefinitionId: target.state.definition.id,
          },
        ],
      });
      this.emitEvent("onReaction", this.state, reactionInfo);
      const reactionDescriptionEventArg: ReactionDescriptionEventArg = {
        where: target.who === this.callerArea.who ? "my" : "opp",
        here: target.who === this.callerArea.who ? "opp" : "my",
        id: target.state.id,
        isDamage: !!fromDamage,
        isActive: target.isActive(),
      };
      const reactionDescription = getReactionDescription(reaction);
      if (reactionDescription) {
        this.executeInlineSkill(
          reactionDescription,
          this.skillInfo,
          reactionDescriptionEventArg,
        );
      }
    }
  }

  createEntity<TypeT extends EntityType>(
    type: TypeT,
    id: HandleT<TypeT>,
    area?: EntityArea,
    opt: CreateEntityOptions = {},
  ): TypedEntity<Meta> | null {
    const id2 = id as number;
    const def = this.state.data.entities.get(id2);
    if (typeof def === "undefined") {
      throw new GiTcgDataError(`Unknown entity definition id ${id2}`);
    }
    if (typeof area === "undefined") {
      switch (type) {
        case "combatStatus":
          area = {
            type: "combatStatuses",
            who: this.callerArea.who,
          };
          break;
        case "summon":
          area = {
            type: "summons",
            who: this.callerArea.who,
          };
          break;
        case "support":
          area = {
            type: "supports",
            who: this.callerArea.who,
          };
          break;
        default:
          throw new GiTcgDataError(
            `Creating entity of type ${type} requires explicit area`,
          );
      }
    }
    const { oldState, newState } = this.mutator.createEntity(def, area, opt);
    if (newState) {
      this.emitEvent("onEnter", this.state, {
        overridden: oldState,
        newState,
      });
      return this.of(newState);
    } else {
      return null;
    }
  }
  summon(
    id: SummonHandle,
    where: "my" | "opp" = "my",
    opt: CreateEntityOptions = {},
  ) {
    if (where === "my") {
      this.createEntity("summon", id, void 0, opt);
    } else {
      this.createEntity(
        "summon",
        id,
        {
          type: "summons",
          who: flip(this.callerArea.who),
        },
        opt,
      );
    }
    return this.enableShortcut();
  }
  characterStatus(
    id: StatusHandle,
    target: CharacterTargetArg = "@self",
    opt: CreateEntityOptions = {},
  ) {
    const targets = this.queryCoerceToCharacters(target);
    for (const t of targets) {
      this.createEntity("status", id, t.area, opt);
    }
    return this.enableShortcut();
  }
  equip(
    id: EquipmentHandle,
    target: CharacterTargetArg = "@self",
    opt: CreateEntityOptions = {},
  ) {
    const targets = this.queryCoerceToCharacters(target);
    for (const t of targets) {
      this.createEntity("equipment", id, t.area, opt);
    }
    return this.enableShortcut();
  }
  combatStatus(
    id: CombatStatusHandle,
    where: "my" | "opp" = "my",
    opt: CreateEntityOptions = {},
  ) {
    if (where === "my") {
      this.createEntity("combatStatus", id, void 0, opt);
    } else {
      this.createEntity(
        "combatStatus",
        id,
        {
          type: "combatStatuses",
          who: flip(this.callerArea.who),
        },
        opt,
      );
    }
    return this.enableShortcut();
  }

  transferEntity(target: EntityTargetArg, area: EntityArea) {
    const targets = this.queryOrOf(target);
    for (const target of targets) {
      if (target.state.definition.type === "character") {
        throw new GiTcgDataError(`Cannot transfer a character`);
      }
      using l = this.mutator.subLog(
        DetailLogType.Primitive,
        `Transfer ${stringifyState(target.state)} to ${stringifyEntityArea(
          area,
        )}`,
      );
      const state = target.state as EntityState;
      this.mutate({
        type: "removeEntity",
        oldState: state,
      });
      const newState = { ...state };
      this.mutate({
        type: "createEntity",
        value: newState,
        where: area,
      });
    }
    return this.enableShortcut();
  }

  dispose(target: EntityTargetArg = "@self") {
    const targets = this.queryOrOf(target);
    for (const t of targets) {
      this.assertNotCard(t.state);
      const entityState = t.state;
      if (entityState.definition.type === "character") {
        throw new GiTcgDataError(
          `Character caller cannot be disposed. You may forget an argument when calling \`dispose\``,
        );
      }
      using l = this.mutator.subLog(
        DetailLogType.Primitive,
        `Dispose ${stringifyState(entityState)}`,
      );
      this.emitEvent("onDispose", this.state, entityState as EntityState);
      this.mutate({
        type: "removeEntity",
        oldState: entityState,
      });
    }
    return this.enableShortcut();
  }

  // NOTICE: getVariable/setVariable/addVariable 应当将 caller 的严格版声明放在最后一个
  // 因为 (...args: infer R) 只能获取到重载列表中的最后一个，而严格版是 BuilderWithShortcut 需要的

  getVariable(prop: string, target: AnyState): number;
  getVariable(prop: Meta["callerVars"]): number;
  getVariable(prop: string, target?: AnyState) {
    if (target) {
      return this.of(target).getVariable(prop);
    } else {
      return this.self.getVariable(prop);
    }
  }

  setVariable(
    prop: string,
    value: number,
    target: AnyState,
  ): ShortcutReturn<Meta>;
  setVariable(prop: Meta["callerVars"], value: number): ShortcutReturn<Meta>;
  setVariable(prop: any, value: number, target?: AnyState) {
    target ??= this.callerState;
    this.assertNotCard(target);
    using l = this.mutator.subLog(
      DetailLogType.Primitive,
      `Set ${stringifyState(target)}'s variable ${prop} to ${value}`,
    );
    this.mutate({
      type: "modifyEntityVar",
      state: target as CharacterState | EntityState,
      varName: prop,
      value: value,
    });
    return this.enableShortcut();
  }

  private assertNotCard(
    target: AnyState,
  ): asserts target is CharacterState | EntityState {
    if (target.definition.type === "card") {
      throw new GiTcgDataError(`Cannot add variable to card`);
    }
  }

  addVariable(
    prop: string,
    value: number,
    target: AnyState,
  ): ShortcutReturn<Meta>;
  addVariable(prop: Meta["callerVars"], value: number): ShortcutReturn<Meta>;
  addVariable(prop: any, value: number, target?: AnyState) {
    target ??= this.callerState;
    this.assertNotCard(target);
    const finalValue = value + target.variables[prop];
    this.setVariable(prop, finalValue, target);
    return this.enableShortcut();
  }

  addVariableWithMax(
    prop: string,
    value: number,
    maxLimit: number,
    target: AnyState,
  ): ShortcutReturn<Meta>;
  addVariableWithMax(
    prop: Meta["callerVars"],
    value: number,
    maxLimit: number,
  ): ShortcutReturn<Meta>;
  addVariableWithMax(
    prop: any,
    value: number,
    maxLimit: number,
    target?: AnyState,
  ) {
    const RET = this.enableShortcut();
    target ??= this.callerState;
    this.assertNotCard(target);
    if (target.variables[prop] > maxLimit) {
      // 如果当前值已经超过可叠加的上限，则不再叠加
      return RET;
    }
    const finalValue = Math.min(maxLimit, value + target.variables[prop]);
    this.setVariable(prop, finalValue, target);
    return RET;
  }
  consumeUsage(count = 1, target?: EntityState) {
    const RET = this.enableShortcut();
    if (typeof target === "undefined") {
      if (this.callerState.definition.type === "character") {
        throw new GiTcgDataError(`Cannot consume usage of character`);
      }
      target = this.callerState as EntityState;
    }
    if (!Reflect.has(target.definition.varConfigs, "usage")) {
      return RET;
    }
    const current = this.getVariable("usage", target);
    if (current > 0) {
      this.addVariable("usage", -Math.min(count, current), target);
      if (
        Reflect.has(target.definition.varConfigs, "disposeWhenUsageIsZero") &&
        this.getVariable("usage", target) <= 0
      ) {
        this.dispose(target);
      }
    }
    return RET;
  }
  consumeUsagePerRound(count = 1) {
    if (!("usagePerRoundVariableName" in this.skillInfo.definition)) {
      throw new GiTcgDataError(`This skill do not have usagePerRound`);
    }
    const varName = this.skillInfo.definition.usagePerRoundVariableName;
    if (varName === null) {
      throw new GiTcgDataError(`This skill do not have usagePerRound`);
    }
    const current = this.getVariable(varName, this.callerState);
    if (current > 0) {
      this.addVariable(varName, -Math.min(count, current), this.callerState);
    }
    return this.enableShortcut();
  }

  transformDefinition<DefT extends ExEntityType>(
    target: ExEntityState<DefT>,
    newDefId: HandleT<DefT>,
  ): ShortcutReturn<Meta>;
  transformDefinition(target: string, newDefId: number): ShortcutReturn<Meta>;
  transformDefinition(target: string | AnyState, newDefId: number) {
    if (typeof target === "string") {
      const entity = this.$(target);
      if (entity) {
        target = entity.state;
      } else {
        throw new GiTcgDataError(
          `Query ${target} doesn't find 1 character or entity`,
        );
      }
    }
    this.assertNotCard(target);
    const oldDef = target.definition;
    const def = this.state.data[oldDef.__definition].get(newDefId);
    if (typeof def === "undefined") {
      throw new GiTcgDataError(`Unknown definition id ${newDefId}`);
    }
    using l = this.mutator.subLog(
      DetailLogType.Primitive,
      `Transform ${stringifyState(target)}'s definition to [${def.type}:${
        def.id
      }]`,
    );
    this.mutate({
      type: "transformDefinition",
      state: target,
      newDefinition: def,
    });
    this.emitEvent("onTransformDefinition", this.state, target, def);
    return this.enableShortcut();
  }

  swapCharacterPosition(a: CharacterTargetArg, b: CharacterTargetArg) {
    const character0 = this.queryCoerceToCharacters(a);
    const character1 = this.queryCoerceToCharacters(b);
    if (character0.length !== 1 || character1.length !== 1) {
      throw new GiTcgDataError(
        "Expected exactly one target for swapping character",
      );
    }
    if (character0[0].who !== character1[0].who) {
      throw new GiTcgDataError("Cannot swap characters of different players");
    }
    this.mutate({
      type: "swapCharacterPosition",
      who: character0[0].who,
      characters: [character0[0].state, character1[0].state],
    });
    return this.enableShortcut();
  }

  absorbDice(strategy: "seq" | "diff", count: number): DiceType[] {
    using l = this.mutator.subLog(
      DetailLogType.Primitive,
      `Absorb ${count} dice with strategy ${strategy}`,
    );
    const countMap = new Map<DiceType, number>();
    for (const dice of this.player.dice) {
      countMap.set(dice, (countMap.get(dice) ?? 0) + 1);
    }
    // 万能骰排最后。其余按照数量排序，相等时按照骰子类型排序
    const sorted = this.player.dice.toSortedBy((dice) => [
      dice === DiceType.Omni ? 0 : 1,
      -countMap.get(dice)!,
      dice,
    ]);
    switch (strategy) {
      case "seq": {
        const newDice = sorted.slice(0, count);
        this.mutate({
          type: "resetDice",
          who: this.callerArea.who,
          value: sorted.slice(count),
        });
        return newDice;
      }
      case "diff": {
        const collected: DiceType[] = [];
        const dice = [...sorted];
        for (let i = 0; i < count; i++) {
          let found = false;
          for (let j = 0; j < dice.length; j++) {
            // 万能骰子或者不重复的骰子
            if (dice[j] === DiceType.Omni || !collected.includes(dice[j])) {
              collected.push(dice[j]);
              dice.splice(j, 1);
              found = true;
              break;
            }
          }
          if (!found) {
            break;
          }
        }
        this.mutate({
          type: "resetDice",
          who: this.callerArea.who,
          value: dice,
        });
        return collected;
      }
      default: {
        const _: never = strategy;
        throw new GiTcgDataError(`Invalid strategy ${strategy}`);
      }
    }
  }
  convertDice(
    target: DiceType,
    count: number | "all",
    where: "my" | "opp" = "my",
  ) {
    const player = where === "my" ? this.player : this.oppPlayer;
    const who =
      where === "my" ? this.callerArea.who : flip(this.callerArea.who);
    if (count === "all") {
      count = player.dice.length;
    }
    const oldDiceCount = player.dice.length - count;
    const oldDice = player.dice.slice(0, oldDiceCount);
    const newDice = new Array<DiceType>(count).fill(target);
    const finalDice = sortDice(player, [...oldDice, ...newDice]);
    using l = this.mutator.subLog(
      DetailLogType.Primitive,
      `Convert ${who}'s ${count} dice to [dice:${target}]`,
    );
    this.mutate({
      type: "resetDice",
      who,
      value: finalDice,
    });
    return this.enableShortcut();
  }
  generateDice(type: DiceType | "randomElement", count: number) {
    const maxCount = this.state.config.maxDiceCount - this.player.dice.length;
    using l = this.mutator.subLog(
      DetailLogType.Primitive,
      `Generate ${count}${
        maxCount < count ? ` (only ${maxCount} due to limit)` : ""
      } dice of ${typeof type === "string" ? type : `[dice:${type}]`}`,
    );
    count = Math.min(count, maxCount);
    let insertedDice: DiceType[] = [];
    if (type === "randomElement") {
      const diceTypes = [
        DiceType.Anemo,
        DiceType.Cryo,
        DiceType.Dendro,
        DiceType.Electro,
        DiceType.Geo,
        DiceType.Hydro,
        DiceType.Pyro,
      ];
      for (let i = 0; i < count; i++) {
        const generated = this.random(diceTypes);
        insertedDice.push(generated);
        diceTypes.splice(diceTypes.indexOf(generated), 1);
      }
    } else {
      insertedDice = new Array<DiceType>(count).fill(type);
    }
    const newDice = sortDice(this.player, [
      ...this.player.dice,
      ...insertedDice,
    ]);
    this.mutate({
      type: "resetDice",
      who: this.callerArea.who,
      value: newDice,
    });
    for (const d of insertedDice) {
      this.emitEvent(
        "onGenerateDice",
        this.state,
        this.callerArea.who,
        this.skillInfo,
        d,
      );
    }
    return this.enableShortcut();
  }

  createHandCard(cardId: CardHandle) {
    const cardDef = this.state.data.cards.get(cardId);
    if (typeof cardDef === "undefined") {
      throw new GiTcgDataError(`Unknown card definition id ${cardId}`);
    }
    const events = this.mutator.createHandCard(this.callerArea.who, cardDef);
    this.events.push(...events);
    return this.enableShortcut();
  }

  drawCards(count: number, opt: DrawCardsOpt = {}) {
    const { withTag = null, withDefinition = null, who: myOrOpt = "my" } = opt;
    const who =
      myOrOpt === "my" ? this.callerArea.who : flip(this.callerArea.who);
    using l = this.mutator.subLog(
      DetailLogType.Primitive,
      `Player ${who} draw ${count} cards, ${
        withTag ? `(with tag ${withTag})` : ""
      }`,
    );
    const cards: CardState[] = [];
    if (withTag === null && withDefinition === null) {
      // 如果没有限定，则从牌堆顶部摸牌
      for (let i = 0; i < count; i++) {
        const card = this.mutator.drawCard(who);
        if (card) {
          cards.push(card);
        }
      }
    } else {
      const check = (card: CardState) => {
        if (withDefinition !== null) {
          return card.definition.id === withDefinition;
        }
        if (withTag !== null) {
          return card.definition.tags.includes(withTag);
        }
        return false;
      };
      // 否则，随机选中一张满足条件的牌
      const player = () => this.state.players[who];
      for (let i = 0; i < count; i++) {
        const candidates = player().pile.filter(check);
        if (candidates.length === 0) {
          break;
        }
        const chosen = this.random(candidates);
        this.mutate({
          type: "transferCard",
          from: "pile",
          to: "hands",
          who,
          value: chosen,
        });
        cards.push(chosen);
        if (player().hands.length > this.state.config.maxHandsCount) {
          this.mutate({
            type: "removeCard",
            who,
            where: "hands",
            oldState: chosen,
            reason: "overflow",
          });
        }
      }
    }
    for (const card of cards) {
      this.emitEvent("onHandCardInserted", this.state, who, card, "drawn");
    }
    return this.enableShortcut();
  }

  private insertPileCards(
    payloads: InsertPilePayload[],
    strategy: InsertPileStrategy,
    where: "my" | "opp",
  ) {
    const count = payloads.length;
    const who =
      where === "my" ? this.callerArea.who : flip(this.callerArea.who);
    const player = this.state.players[who];
    switch (strategy) {
      case "top":
        for (const mut of payloads) {
          this.mutate({
            ...mut,
            who,
            targetIndex: 0,
          });
        }
        break;
      case "bottom":
        for (const mut of payloads) {
          const targetIndex = player.pile.length;
          this.mutate({
            ...mut,
            who,
            targetIndex,
          });
        }
        break;
      case "random":
        for (let i = 0; i < count; i++) {
          const randomValue = this.mutator.stepRandom();
          const index = randomValue % (player.pile.length + 1);
          this.mutate({
            ...payloads[i],
            who,
            targetIndex: index,
          });
        }
        break;
      case "spaceAround":
        const spaces = count + 1;
        const step = Math.floor(player.pile.length / spaces);
        const rest = player.pile.length % spaces;
        for (let i = 0, j = step; i < count; i++, j += step) {
          if (i < rest) {
            j++;
          }
          this.mutate({
            ...payloads[i],
            who,
            targetIndex: i + j,
          });
        }
        break;
      default: {
        if (strategy.startsWith("topRange")) {
          let range = Number(strategy.slice(8));
          if (Number.isNaN(range)) {
            throw new GiTcgDataError(`Invalid strategy ${strategy}`);
          }
          range = Math.min(range, player.pile.length);
          for (let i = 0; i < count; i++) {
            const randomValue = this.mutator.stepRandom();
            const index = randomValue % range;
            this.mutate({
              ...payloads[i],
              who,
              targetIndex: index,
            });
          }
        } else if (strategy.startsWith("topIndex")) {
          let index = Number(strategy.slice(8));
          if (Number.isNaN(index)) {
            throw new GiTcgDataError(`Invalid strategy ${strategy}`);
          }
          index = Math.min(index, player.pile.length);
          for (let i = 0; i < count; i++) {
            this.mutate({
              ...payloads[i],
              who,
              targetIndex: index,
            });
          }
        } else {
          throw new GiTcgDataError(`Invalid strategy ${strategy}`);
        }
      }
    }
  }

  createPileCards(
    cardId: CardHandle,
    count: number,
    strategy: InsertPileStrategy,
    where: "my" | "opp" = "my",
  ) {
    const who =
      where === "my" ? this.callerArea.who : flip(this.callerArea.who);
    using l = this.mutator.subLog(
      DetailLogType.Primitive,
      `Create pile cards ${count} * [card:${cardId}], strategy ${strategy}`,
    );
    const cardDef = this.state.data.cards.get(cardId);
    if (typeof cardDef === "undefined") {
      throw new GiTcgDataError(`Unknown card definition id ${cardId}`);
    }
    const cardTemplate = {
      id: 0,
      definition: cardDef,
      variables: {},
    };
    const payloads = Array.from(
      { length: count },
      () =>
        ({
          type: "createCard",
          who,
          target: "pile",
          value: { ...cardTemplate },
        }) as const,
    );
    this.insertPileCards(payloads, strategy, where);
    return this.enableShortcut();
  }
  undrawCards(cards: CardState[], strategy: InsertPileStrategy) {
    const who = this.callerArea.who;
    using l = this.mutator.subLog(
      DetailLogType.Primitive,
      `Undraw cards ${cards
        .map((c) => `[card:${c.definition.id}]`)
        .join(", ")}, strategy ${strategy}`,
    );
    const payloads = cards.map(
      (card) =>
        ({
          type: "transferCard",
          from: "hands",
          to: "pile",
          who,
          value: card,
        }) as const,
    );
    this.insertPileCards(payloads, strategy, "my");
  }

  stealHandCard(card: CardState) {
    this.mutate({
      type: "transferCard",
      from: "hands",
      to: "oppHands",
      who: flip(this.callerArea.who),
      value: card,
    });
    this.emitEvent(
      "onHandCardInserted",
      this.state,
      this.callerArea.who,
      card,
      "stolen",
    );
  }

  swapPlayerHandCards() {
    const myHands = this.player.hands;
    const oppHands = this.oppPlayer.hands;
    for (const card of oppHands) {
      this.mutate({
        type: "transferCard",
        from: "hands",
        to: "oppHands",
        who: flip(this.callerArea.who),
        value: card,
      });
      this.emitEvent(
        "onHandCardInserted",
        this.state,
        this.callerArea.who,
        card,
        "stolen",
      );
    }
    for (const card of myHands) {
      this.mutate({
        type: "transferCard",
        from: "hands",
        to: "oppHands",
        who: this.callerArea.who,
        value: card,
      });
      this.emitEvent(
        "onHandCardInserted",
        this.state,
        flip(this.callerArea.who),
        card,
        "stolen",
      );
    }
    return this.enableShortcut();
  }

  /** 弃置一张行动牌，并触发其“弃置时”效果。 */
  disposeCard(...cards: CardState[]) {
    const player = this.player;
    const who = this.callerArea.who;
    for (const card of cards) {
      let where: "hands" | "pile";
      if (player.hands.find((c) => c.id === card.id)) {
        where = "hands";
      } else if (player.pile.find((c) => c.id === card.id)) {
        where = "pile";
      } else {
        throw new GiTcgDataError(
          `Cannot dispose card ${stringifyState(
            card,
          )} from player ${who}, not found in either hands or pile`,
        );
      }
      using l = this.mutator.subLog(
        DetailLogType.Primitive,
        `Dispose card ${stringifyState(card)} from player ${who}`,
      );
      const method: DisposeOrTuneMethod =
        where === "hands" ? "disposeFromHands" : "disposeFromPiles";
      this.emitEvent("onDisposeOrTuneCard", this.state, card, method);
      this.mutate({
        type: "removeCard",
        who,
        where,
        oldState: card,
        reason: "disposed",
      });
    }
  }

  /** 弃置我方原本元素骰费用最多的 `count` 张牌 */
  disposeMaxCostHands(count: number) {
    const disposed = this.maxCostHands(count, { useTieBreak: true });
    this.disposeCard(...disposed);
    return this.enableShortcut(disposed);
  }

  /**
   * `target` 消耗 `count` 点夜魂值
   * @param target
   * @param count
   */
  consumeNightsoul(target: CharacterTargetArg, count = 1) {
    const targets = this.queryCoerceToCharacters(target);
    for (const t of targets) {
      const st = t.$$(`status with tag (nightsoulsBlessing)`)[0];
      if (st) {
        const oldValue = this.getVariable("nightsoul", st.state);
        const newValue = Math.max(0, oldValue - count);
        this.setVariable("nightsoul", newValue, st.state);
        const info: ConsumeNightsoulInfo = {
          oldValue,
          newValue,
          consumedValue: count,
        };
        this.emitEvent("onConsumeNightsoul0", this.state, t.state, info);
        this.emitEvent("onConsumeNightsoul1", this.state, t.state, info);
        // 不在此处弃置夜魂加持；在相应特技的 onConsumeNightsoul1 事件中处理
      }
    }
    return this.enableShortcut();
  }

  /**
   * `target` 获得 `count` 点夜魂值（但不超过该角色关联的夜魂值上限）
   * @param target
   * @param count
   */
  gainNightsoul(target: CharacterTargetArg, count = 1) {
    const targets = this.queryCoerceToCharacters(target);
    for (const t of targets) {
      if (!t.definition.associatedNightsoulsBlessing) {
        continue;
      }
      this.characterStatus(
        t.definition.associatedNightsoulsBlessing.id as StatusHandle,
        t.state,
        {
          overrideVariables: {
            nightsoul: count,
          },
        },
      );
    }
    return this.enableShortcut();
  }

  setExtensionState(setter: Setter<Meta["associatedExtension"]["type"]>) {
    const oldState = this.getExtensionState();
    const newState = produce(oldState, (d) => {
      setter(d);
    });
    this.mutate({
      type: "mutateExtensionState",
      extensionId: this.skillInfo.associatedExtensionId!,
      newState,
    });
    return this.enableShortcut();
  }

  switchCards() {
    this.emitEvent("requestSwitchHands", this.skillInfo, this.callerArea.who);
    return this.enableShortcut();
  }
  rerollDice(times: number) {
    this.emitEvent("requestReroll", this.skillInfo, this.callerArea.who, times);
    return this.enableShortcut();
  }
  triggerEndPhaseSkill(target: EntityState) {
    this.emitEvent(
      "requestTriggerEndPhaseSkill",
      this.skillInfo,
      this.callerArea.who,
      target,
    );
    return this.enableShortcut();
  }
  useSkill(skill: SkillHandle | "normal", option: UseSkillRequestOption = {}) {
    const RET = this.enableShortcut();
    let skillId: number;
    if (skill === "normal") {
      const normalSkill = this.$("my active")!.definition.skills.find(
        (sk) => sk.initiativeSkillConfig?.skillType === "normal",
      );
      if (normalSkill) {
        skillId = normalSkill.id;
      } else {
        this.mutator.log(DetailLogType.Other, `No normal skill found`);
        return RET;
      }
    } else {
      skillId = skill;
    }
    this.emitEvent(
      "requestUseSkill",
      this.skillInfo,
      this.callerArea.who,
      skillId,
      option,
    );
    return RET;
  }

  private getCardsDefinition(cards: (CardHandle | CardDefinition)[]) {
    return cards.map((defOrId) => {
      if (typeof defOrId === "number") {
        const def = this.state.data.cards.get(defOrId);
        if (!def) {
          throw new GiTcgDataError(`Unknown card definition id ${defOrId}`);
        }
        return def;
      } else {
        return defOrId;
      }
    });
  }

  selectAndSummon(summons: (SummonHandle | EntityDefinition)[]) {
    this.emitEvent("requestSelectCard", this.skillInfo, this.callerArea.who, {
      type: "createEntity",
      cards: summons.map((defOrId) => {
        if (typeof defOrId === "number") {
          const def = this.state.data.entities.get(defOrId);
          if (!def) {
            throw new GiTcgDataError(`Unknown entity definition id ${defOrId}`);
          }
          return def;
        } else {
          return defOrId;
        }
      }),
    });
    return this.enableShortcut();
  }
  selectAndCreateHandCard(cards: (CardHandle | CardDefinition)[]) {
    this.emitEvent("requestSelectCard", this.skillInfo, this.callerArea.who, {
      type: "createHandCard",
      cards: this.getCardsDefinition(cards),
    });
    return this.enableShortcut();
  }
  selectAndPlay(
    cards: (CardHandle | CardDefinition)[],
    ...targets: (CharacterState | EntityState)[]
  ) {
    this.emitEvent("requestSelectCard", this.skillInfo, this.callerArea.who, {
      type: "requestPlayCard",
      cards: this.getCardsDefinition(cards),
      targets,
    });
    return this.enableShortcut();
  }

  random<T>(items: readonly T[]): T {
    return items[this.mutator.stepRandom() % items.length];
  }
  private shuffleTail<T>(items: readonly T[], count: number): T[] {
    const itemsCopy = [...items];
    for (let i = itemsCopy.length - 1; i >= itemsCopy.length - count; i--) {
      const j = this.mutator.stepRandom() % (i + 1);
      [itemsCopy[i], itemsCopy[j]] = [itemsCopy[j], itemsCopy[i]];
    }
    return itemsCopy;
  }
  shuffle<T>(items: readonly T[]): T[] {
    return this.shuffleTail(items, items.length);
  }
  randomSubset<T>(items: readonly T[], count: number): T[] {
    const partiallyShuffled = this.shuffleTail(items, count);
    return partiallyShuffled.slice(-count);
  }
}

type InternalProp = "callerArea";

type SkillContextMutativeProps =
  | "mutate"
  | "events"
  | "emitEvent"
  | "emitCustomEvent"
  | "switchActive"
  | "gainEnergy"
  | "heal"
  | "increaseMaxHealth"
  | "damage"
  | "apply"
  | "createEntity"
  | "summon"
  | "combatStatus"
  | "characterStatus"
  | "equip"
  | "dispose"
  | "transferEntity"
  | "setVariable"
  | "addVariable"
  | "addVariableWithMax"
  | "consumeUsage"
  | "consumeUsagePerRound"
  | "consumeNightsoul"
  | "gainNightsoul"
  | "transformDefinition"
  | "absorbDice"
  | "convertDice"
  | "generateDice"
  | "createHandCard"
  | "createPileCards"
  | "disposeCard"
  | "disposeMaxCostHands"
  | "drawCards"
  | "undrawCards"
  | "stealHandCard"
  | "swapPlayerHandCards"
  | "setExtensionState"
  | "switchCards"
  | "reroll"
  | "useSkill"
  | "selectAndSummon"
  | "selectAndCreateHandCard";

/**
 * 所谓 `Typed` 是指，若 `Readonly` 则忽略那些可以改变游戏状态的方法。
 *
 * `TypedCharacter` 等同理。
 */
export type TypedSkillContext<Meta extends ContextMetaBase> =
  Meta["readonly"] extends true
    ? Omit<SkillContext<Meta>, SkillContextMutativeProps | InternalProp>
    : Omit<SkillContext<Meta>, InternalProp>;
