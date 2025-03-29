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

import { DamageType, DiceType, type DiceRequirement } from "@gi-tcg/typings";
import {
  type CommonSkillType,
  type SkillDescription,
  type SkillType,
  type EventNames,
  type SkillInfo,
  type TriggeredSkillDefinition,
  type SkillActionFilter,
  type PlayCardInfo,
  type SwitchActiveInfo,
  type UseSkillInfo,
  type EventArgOf,
  ModifyAction0EventArg,
  ModifyAction1EventArg,
  ModifyAction2EventArg,
  ModifyAction3EventArg,
  type DamageInfo,
  type SkillDescriptionReturn,
  type InitiativeSkillDefinition,
  type InitiativeSkillTargetGetter,
  type SkillInfoOfContextConstruction,
  ModifyHeal0EventArg,
  ModifyHeal1EventArg,
  CustomEventEventArg,
} from "../base/skill";
import type {
  AnyState,
  CharacterState,
  EntityState,
  GameState,
} from "../base/state";
import {
  type ContextMetaBase,
  ENABLE_SHORTCUT,
  SkillContext,
  type TypedSkillContext,
} from "./context/skill";
import type { ExEntityType, ExtensionHandle, SkillHandle } from "./type";
import {
  type EntityArea,
  type EntityType,
  USAGE_PER_ROUND_VARIABLE_NAMES,
  type UsagePerRoundVariableNames,
} from "../base/entity";
import {
  DEFAULT_SNIPPET_NAME,
  type DefaultCustomEventArg,
  EntityBuilder,
  type EntityBuilderPublic,
  type VariableOptions,
} from "./entity";
import {
  costSize,
  diceCostSize,
  getEntityArea,
  isCharacterInitiativeSkill,
  normalizeCost,
} from "../utils";
import { GiTcgDataError } from "../error";
import {
  DEFAULT_VERSION_INFO,
  type Version,
  type VersionInfo,
} from "../base/version";
import { registerInitiativeSkill, builderWeakRefs } from "./registry";
import type { InitiativeSkillTargetKind } from "../base/card";
import type { TargetKindOfQuery, TargetQuery } from "./card";
import { isCustomEvent, type CustomEvent } from "../base/custom_event";

export type SkillBuilderMetaBase = Omit<
  ContextMetaBase,
  "readonly" | "shortcutReceiver"
>;
export type ReadonlyMetaOf<BM extends SkillBuilderMetaBase> = {
  [K in keyof SkillBuilderMetaBase]: BM[K];
} & { readonly: true; shortcutReceiver: unknown };
export type WritableMetaOf<BM extends SkillBuilderMetaBase> = {
  [K in keyof SkillBuilderMetaBase]: BM[K];
} & { readonly: false; shortcutReceiver: unknown };

export type SkillOperation<Meta extends SkillBuilderMetaBase> = (
  c: TypedSkillContext<WritableMetaOf<Meta>>,
  e: Omit<Meta["eventArgType"], `_${string}`>,
) => void;

export type SkillOperationFilter<Meta extends SkillBuilderMetaBase> = (
  c: TypedSkillContext<ReadonlyMetaOf<Meta>>,
  e: Omit<Meta["eventArgType"], `_${string}`>,
) => unknown;

type SkillProjection<Projected, Meta extends SkillBuilderMetaBase> = (
  c: TypedSkillContext<ReadonlyMetaOf<Meta>>,
  e: Omit<Meta["eventArgType"], `_${string}`>,
) => Projected;

type StateOf<TargetKindTs extends InitiativeSkillTargetKind> =
  TargetKindTs extends readonly [
    infer First extends ExEntityType,
    ...infer Rest extends InitiativeSkillTargetKind,
  ]
    ? readonly [
        First extends "character" ? CharacterState : EntityState,
        ...StateOf<Rest>,
      ]
    : readonly [];

export interface StrictInitiativeSkillEventArg<
  TargetKindTs extends InitiativeSkillTargetKind,
> {
  targets: StateOf<TargetKindTs>;
}

type InitiativeSkillBuilderMeta<
  CallerType extends "character" | "card",
  KindTs extends InitiativeSkillTargetKind,
  AssociatedExt extends ExtensionHandle,
> = {
  callerType: CallerType;
  callerVars: never;
  eventArgType: StrictInitiativeSkillEventArg<KindTs>;
  associatedExtension: AssociatedExt;
};

export type CreateSkillBuilderMeta<
  EventArgType,
  CallerType extends ExEntityType,
  Vars extends string,
  AssociatedExt extends ExtensionHandle,
> = {
  callerType: CallerType;
  callerVars: Vars;
  eventArgType: EventArgType;
  associatedExtension: AssociatedExt;
};

export type StrictInitiativeSkillFilter<
  CallerType extends "character" | "card",
  KindTs extends InitiativeSkillTargetKind,
  AssociatedExt extends ExtensionHandle,
> = SkillOperationFilter<
  InitiativeSkillBuilderMeta<CallerType, KindTs, AssociatedExt>
>;

enum ListenTo {
  Myself,
  SameArea,
  SamePlayer,
  All,
}

interface RelativeArg {
  callerId: number;
  callerArea: EntityArea;
  listenTo: ListenTo;
}

function checkRelative(
  state: GameState,
  entityIdOrArea: number | { who: 0 | 1 } | EntityArea,
  r: RelativeArg,
): boolean {
  let entityArea: EntityArea;
  if (typeof entityIdOrArea !== "number" && !("type" in entityIdOrArea)) {
    if (r.listenTo === ListenTo.All) {
      return true;
    } else {
      return r.callerArea.who === entityIdOrArea.who;
    }
  }
  if (typeof entityIdOrArea === "number") {
    entityArea = getEntityArea(state, entityIdOrArea);
  } else {
    entityArea = entityIdOrArea;
  }
  switch (r.listenTo) {
    case ListenTo.Myself:
      return r.callerId === entityIdOrArea;
    // @ts-expect-error fallthrough
    case ListenTo.SameArea:
      if (r.callerArea.type === "characters") {
        return (
          entityArea.type === "characters" &&
          r.callerArea.characterId === entityArea.characterId
        );
      }
    case ListenTo.SamePlayer:
      return r.callerArea.who === entityArea.who;
    case ListenTo.All:
      return true;
    default:
      const _: never = r.listenTo;
      throw new GiTcgDataError(`Unknown listenTo: ${_}`);
  }
}

type Descriptor<E extends EventNames> = readonly [
  E,
  (
    c: TypedSkillContext<
      Omit<ContextMetaBase, "eventArgType"> & { eventArgType: EventArgOf<E> }
    >,
    e: EventArgOf<E>,
    listen: RelativeArg,
  ) => boolean,
];

function defineDescriptor<E extends EventNames>(
  name: E,
  filter?: Descriptor<E>[1],
): Descriptor<E> {
  return [name, filter ?? ((e) => true)];
}

/**
 * 检查此技能使用是否适用于通常意义上的“使用技能后”。
 *
 * 通常意义上的使用技能后是指：
 * 1. 该技能为主动技能；且
 * 2. 该技能不是准备技能触发的。
 * 3. Note: 通过使用卡牌（天赋等）触发的技能也适用。
 *
 * @param allowTechnique 是否允许特技
 */

function isDebuff(state: GameState, damageInfo: DamageInfo): boolean {
  return (
    getEntityArea(state, damageInfo.source.id).who ===
    getEntityArea(state, damageInfo.target.id).who
  );
}

/**
 * 定义数据描述中的触发事件名。
 *
 * 系统内部的事件名数量较少，
 * 提供给数据描述的事件名可解释为内部事件+筛选条件。
 * 比如 `onDamaged` 可解释为 `onDamage` 发生且伤害目标
 * 在监听范围内。
 */
const detailedEventDictionary = {
  roll: defineDescriptor("modifyRoll", (c, e, r) => {
    return checkRelative(e.onTimeState, { who: e.who }, r);
  }),
  addDice: defineDescriptor("modifyAction0", (c, e, r) => {
    return checkRelative(e.onTimeState, { who: e.who }, r);
  }),
  deductElementDice: defineDescriptor("modifyAction1", (c, e, r) => {
    return checkRelative(e.onTimeState, { who: e.who }, r);
  }),
  deductOmniDice: defineDescriptor("modifyAction2", (c, e, r) => {
    return checkRelative(e.onTimeState, { who: e.who }, r) && e.canDeductCost();
  }),
  deductOmniDiceSwitch: defineDescriptor("modifyAction2", (c, e, r) => {
    return (
      checkRelative(e.onTimeState, { who: e.who }, r) &&
      e.isSwitchActive() &&
      e.canDeductCost()
    );
  }),
  deductOmniDiceCard: defineDescriptor("modifyAction2", (c, e, r) => {
    return (
      checkRelative(e.onTimeState, { who: e.who }, r) &&
      e.isPlayCard() &&
      e.canDeductCost()
    );
  }),
  deductAllDiceCard: defineDescriptor("modifyAction3", (c, e, r) => {
    return (
      checkRelative(e.onTimeState, { who: e.who }, r) &&
      e.isPlayCard() &&
      e.canDeductCost()
    );
  }),
  deductVoidDiceSkill: defineDescriptor("modifyAction0", (c, e, r) => {
    return (
      e.isUseCharacterSkill() &&
      checkRelative(e.onTimeState, e.action.skill.caller.id, r) &&
      e.canDeductVoidCost()
    );
  }),
  deductElementDiceSkill: defineDescriptor("modifyAction1", (c, e, r) => {
    return (
      e.isUseCharacterSkill() &&
      checkRelative(e.onTimeState, e.action.skill.caller.id, r)
    );
  }),
  deductOmniDiceSkill: defineDescriptor("modifyAction2", (c, e, r) => {
    return (
      e.isUseCharacterSkill() &&
      checkRelative(e.onTimeState, e.action.skill.caller.id, r) &&
      e.canDeductCost()
    );
  }),
  deductOmniDiceTechnique: defineDescriptor("modifyAction2", (c, e, r) => {
    return (
      e.isUseTechnique() &&
      checkRelative(e.onTimeState, e.action.skill.caller.id, r) &&
      e.canDeductCost()
    );
  }),
  modifyAction: defineDescriptor("modifyAction2", (c, e, r) => {
    return checkRelative(e.onTimeState, { who: e.who }, r);
  }),
  beforeFastSwitch: defineDescriptor("modifyAction2", (c, e, r) => {
    return (
      checkRelative(e.onTimeState, { who: e.who }, r) &&
      e.isSwitchActive() &&
      !e.isFast()
    );
  }),
  modifyDamageType: defineDescriptor("modifyDamage0", (c, e, r) => {
    return checkRelative(e.onTimeState, e.source.id, r);
  }),
  modifySkillDamageType: defineDescriptor("modifyDamage0", (c, e, r) => {
    return (
      e.type !== DamageType.Piercing &&
      checkRelative(e.onTimeState, e.source.id, r) &&
      isCharacterInitiativeSkill(e.via) &&
      e.damageInfo.fromReaction === null
    );
  }),
  increaseDamage: defineDescriptor("modifyDamage1", (c, e, r) => {
    return (
      e.type !== DamageType.Piercing &&
      checkRelative(e.onTimeState, e.source.id, r) &&
      !isDebuff(c.state, e.damageInfo)
    );
  }),
  increaseSkillDamage: defineDescriptor("modifyDamage1", (c, e, r) => {
    return (
      e.type !== DamageType.Piercing &&
      checkRelative(e.onTimeState, e.source.id, r) &&
      isCharacterInitiativeSkill(e.via) &&
      e.damageInfo.fromReaction === null
    );
  }),
  increaseTechniqueDamage: defineDescriptor("modifyDamage1", (c, e, r) => {
    return (
      e.type !== DamageType.Piercing &&
      checkRelative(e.onTimeState, e.source.id, r) &&
      e.via.definition.initiativeSkillConfig?.skillType === "technique" &&
      e.damageInfo.fromReaction === null
    );
  }),
  multiplySkillDamage: defineDescriptor("modifyDamage2", (c, e, r) => {
    return (
      e.type !== DamageType.Piercing &&
      checkRelative(e.onTimeState, e.source.id, r) &&
      isCharacterInitiativeSkill(e.via) &&
      !isDebuff(e.onTimeState, e.damageInfo)
    );
  }),
  increaseDamaged: defineDescriptor("modifyDamage1", (c, e, r) => {
    return (
      e.type !== DamageType.Piercing &&
      checkRelative(e.onTimeState, e.target.id, r)
    );
  }),
  multiplyDamaged: defineDescriptor("modifyDamage2", (c, e, r) => {
    return (
      e.type !== DamageType.Piercing &&
      checkRelative(e.onTimeState, e.target.id, r)
    );
  }),
  decreaseDamaged: defineDescriptor("modifyDamage3", (c, e, r) => {
    return (
      e.type !== DamageType.Piercing &&
      e.value > 0 &&
      checkRelative(e.onTimeState, e.target.id, r)
    );
  }),
  cancelHealed: defineDescriptor("modifyHeal0", (c, e, r) => {
    return checkRelative(e.onTimeState, e.target.id, r) && !e.cancelled;
  }),
  decreaseHealed: defineDescriptor("modifyHeal1", (c, e, r) => {
    return checkRelative(e.onTimeState, e.target.id, r) && !e.cancelled;
  }),
  beforeDefeated: defineDescriptor("modifyZeroHealth", (c, e, r) => {
    return (
      checkRelative(e.onTimeState, e.target.id, r) && e._immuneInfo === null
    );
  }),

  battleBegin: defineDescriptor("onBattleBegin"),
  roundBegin: defineDescriptor("onRoundBegin"),
  roundEnd: defineDescriptor("onRoundEnd"),
  actionPhase: defineDescriptor("onActionPhase"),
  endPhase: defineDescriptor("onEndPhase"),
  beforeAction: defineDescriptor("onBeforeAction", (c, e, r) => {
    return checkRelative(e.onTimeState, { who: e.who }, r);
  }),
  replaceAction: defineDescriptor("replaceAction"),
  action: defineDescriptor("onAction", (c, e, r) => {
    return checkRelative(e.onTimeState, { who: e.who }, r);
  }),
  playCard: defineDescriptor("onPlayCard", (c, e, r) => {
    return (
      // 大部分支援牌不触发自身的打出时；
      // 但有例外“特佩利舞台”，故将此判断移到具体卡牌代码中
      // c.self.id !== e.card.id &&
      checkRelative(e.onTimeState, { who: e.who }, r)
    );
  }),
  useSkill: defineDescriptor("onUseSkill", (c, e, r) => {
    return (
      checkRelative(e.onTimeState, e.callerArea, r) &&
      isCharacterInitiativeSkill(e.skill) &&
      !e.skill.prepared
    );
  }),
  useTechnique: defineDescriptor("onUseSkill", (c, e, r) => {
    return (
      checkRelative(e.onTimeState, e.callerArea, r) &&
      e.isSkillType("technique") &&
      !e.skill.prepared
    );
  }),
  useSkillOrTechnique: defineDescriptor("onUseSkill", (c, e, r) => {
    return (
      checkRelative(e.onTimeState, e.callerArea, r) &&
      isCharacterInitiativeSkill(e.skill, true) &&
      !e.skill.prepared
    );
  }),
  usePreparedSkill: defineDescriptor("onUseSkill", (c, e, r) => {
    return (
      checkRelative(e.onTimeState, e.callerArea, r) &&
      isCharacterInitiativeSkill(e.skill) &&
      e.skill.prepared
    );
  }),
  declareEnd: defineDescriptor("onAction", (c, e, r) => {
    return checkRelative(e.onTimeState, { who: e.who }, r) && e.isDeclareEnd();
  }),
  switchActive: defineDescriptor("onSwitchActive", (c, e, r) => {
    return (
      checkRelative(e.onTimeState, e.switchInfo.from.id, r) ||
      checkRelative(e.onTimeState, e.switchInfo.to.id, r)
    );
  }),
  drawCard: defineDescriptor("onHandCardInserted", (c, e, r) => {
    return (
      checkRelative(e.onTimeState, { who: e.who }, r) && e.reason === "drawn"
    );
  }),
  handCardInserted: defineDescriptor("onHandCardInserted", (c, e, r) => {
    return checkRelative(e.onTimeState, { who: e.who }, r);
  }),
  disposeCard: defineDescriptor("onDisposeOrTuneCard", (c, e, r) => {
    return (
      e.method !== "elementalTuning" &&
      checkRelative(e.onTimeState, { who: e.who }, r)
    );
  }),
  disposeOrTuneCard: defineDescriptor("onDisposeOrTuneCard", (c, e, r) => {
    return checkRelative(e.onTimeState, { who: e.who }, r);
  }),
  dealDamage: defineDescriptor("onDamageOrHeal", (c, e, r) => {
    return (
      e.isDamageTypeDamage() && checkRelative(e.onTimeState, e.source.id, r)
    );
  }),
  skillDamage: defineDescriptor("onDamageOrHeal", (c, e, r) => {
    return (
      e.isDamageTypeDamage() && checkRelative(e.onTimeState, e.source.id, r)
    );
  }),
  damaged: defineDescriptor("onDamageOrHeal", (c, e, r) => {
    return (
      e.isDamageTypeDamage() && checkRelative(e.onTimeState, e.target.id, r)
    );
  }),
  healed: defineDescriptor("onDamageOrHeal", (c, e, r) => {
    return e.isDamageTypeHeal() && checkRelative(e.onTimeState, e.target.id, r);
  }),
  damagedOrHealed: defineDescriptor("onDamageOrHeal", (c, e, r) => {
    return checkRelative(e.onTimeState, e.target.id, r);
  }),
  reaction: defineDescriptor("onReaction", (c, e, r) => {
    return checkRelative(e.onTimeState, e.reactionInfo.target.id, r);
  }),
  skillReaction: defineDescriptor("onReaction", (c, e, r) => {
    return (
      checkRelative(e.onTimeState, e.caller.id, r) && e.viaCharacterSkill()
    );
  }),
  enter: defineDescriptor("onEnter", (c, e, r) => {
    return e.entity.id === r.callerId;
  }),
  enterRelative: defineDescriptor("onEnter", (c, e, r) => {
    return checkRelative(e.onTimeState, e.entity.id, r);
  }),
  dispose: defineDescriptor("onDispose", (c, e, r) => {
    return checkRelative(e.onTimeState, e.entity.id, r);
  }),
  selfDispose: defineDescriptor("onDispose", (c, e, r) => {
    return e.entity.id === r.callerId;
  }),
  defeated: defineDescriptor("onDamageOrHeal", (c, e, r) => {
    return (
      checkRelative(e.onTimeState, e.target.id, r) && e.damageInfo.causeDefeated
    );
  }),
  revive: defineDescriptor("onRevive", (c, e, r) => {
    return checkRelative(e.onTimeState, e.character.id, r);
  }),
  transformDefinition: defineDescriptor("onTransformDefinition", (c, e, r) => {
    return checkRelative(e.onTimeState, e.entity.id, r);
  }),
  generateDice: defineDescriptor("onGenerateDice", (c, e, r) => {
    return checkRelative(e.onTimeState, { who: e.who }, r);
  }),
  consumeNightsoul: defineDescriptor("onConsumeNightsoul0", (c, e, r) => {
    return checkRelative(e.onTimeState, e.character.id, r);
  }),
  consumeNightsoulFinal: defineDescriptor("onConsumeNightsoul1", (c, e, r) => {
    return checkRelative(e.onTimeState, e.character.id, r);
  }),
  selectCard: defineDescriptor("onSelectCard", (c, e, r) => {
    return checkRelative(e.onTimeState, { who: e.who }, r);
  }),
  customEvent: defineDescriptor("onCustomEvent", (c, e, r) => {
    return checkRelative(e.onTimeState, e.entity.id, r);
  }),
} satisfies Record<string, Descriptor<any>>;

type OverrideEventArgType = {
  deductOmniDiceSwitch: ModifyAction2EventArg<SwitchActiveInfo>;
  deductOmniDiceCard: ModifyAction2EventArg<PlayCardInfo>;
  beforeFastSwitch: ModifyAction2EventArg<SwitchActiveInfo>;
  deductAllDiceCard: ModifyAction3EventArg<PlayCardInfo>;
  deductVoidDiceSkill: ModifyAction0EventArg<UseSkillInfo>;
  deductElementDiceSkill: ModifyAction1EventArg<UseSkillInfo>;
  deductOmniDiceSkill: ModifyAction2EventArg<UseSkillInfo>;
  deductOmniDiceTechnique: ModifyAction2EventArg<UseSkillInfo>;
  cancelHealed: Omit<ModifyHeal0EventArg, "damageInfo" | "value">;
  decreaseHealed: Omit<ModifyHeal1EventArg, "damageInfo" | "value">;
};

type DetailedEventDictionary = Omit<
  typeof detailedEventDictionary,
  "customEvent"
>;
export type DetailedEventNames = keyof DetailedEventDictionary;
export type DetailedEventArgOf<E extends DetailedEventNames> =
  E extends keyof OverrideEventArgType
    ? OverrideEventArgType[E]
    : EventArgOf<DetailedEventDictionary[E][0]>;

export type SkillInfoGetter = () => SkillInfo;

const BUILDER_META_TYPE: unique symbol = Symbol();

export function wrapSkillInfoWithExt(
  skillInfo: SkillInfo,
  associatedExtensionId: number | null,
): SkillInfoOfContextConstruction {
  return { ...skillInfo, associatedExtensionId };
}

export abstract class SkillBuilder<Meta extends SkillBuilderMetaBase> {
  declare [BUILDER_META_TYPE]: Meta;

  protected operations: SkillOperation<Meta>[] = [];
  protected filters: SkillOperationFilter<Meta>[] = [];
  protected associatedExtensionId: number | null = null;
  private applyIfFilter = false;
  private _ifFilter: SkillOperationFilter<Meta> = () => true;

  constructor(protected readonly id: number) {
    builderWeakRefs.add(new WeakRef(this));
  }

  if(filter: SkillOperationFilter<Meta>): this {
    this._ifFilter = filter;
    this.applyIfFilter = true;
    return this;
  }

  do(op: SkillOperation<Meta>): this {
    if (this.applyIfFilter) {
      const ifFilter = this._ifFilter;
      this.operations.push(function (c, e) {
        if (!ifFilter(c as any, e)) return;
        return op(c, e);
      });
    } else {
      this.operations.push(op);
    }
    this.applyIfFilter = false;
    return this;
  }

  else(): this {
    const ifFilter = this._ifFilter;
    this._ifFilter = (c, e) => !ifFilter(c, e);
    this.applyIfFilter = true;
    return this;
  }

  /**
   * 在 `state` 上，以 `skillInfo` `arg` 应用技能描述
   *
   * @returns 即 `SkillDescription` 的返回值
   */
  protected buildAction<Arg = Meta["eventArgType"]>(
    overrideOperation?: SkillOperation<any>,
  ): SkillDescription<Arg> {
    const extId = this.associatedExtensionId;
    const operation = overrideOperation ? [overrideOperation] : this.operations;
    return function (
      state: GameState,
      skillInfo: SkillInfo,
      arg: Arg,
    ): SkillDescriptionReturn {
      const ctx = new SkillContext<WritableMetaOf<Meta>>(
        state,
        wrapSkillInfoWithExt(skillInfo, extId),
        arg,
      );
      for (const op of operation) {
        op(ctx as any, ctx.eventArg);
      }
      return ctx._terminate();
    };
  }

  protected buildFilter<Arg = Meta["eventArgType"]>(): SkillActionFilter<Arg> {
    const extId = this.associatedExtensionId;
    const filters = this.filters;
    return function (state: GameState, skillInfo: SkillInfo, arg: Arg) {
      const ctx = new SkillContext<ReadonlyMetaOf<Meta>>(
        state,
        wrapSkillInfoWithExt(skillInfo, extId),
        arg,
      );
      for (const filter of filters) {
        if (!filter(ctx as any, ctx.eventArg)) {
          return false;
        }
      }
      return true;
    };
  }
}

type EnableShortcutPropsOf<Ctx extends object> = {
  [K in keyof Ctx]: Ctx[K] extends (...args: any[]) => infer R
    ? R extends { [ENABLE_SHORTCUT]: true }
      ? K
      : never
    : never;
}[keyof Ctx];

/** 所有允许 shortcut 调用的方法名 */
type EnabledShortcutProps = EnableShortcutPropsOf<
  TypedSkillContext<{
    readonly: false;
    eventArgType: unknown;
    associatedExtension: never;
    callerType: "character";
    callerVars: never;
    shortcutReceiver: {};
  }>
>;

type ShortcutSkillContext<Meta extends ContextMetaBase> = Pick<
  TypedSkillContext<Meta>,
  EnabledShortcutProps & keyof TypedSkillContext<Meta>
>;

type EventArgShortcutPropsOf<EventArgT> = {
  [K in keyof EventArgT]: K extends `_${string}`
    ? never
    : EventArgT[K] extends (...args: any[]) => infer R
      ? R extends void
        ? K
        : never
      : never;
}[keyof EventArgT];
type EventArgShortcutParamsOf<
  EventArgT,
  K extends keyof EventArgT,
> = EventArgT[K] extends (...args: infer P) => void ? P : never;

type EventArgShortcut<Original> = {
  [K in EventArgShortcutPropsOf<ExtractBM<Original>["eventArgType"]>]: (
    ...args: EventArgShortcutParamsOf<ExtractBM<Original>["eventArgType"], K>
  ) => BuilderWithShortcut<Original>;
};

/**
 * 带有 shortcut 的 builder，使用 `withShortcut` 生成。包括：
 * - `Original` 原有 builder 的方法
 * - `ShortcutSkillContext<...>` 对 SkillContext 的 shortcut
 * - `EventArgShortcut<...>` 对 EventArgType 的 shortcut
 */
export type BuilderWithShortcut<Original> = Original &
  ShortcutSkillContext<ShortcutMetaOf<Original>> &
  EventArgShortcut<Original>;

type ExtractBM<T> = T extends {
  [BUILDER_META_TYPE]: infer Meta extends SkillBuilderMetaBase;
}
  ? Meta
  : never;

type ShortcutMetaOf<Builder> = {
  [K in keyof SkillBuilderMetaBase]: ExtractBM<Builder>[K];
} & { readonly: false; shortcutReceiver: BuilderWithShortcut<Builder> };

/**
 * 为 Builder 添加直达 SkillContext 的函数，即可
 * `.do((c) => c.PROP(ARGS))`
 * 直接简写为
 * `.PROP(ARGS)`
 */
export function withShortcut<T extends SkillBuilder<any>>(
  original: T,
): BuilderWithShortcut<T> {
  const proxy = new Proxy(original, {
    get(target, prop, receiver) {
      if (prop in target) {
        return Reflect.get(target, prop, receiver);
      } else if (prop in SkillContext.prototype) {
        return function (this: T, ...args: any[]) {
          return this.do((c) => (c as any)[prop](...args));
        };
      } else {
        return function (this: T, ...args: any[]) {
          return this.do((c) => c.eventArg[prop](...args));
        };
      }
    },
  });
  return proxy as any;
}

export interface UsageOptions<Name extends string> extends VariableOptions {
  name?: Name;
  /** 是否为“每回合使用次数”。默认值为 `false`。 */
  perRound?: boolean;
  /** 是否在每次技能执行完毕后自动 -1。默认值为 `true`。 */
  autoDecrease?: boolean;
  /** 是否在扣除到 0 后自动弃置实体，默认值为 `true` */
  autoDispose?: boolean;
}

export class TriggeredSkillBuilder<
  EventArgType,
  CallerType extends "character" | EntityType,
  CallerVars extends string,
  AssociatedExt extends ExtensionHandle,
  ParentFromCard extends boolean,
  ParentSnippets extends {},
> extends SkillBuilder<
  CreateSkillBuilderMeta<EventArgType, CallerType, CallerVars, AssociatedExt>
> {
  constructor(
    id: number,
    private readonly detailedEventName: DetailedEventNames | CustomEvent,
    private readonly parent: EntityBuilder<
      CallerType,
      CallerVars,
      AssociatedExt,
      ParentFromCard,
      ParentSnippets
    >,
    private readonly triggerFilter: SkillOperationFilter<
      CreateSkillBuilderMeta<
        EventArgType,
        CallerType,
        CallerVars,
        AssociatedExt
      >
    > = () => true,
  ) {
    super(id);
    this.associatedExtensionId = this.parent._associatedExtensionId;
  }
  private _usageOpt: { name: string; autoDecrease: boolean } | null = null;
  private _usagePerRoundOpt: {
    name: UsagePerRoundVariableNames;
    autoDecrease: boolean;
  } | null = null;
  private _listenTo: ListenTo = ListenTo.SameArea;

  /**
   * 为实体创建名为 `usage` 的变量，表示剩余使用次数。
   * 在每次技能执行完毕后，若该变量计数达到 0，则不会触发操作。
   *
   * 若 `autoDispose` 且非 `perRound`（默认），则同时会弃置实体。
   * @param count
   * @param opt @see UsageOptions
   * @returns
   */
  usage<VarName extends string = "usage">(
    count: number,
    opt?: UsageOptions<VarName>,
  ): BuilderWithShortcut<
    TriggeredSkillBuilder<
      EventArgType,
      CallerType,
      CallerVars | VarName,
      AssociatedExt,
      ParentFromCard,
      ParentSnippets
    >
  > {
    const perRound = opt?.perRound ?? false;
    const autoDecrease = opt?.autoDecrease ?? true;
    const name = this.parent._setUsage(count, opt);
    if (perRound) {
      if (this._usagePerRoundOpt !== null) {
        throw new GiTcgDataError("Cannot specify usagePerRound twice.");
      }
      this._usagePerRoundOpt = { name: name as any, autoDecrease };
    } else {
      if (this._usageOpt !== null) {
        throw new GiTcgDataError("Cannot specify usage twice.");
      }
      this._usageOpt = { name, autoDecrease };
    }
    // 增加“检查可用次数”的技能触发条件
    this.filters.push((c) => c.self.getVariable(name) > 0);
    return this as any;
  }
  /**
   * Same as
   * ```
   *   .usage(count, { ...opt, perRound: true, visible: false })
   * ```
   */
  usagePerRound<VarName extends UsagePerRoundVariableNames = "usagePerRound">(
    count: number,
    opt?: Omit<UsageOptions<VarName>, "perRound">,
  ) {
    return this.usage<VarName>(count, {
      ...opt,
      perRound: true,
      visible: false,
    });
  }
  usageCanAppend<VarName extends string = "usage">(
    count: number,
    appendLimit?: number,
    appendValue?: number,
  ) {
    return this.usage<VarName>(count, {
      append: { limit: appendLimit, value: appendValue },
    });
  }

  listenToPlayer(): this {
    this._listenTo = ListenTo.SamePlayer;
    return this;
  }

  listenToAll(): this {
    this._listenTo = ListenTo.All;
    return this;
  }

  /** 调用之前在 `EntityBuilder` 中定义的“小程序” */
  declare callSnippet: CallSnippet<
    ParentSnippets,
    CreateSkillBuilderMeta<EventArgType, CallerType, CallerVars, AssociatedExt>
  >;

  private buildSkill() {
    // 【可用次数自动扣除】

    if (this._usagePerRoundOpt?.autoDecrease) {
      this.do((c) => {
        c.consumeUsagePerRound();
      });
    }
    if (this._usageOpt?.autoDecrease) {
      if (this._usageOpt.name === "usage") {
        // 若变量名为 usage，则消耗可用次数时可能调用 c.dispose
        // 使用 consumeUsage 方法实现相关操作
        this.do((c) => {
          c.consumeUsage();
        });
      } else {
        // 否则手动扣除使用次数
        const name = this._usageOpt.name;
        this.do((c) => {
          c.self.addVariable(name, -1);
        });
      }
    }

    // 【添加各种 filter】

    // 0. 被动技能要求角色存活
    if (
      this.parent._type === "character" &&
      this.detailedEventName !== "defeated"
    ) {
      this.filters.push((c) => c.self.state.variables.alive);
    }
    // 1. 对于并非响应自身弃置的技能，当实体已经被弃置时，不再响应
    if (this.detailedEventName !== "selfDispose") {
      this.filters.push((c, e) => {
        return c.self.area.type !== "removedEntities";
      });
    }
    // 2. 基于 listenTo 的 filter
    const [triggerOn, filterDescriptor] =
      detailedEventDictionary[
        isCustomEvent(this.detailedEventName)
          ? "customEvent"
          : (this.detailedEventName as DetailedEventNames)
      ];
    const listenTo = this._listenTo;
    this.filters.push(function (c, e) {
      const { area, state } = c.self;
      return filterDescriptor(c as any, e as any, {
        callerArea: area,
        callerId: state.id,
        listenTo,
      });
    });
    // 3. 自定义事件：确保事件名一致
    if (isCustomEvent(this.detailedEventName)) {
      const customEvent = this.detailedEventName;
      this.filters.push(function (c, e) {
        return (
          (e as unknown as CustomEventEventArg).customEvent === customEvent
        );
      });
    }
    // 4. 定义技能时显式传入的 filter
    this.filters.push(this.triggerFilter);

    // 【构造技能定义并向父级实体添加】

    const def: TriggeredSkillDefinition = {
      type: "skill",
      id: this.id,
      ownerType: this.parent._type,
      triggerOn,
      initiativeSkillConfig: null,
      filter: this.buildFilter(),
      action: this.buildAction(),
      usagePerRoundVariableName: this._usagePerRoundOpt?.name ?? null,
    };
    this.parent._skillList.push(def);
  }

  endOn() {
    this.buildSkill();
    return this.parent;
  }

  on<NewEventName extends DetailedEventNames>(
    event: NewEventName,
    filter?: SkillOperationFilter<
      CreateSkillBuilderMeta<
        DetailedEventArgOf<NewEventName>,
        CallerType,
        CallerVars,
        AssociatedExt
      >
    >,
  ): BuilderWithShortcut<
    TriggeredSkillBuilder<
      DetailedEventArgOf<NewEventName>,
      CallerType,
      CallerVars,
      AssociatedExt,
      ParentFromCard,
      ParentSnippets
    >
  >;
  on<T = void>(
    customEvent: CustomEvent<T>,
    filter?: SkillOperationFilter<
      CreateSkillBuilderMeta<
        CustomEventEventArg<T>,
        CallerType,
        CallerVars,
        AssociatedExt
      >
    >,
  ): BuilderWithShortcut<
    TriggeredSkillBuilder<
      CustomEventEventArg<T>,
      CallerType,
      CallerVars,
      AssociatedExt,
      ParentFromCard,
      ParentSnippets
    >
  >;
  on(event: any, filter?: any): unknown {
    this.buildSkill();
    return this.parent.on(event, filter);
  }

  once<NewEventName extends DetailedEventNames>(
    event: NewEventName,
    filter?: SkillOperationFilter<
      CreateSkillBuilderMeta<
        DetailedEventArgOf<NewEventName>,
        CallerType,
        CallerVars,
        AssociatedExt
      >
    >,
  ): BuilderWithShortcut<
    TriggeredSkillBuilder<
      DetailedEventArgOf<NewEventName>,
      CallerType,
      CallerVars,
      AssociatedExt,
      ParentFromCard,
      ParentSnippets
    >
  >;
  once<T = void>(
    customEvent: CustomEvent<T>,
    filter?: SkillOperationFilter<
      CreateSkillBuilderMeta<
        CustomEventEventArg<T>,
        CallerType,
        CallerVars,
        AssociatedExt
      >
    >,
  ): BuilderWithShortcut<
    TriggeredSkillBuilder<
      CustomEventEventArg<T>,
      CallerType,
      CallerVars,
      AssociatedExt,
      ParentFromCard,
      ParentSnippets
    >
  >;
  once(event: any, filter?: any): unknown {
    this.buildSkill();
    return this.parent.once(event, filter);
  }

  done() {
    this.buildSkill();
    return this.parent.done();
  }
}

type CallSnippet<
  Snippets extends {},
  Meta extends SkillBuilderMetaBase,
> = (Snippets extends { [DEFAULT_SNIPPET_NAME]: infer DefaultCustomT }
  ? {
      <This>(
        this: This,
        ...projection: DefaultCustomT extends DefaultCustomEventArg
          ? []
          : [SkillProjection<DefaultCustomT, Meta>]
      ): This;
    }
  : {}) & {
  <This, SnippetName extends keyof Snippets & string>(
    this: This,
    name: SnippetName,
    ...projection: Snippets[SnippetName] extends DefaultCustomEventArg
      ? []
      : [SkillProjection<Snippets[SnippetName], Meta>]
  ): This;
};

TriggeredSkillBuilder.prototype.callSnippet = function (...args) {
  let name: string;
  let projection: any;
  if (args.length <= 1 && typeof args[0] !== "string") {
    name = DEFAULT_SNIPPET_NAME;
    [projection] = args;
  } else {
    [name, projection] = args;
  }
  const self: any = this;
  const operation = self.parent._applySnippet(name, projection);
  return self.do(operation);
};

function generateTargetList(
  state: GameState,
  skillInfo: SkillInfo,
  known: AnyState[],
  targetQuery: string[],
  associatedExtensionId: number | null,
): AnyState[][] {
  if (targetQuery.length === 0) {
    return [[]];
  }
  const [first, ...rest] = targetQuery;
  const ctx = new SkillContext<ReadonlyMetaOf<SkillBuilderMetaBase>>(
    state,
    wrapSkillInfoWithExt(skillInfo, associatedExtensionId),
    {
      targets: known,
    },
  );
  const states = ctx.$$(first).map((c) => c.state);
  return states.flatMap((st) =>
    generateTargetList(
      state,
      skillInfo,
      [...known, st],
      rest,
      associatedExtensionId,
    ).map((l) => [st, ...l]),
  );
}

export function buildTargetGetter(
  targetQuery: string[],
  associatedExtensionId: number | null,
): InitiativeSkillTargetGetter {
  return (state, skillInfo) => {
    const targetIdsList = generateTargetList(
      state,
      skillInfo,
      [],
      targetQuery,
      associatedExtensionId,
    );
    return targetIdsList.map((targets) => ({ targets }));
  };
}

export abstract class SkillBuilderWithCost<
  Meta extends SkillBuilderMetaBase,
> extends SkillBuilder<Meta> {
  protected _targetQueries: string[] = [];

  protected addTargetImpl(targetQuery: string) {
    this._targetQueries = [...this._targetQueries, targetQuery];
  }

  protected buildTargetGetter() {
    return buildTargetGetter(this._targetQueries, this.associatedExtensionId);
  }

  constructor(skillId: number) {
    super(skillId);
  }
  protected _cost: DiceRequirement = new Map();
  private cost(type: DiceType, count: number): this {
    this._cost.set(type, count);
    return this;
  }
  costVoid(count: number) {
    return this.cost(DiceType.Void, count);
  }
  costCryo(count: number) {
    return this.cost(DiceType.Cryo, count);
  }
  costHydro(count: number) {
    return this.cost(DiceType.Hydro, count);
  }
  costPyro(count: number) {
    return this.cost(DiceType.Pyro, count);
  }
  costElectro(count: number) {
    return this.cost(DiceType.Electro, count);
  }
  costAnemo(count: number) {
    return this.cost(DiceType.Anemo, count);
  }
  costGeo(count: number) {
    return this.cost(DiceType.Geo, count);
  }
  costDendro(count: number) {
    return this.cost(DiceType.Dendro, count);
  }
  costSame(count: number) {
    return this.cost(DiceType.Aligned, count);
  }
  costEnergy(count: number) {
    return this.cost(DiceType.Energy, count);
  }
}

export class InitiativeSkillBuilder<
  KindTs extends InitiativeSkillTargetKind,
  AssociatedExt extends ExtensionHandle,
> extends SkillBuilderWithCost<{
  callerType: "character";
  callerVars: never;
  eventArgType: StrictInitiativeSkillEventArg<KindTs>;
  associatedExtension: AssociatedExt;
}> {
  private _skillType: SkillType = "normal";
  private _gainEnergy = true;
  protected _cost: DiceRequirement = new Map();
  private _versionInfo: VersionInfo = DEFAULT_VERSION_INFO;
  private _prepared = false;
  constructor(private readonly skillId: number) {
    super(skillId);
  }

  since(version: Version) {
    this._versionInfo = { predicate: "since", version };
    return this;
  }
  until(version: Version) {
    this._versionInfo = { predicate: "until", version };
    return this;
  }

  associateExtension<NewExtT>(ext: ExtensionHandle<NewExtT>) {
    if (this.associatedExtensionId !== null) {
      throw new GiTcgDataError(
        `This skill has already associated with extension ${this.id}`,
      );
    }
    this.associatedExtensionId = ext;
    return this as unknown as InitiativeSkillBuilder<
      KindTs,
      ExtensionHandle<NewExtT>
    >;
  }

  prepared(): this {
    this._prepared = true;
    return this.noEnergy();
  }
  noEnergy(): this {
    this._gainEnergy = false;
    return this;
  }

  type(type: "passive"): EntityBuilderPublic<"character">;
  type(type: CommonSkillType): this;
  type(type: CommonSkillType | "passive"): any {
    if (type === "passive") {
      const builder = new EntityBuilder("character", this.skillId);
      builder._versionInfo = this._versionInfo;
      return builder;
    }
    if (type === "burst" || type === "technique") {
      this._gainEnergy = false;
    }
    this._skillType = type;
    return this;
  }

  /** 此定义未被使用。 */
  reserve(): void {}

  filter(
    pred: StrictInitiativeSkillFilter<"character", KindTs, AssociatedExt>,
  ): this {
    this.filters.push(pred);
    return this;
  }

  addTarget<Q extends TargetQuery>(
    targetQuery: Q,
  ): BuilderWithShortcut<
    InitiativeSkillBuilder<
      readonly [...KindTs, TargetKindOfQuery<Q>],
      AssociatedExt
    >
  > {
    this.addTargetImpl(targetQuery);
    return this as any;
  }

  done(): SkillHandle {
    registerInitiativeSkill({
      __definition: "initiativeSkills",
      type: "initiativeSkill",
      version: this._versionInfo,
      id: this.skillId,
      skill: {
        type: "skill",
        id: this.skillId,
        ownerType: "character",
        initiativeSkillConfig: {
          skillType: this._skillType,
          requiredCost: normalizeCost(this._cost),
          computed$costSize: costSize(this._cost),
          computed$diceCostSize: diceCostSize(this._cost),
          gainEnergy: this._gainEnergy,
          hidden: this._prepared,
          getTarget: this.buildTargetGetter(),
        },
        triggerOn: "initiative",
        action: this.buildAction(),
        filter: this.buildFilter(),
        usagePerRoundVariableName: null,
      },
    });
    return this.skillId as SkillHandle;
  }
}

export class TechniqueBuilder<
  Vars extends string,
  KindTs extends InitiativeSkillTargetKind,
  AssociatedExt extends ExtensionHandle,
  ParentFromCard extends boolean,
> extends SkillBuilderWithCost<{
  callerType: "equipment";
  callerVars: Vars;
  eventArgType: StrictInitiativeSkillEventArg<KindTs>;
  associatedExtension: AssociatedExt;
}> {
  private _usageOpt: { name: string; autoDecrease: boolean } | null = null;
  private _usagePerRoundOpt: {
    name: UsagePerRoundVariableNames;
    autoDecrease: boolean;
  } | null = null;

  constructor(
    id: number,
    private readonly parent: EntityBuilder<
      "equipment",
      Vars,
      AssociatedExt,
      ParentFromCard,
      any
    >,
  ) {
    super(id);
    this.associatedExtensionId = this.parent._associatedExtensionId;
  }

  addTarget<Q extends TargetQuery>(
    targetQuery: Q,
  ): BuilderWithShortcut<
    TechniqueBuilder<
      Vars,
      readonly [...KindTs, TargetKindOfQuery<Q>],
      AssociatedExt,
      ParentFromCard
    >
  > {
    this.addTargetImpl(targetQuery);
    return this as any;
  }

  usage<VarName extends string = "usage">(
    count: number,
    opt?: UsageOptions<VarName>,
  ): BuilderWithShortcut<
    TechniqueBuilder<Vars | VarName, KindTs, AssociatedExt, ParentFromCard>
  > {
    const perRound = opt?.perRound ?? false;
    const autoDecrease = opt?.autoDecrease ?? true;
    const name = this.parent._setUsage(count, opt);
    if (perRound) {
      if (this._usagePerRoundOpt !== null) {
        throw new GiTcgDataError("Cannot specify usagePerRound twice.");
      }
      if (
        !USAGE_PER_ROUND_VARIABLE_NAMES.includes(
          name as UsagePerRoundVariableNames,
        )
      ) {
        throw new GiTcgDataError(
          `Invalid usagePerRound variable name: ${name} (must be one of USAGE_PER_ROUND_VARIABLE_NAMES)`,
        );
      }
      this._usagePerRoundOpt = {
        name: name as UsagePerRoundVariableNames,
        autoDecrease,
      };
    } else {
      if (this._usageOpt !== null) {
        throw new GiTcgDataError("Cannot specify usage twice.");
      }
      this._usageOpt = { name, autoDecrease };
    }
    // 增加“检查可用次数”的技能触发条件
    this.filters.push((c) => c.self.getVariable(name) > 0);
    return this as any;
  }
  usagePerRound<VarName extends UsagePerRoundVariableNames = "usagePerRound">(
    count: number,
    opt?: Omit<UsageOptions<VarName>, "perRound">,
  ) {
    return this.usage<VarName>(count, {
      ...opt,
      perRound: true,
      visible: false,
    });
  }

  private buildSkill() {
    if (this._usagePerRoundOpt?.autoDecrease) {
      this.do((c) => {
        c.consumeUsagePerRound();
      });
    }
    if (this._usageOpt?.autoDecrease) {
      if (this._usageOpt.name === "usage") {
        // 若变量名为 usage，则消耗可用次数时可能调用 c.dispose
        // 使用 consumeUsage 方法实现相关操作
        this.do((c) => {
          c.consumeUsage();
        });
      } else {
        // 否则手动扣除使用次数
        const name = this._usageOpt.name;
        this.do((c) => {
          c.self.addVariable(name, -1);
        });
      }
    }
    const def: InitiativeSkillDefinition = {
      type: "skill",
      id: this.id,
      ownerType: "equipment",
      triggerOn: "initiative",
      initiativeSkillConfig: {
        skillType: "technique",
        requiredCost: normalizeCost(this._cost),
        computed$costSize: costSize(this._cost),
        computed$diceCostSize: diceCostSize(this._cost),
        gainEnergy: false,
        hidden: false,
        getTarget: this.buildTargetGetter(),
      },
      filter: this.buildFilter(),
      action: this.buildAction(),
      usagePerRoundVariableName: this._usagePerRoundOpt?.name ?? null,
    };
    this.parent._skillList.push(def);
  }

  endProvide() {
    this.buildSkill();
    return this.parent;
  }

  done() {
    this.buildSkill();
    return this.parent.done();
  }
}

export function skill(id: number) {
  return withShortcut(new InitiativeSkillBuilder(id));
}
