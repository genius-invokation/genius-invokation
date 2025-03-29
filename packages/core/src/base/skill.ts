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
  Reaction,
  PreviewData,
  type ReadonlyDiceRequirement,
  type DiceRequirement,
  type ExposedMutation,
  ActionValidity,
} from "@gi-tcg/typings";
import {
  type AnyState,
  type CardState,
  type CharacterState,
  type EntityState,
  type GameState,
  stringifyState,
} from "./state";
import type { CardTag, CardDefinition } from "./card";
import {
  REACTION_MAP,
  REACTION_RELATIVES,
  type SwirlableElement,
  getReaction,
  isReactionRelatedTo,
  isReactionSwirl,
} from "../base/reaction";
import type { CharacterDefinition } from "./character";
import { GiTcgCoreInternalError, GiTcgDataError } from "../error";
import type {
  EntityArea,
  EntityDefinition,
  EntityType,
  UsagePerRoundVariableNames,
} from "./entity";
import {
  costSize,
  diceCostOfCard,
  diceCostSize,
  getEntityArea,
  getEntityById,
  isCharacterInitiativeSkill,
  mixins,
  normalizeCost,
} from "../utils";
import type { Mutation } from "./mutation";
import type { IDetailLogger } from "../log";
import type { CustomEvent } from "./custom_event";

export interface SkillDefinitionBase<Arg> {
  readonly type: "skill";
  readonly ownerType: EntityType | "character" | "card" | "extension";
  readonly id: number;
  readonly action: SkillDescription<Arg>;
  readonly filter: SkillActionFilter<Arg>;
  readonly usagePerRoundVariableName: UsagePerRoundVariableNames | null;
}

export type StateMutationAndExposedMutation = {
  exposedMutations: ExposedMutation[];
  stateMutations: Mutation[];
};

export type SkillResult = {
  readonly emittedEvents: readonly EventAndRequest[];
  readonly innerNotify: StateMutationAndExposedMutation;
  readonly mainDamage: DamageInfo | null;
};

export const EMPTY_SKILL_RESULT: SkillResult = {
  emittedEvents: [],
  innerNotify: {
    exposedMutations: [],
    stateMutations: [],
  },
  mainDamage: null,
};

export type SkillDescriptionReturn = readonly [GameState, SkillResult];

export type SkillDescription<Arg> = (
  state: GameState,
  skillInfo: SkillInfo,
  arg: Arg,
) => SkillDescriptionReturn;

export type CommonSkillType = "normal" | "elemental" | "burst" | "technique";
export type SkillType = CommonSkillType | "playCard";

export type InitiativeSkillFilter = (
  state: GameState,
  skillInfo: SkillInfo,
  arg: InitiativeSkillEventArg,
) => boolean;

export interface InitiativeSkillEventArg {
  targets: AnyState[];
}

export type InitiativeSkillTargetGetter = (
  state: GameState,
  skillInfo: SkillInfo,
) => InitiativeSkillEventArg[];

export interface InitiativeSkillConfig {
  readonly skillType: SkillType;
  readonly requiredCost: ReadonlyDiceRequirement;
  readonly computed$costSize: number;
  readonly computed$diceCostSize: number;
  readonly gainEnergy: boolean;
  readonly hidden: boolean;
  readonly getTarget: InitiativeSkillTargetGetter;
}

export interface InitiativeSkillDefinition
  extends SkillDefinitionBase<InitiativeSkillEventArg> {
  readonly triggerOn: "initiative";
  readonly initiativeSkillConfig: InitiativeSkillConfig;
}

/** 使用 `defineSkillInfo` 创建 */
export interface SkillInfo {
  readonly caller: AnyState;
  readonly definition: SkillDefinition;
  /**
   * 若此技能通过 `requestSkill` 如准备技能或天赋牌触发，
   * 则此字段指定上述技能的 `SkillInfo`
   */
  readonly requestBy: SkillInfo | null;
  /** 重击 */
  readonly charged: boolean;
  /** 下落攻击 */
  readonly plunging: boolean;
  /** 准备技能 */
  readonly prepared: boolean;
  /**
   * 是否是预览中。部分技能会因是否为预览而采取不同的效果。
   */
  readonly isPreview: boolean;
  /** @internal */
  readonly logger?: IDetailLogger;
}
export interface InitiativeSkillInfo extends SkillInfo {
  readonly definition: InitiativeSkillDefinition;
}
export interface PlayCardSkillInfo extends InitiativeSkillInfo {
  readonly caller: CardState;
}

type RequiredWith<T, K extends keyof T> = T & Required<Pick<T, K>>;

type InitSkillInfo = RequiredWith<
  Partial<Omit<SkillInfo, "isPreview" | "mutatorConfig">>, // these properties will be added by SkillExecutor
  "caller" | "definition" // This is required for every skill info
>;

export function defineSkillInfo(
  init: InitSkillInfo & { caller: CardState },
): PlayCardSkillInfo;
export function defineSkillInfo(
  init: InitSkillInfo & { definition: InitiativeSkillDefinition },
): InitiativeSkillInfo;
export function defineSkillInfo(init: InitSkillInfo): SkillInfo;
export function defineSkillInfo(init: InitSkillInfo): SkillInfo {
  return {
    requestBy: null,
    charged: false,
    plunging: false,
    prepared: false,
    isPreview: false,
    ...init,
  };
}

export interface SkillInfoOfContextConstruction extends SkillInfo {
  /**
   * 当访问 setExtensionState 时操作的扩展点 id。
   * 在传入 SkillContext 时，由 SkillBuilder 指定好。
   */
  readonly associatedExtensionId: number | null;
}

export interface DamageInfo {
  readonly type: Exclude<DamageType, typeof DamageType.Heal>;
  readonly value: number;
  readonly source: AnyState;
  readonly via: SkillInfo;
  readonly target: CharacterState;
  readonly isSkillMainDamage: boolean;
  readonly causeDefeated: boolean;
  readonly fromReaction: Reaction | null;
  readonly log?: string;
}

export type HealKind =
  | "common" // 常规治疗
  | "revive" // 复苏
  | "distribution" // 平衡生命值（水与正义）
  | "increaseMaxHealth"; // 增加最大生命值（吞星之鲸）

export interface HealInfo {
  readonly type: typeof DamageType.Heal;
  readonly cancelled: boolean;
  readonly expectedValue: number;
  readonly value: number;
  readonly healKind: HealKind;
  readonly source: AnyState;
  readonly via: SkillInfo;
  readonly target: CharacterState;
  readonly fromReaction: null;
  readonly causeDefeated: false;
  readonly log?: string;
}

export interface ReactionInfo {
  readonly type: Reaction;
  readonly via: SkillInfo;
  readonly target: CharacterState;
  readonly fromDamage?: DamageInfo;
}

export interface UseSkillInfo {
  readonly type: "useSkill";
  readonly who: 0 | 1;
  readonly skill: InitiativeSkillInfo;
  readonly targets: AnyState[];
  readonly mainDamageTargetId?: number;
}

export interface PlayCardInfo {
  readonly type: "playCard";
  readonly who: 0 | 1;
  readonly skill: PlayCardSkillInfo;
  readonly targets: AnyState[];
  readonly willBeEffectless: boolean;
}

export interface SwitchActiveInfo {
  readonly type: "switchActive";
  readonly who: 0 | 1;
  readonly from: CharacterState;
  readonly via?: SkillInfo;
  readonly fromReaction: boolean;
  readonly to: CharacterState;
}

export interface ElementalTuningInfo {
  readonly type: "elementalTuning";
  readonly who: 0 | 1;
  readonly card: CardState;
  readonly result: DiceType;
}

export interface DeclareEndInfo {
  readonly type: "declareEnd";
  readonly who: 0 | 1;
}

export type ActionInfoBase =
  | UseSkillInfo
  | PlayCardInfo
  | SwitchActiveInfo
  | ElementalTuningInfo
  | DeclareEndInfo;

export type WithActionDetail<T extends ActionInfoBase> = T & {
  readonly cost: ReadonlyDiceRequirement;
  readonly fast: boolean;
  readonly validity: ActionValidity;
  readonly autoSelectedDice: DiceType[];
  readonly log?: string;
  readonly preview?: PreviewData[];
};
export type ActionInfo = WithActionDetail<ActionInfoBase>;

export interface EnterEventInfo {
  readonly newState: EntityState | CharacterState;
  readonly overridden: EntityState | null;
}

export class EventArg {
  _currentSkillInfo: SkillInfo | null = null;
  constructor(public readonly onTimeState: GameState) {}

  protected get caller(): AnyState {
    if (this._currentSkillInfo === null) {
      throw new GiTcgCoreInternalError("EventArg caller not set");
    }
    return this._currentSkillInfo.caller;
  }

  toString() {
    return "";
  }
}

export class PlayerEventArg extends EventArg {
  constructor(
    state: GameState,
    public readonly who: 0 | 1,
  ) {
    super(state);
  }
  toString() {
    return `player ${this.who}`;
  }
}

export class ModifyRollEventArg extends PlayerEventArg {
  _fixedDice: DiceType[] = [];
  _extraRerollCount = 0;
  _log = "";
  fixDice(type: DiceType, count: number): void {
    this._log += `${stringifyState(
      this.caller,
    )} fix ${count} [dice:${type}].\n`;
    this._fixedDice.push(...Array(count).fill(type));
  }

  addRerollCount(count: number): void {
    this._log += `${stringifyState(this.caller)} add reroll count ${count}.\n`;
    this._extraRerollCount += count;
  }
}

export class ActionEventArg<
  InfoT extends ActionInfoBase,
> extends PlayerEventArg {
  constructor(
    state: GameState,
    private readonly _action: WithActionDetail<InfoT>,
  ) {
    super(state, _action.who);
  }

  get action() {
    return this._action;
  }
  toString() {
    let text: string;
    switch (this.action.type) {
      case "useSkill":
        text = `use skill [skill:${this.action.skill.definition.id}]`;
        break;
      case "playCard":
        text = `play card ${stringifyState(this.action.skill.caller)}`;
        break;
      case "switchActive":
        text = `switch active character to ${stringifyState(this.action.to)}`;
        break;
      case "elementalTuning":
        text = `elemental tuning [dice:${this.action.result}]`;
        break;
      case "declareEnd":
        text = "declare end";
        break;
      default:
        text = "unknown action";
    }
    return `${this.action.who} ${text}, cost: ${JSON.stringify(
      this.action.cost,
    )}, fast: ${this.action.fast}`;
  }
  protected originalDiceCost(): ReadonlyDiceRequirement {
    if (
      (this.isUseSkill() || this.isPlayCard()) &&
      this.action.skill.definition.initiativeSkillConfig
    ) {
      return this.action.skill.definition.initiativeSkillConfig.requiredCost;
    } else {
      throw new GiTcgCoreInternalError("originalDiceCost not available");
    }
  }
  originalDiceCostSize(): number {
    if (
      (this.isUseSkill() || this.isPlayCard()) &&
      this.action.skill.definition.initiativeSkillConfig
    ) {
      return this.action.skill.definition.initiativeSkillConfig
        .computed$diceCostSize;
    } else {
      return 0;
    }
  }

  isSwitchActive(): this is ActionEventArg<SwitchActiveInfo> {
    return this.action.type === "switchActive";
  }
  isPlayCard(): this is ActionEventArg<PlayCardInfo> {
    return this.action.type === "playCard";
  }
  /** 是 `useSkill` 类型的行动，即使用主动技能或特技 */
  isUseSkill(): this is ActionEventArg<UseSkillInfo> {
    return this.action.type === "useSkill";
  }
  isDeclareEnd(): this is ActionEventArg<DeclareEndInfo> {
    return this.action.type === "declareEnd";
  }
  /** 是角色主动技能（而非特技） */
  isUseCharacterSkill(): this is ActionEventArg<UseSkillInfo> {
    return this.isUseSkill() && isCharacterInitiativeSkill(this.action.skill);
  }
  isUseTechnique(): this is ActionEventArg<UseSkillInfo> {
    return this.isSkillType("technique");
  }
  isSkillOrTalentOf(
    character: CharacterState,
    skillType?: CommonSkillType,
  ): boolean {
    if (this.isUseCharacterSkill()) {
      const skillDef = this.action.skill.definition;
      return (
        character.definition.skills.some((sk) => sk.id === skillDef.id) &&
        (!skillType || skillDef.initiativeSkillConfig.skillType === skillType)
      );
    } else if (this.isPlayCard()) {
      return !!(
        this.action.skill.caller.definition.tags.includes("talent") &&
        this.action.targets.find((target) => target.id === character.id)
      );
    } else {
      return false;
    }
  }

  isSkillType(skillType: CommonSkillType): boolean {
    if (this.isUseSkill()) {
      return (
        this.action.skill.definition.initiativeSkillConfig.skillType ===
        skillType
      );
    } else {
      return false;
    }
  }
  isChargedAttack(): this is ActionEventArg<UseSkillInfo> {
    return this.isUseSkill() && this.action.skill.charged;
  }
  isPlungingAttack(): this is ActionEventArg<UseSkillInfo> {
    return this.isUseSkill() && this.action.skill.plunging;
  }
  hasCardTag(tag: CardTag) {
    if (this.action.type === "playCard") {
      return this.action.skill.caller.definition.tags.includes(tag);
    } else {
      return false;
    }
  }
  hasOneOfCardTag(...tags: CardTag[]) {
    if (this.action.type === "playCard") {
      const action: PlayCardInfo = this.action;
      return tags.some((tag) =>
        action.skill.caller.definition.tags.includes(tag),
      );
    } else {
      return false;
    }
  }
}

export class ModifyActionEventArgBase<
  InfoT extends ActionInfoBase,
> extends ActionEventArg<InfoT> {
  protected _cost: DiceRequirement;
  protected _fast: boolean;
  protected _log = "";

  constructor(state: GameState, action: WithActionDetail<InfoT>) {
    super(state, action);
    this._cost = new Map(action.cost);
    this._fast = action.fast;
  }

  override get action(): WithActionDetail<InfoT> {
    return {
      ...super.action,
      cost: this.cost,
      fast: this.isFast(),
      log: this._log,
    };
  }

  get cost() {
    return normalizeCost(this._cost);
  }
  costSize() {
    return costSize(this.cost);
  }
  diceCostSize() {
    return diceCostSize(this.cost);
  }

  protected doDeductCost(availableType: DiceType[], count: number) {
    for (const type of availableType) {
      const currentCount = this._cost.get(type) ?? 0;
      this._cost.set(type, Math.max(0, currentCount - count));
      count -= currentCount;
      if (count <= 0) {
        return;
      }
    }
  }

  isFast() {
    return this._fast;
  }
  canDeductVoidCost() {
    return this.cost.has(DiceType.Void);
  }
  canDeductCostOfType(
    type: Exclude<DiceType, typeof DiceType.Omni | typeof DiceType.Void>,
  ) {
    return this.cost.has(type) || this.cost.has(DiceType.Void);
  }
  canDeductCost() {
    return this.cost.values().reduce((acc, v) => acc + v, 0) > 0;
  }
}

export class ModifyAction0EventArg<
  InfoT extends ActionInfoBase,
> extends ModifyActionEventArgBase<InfoT> {
  deductVoidCost(count: number) {
    this._log += `${stringifyState(
      this.caller,
    )} deduct ${count} [dice:0] from cost.\n`;
    this.doDeductCost([DiceType.Void], count);
  }

  addCost(type: DiceType, count: number) {
    this._log += `${stringifyState(
      this.caller,
    )} add ${count} [dice:${type}] to cost.\n`;
    if (type === DiceType.Omni) {
      // 增加 Omni 类型：假设原本要求为单色*n，增加该类型的元素骰
      const originalCost = this.originalDiceCost()
        .entries()
        .filter(([dice, cost]) => dice !== DiceType.Energy)
        .toArray();
      if (originalCost.length !== 1) {
        throw new GiTcgDataError(
          "Cannot addCost omni to action whose original dice requirement do not have single dice type",
        );
      }
      type = originalCost[0][0];
    }
    const currentCount = this._cost.get(type) ?? 0;
    this._cost.set(type, currentCount + count);
  }
}

export class ModifyAction1EventArg<
  InfoT extends ActionInfoBase,
> extends ModifyActionEventArgBase<InfoT> {
  deductCost(type: Exclude<DiceType, typeof DiceType.Omni>, count: number) {
    this._log += `${stringifyState(
      this.caller,
    )} deduct ${count} [dice:${type}] from cost.\n`;
    // 减有色骰子时：先检查此颜色，再检查无色
    this.doDeductCost([type, DiceType.Void], count);
  }
}

export class ModifyAction2EventArg<
  InfoT extends ActionInfoBase,
> extends ModifyActionEventArgBase<InfoT> {
  deductOmniCost(count: number) {
    this._log += `${stringifyState(
      this.caller,
    )} deduct ${count} [dice:8] from cost.\n`;
    this.doDeductCost(
      [
        DiceType.Aligned,
        DiceType.Cryo,
        DiceType.Hydro,
        DiceType.Pyro,
        DiceType.Electro,
        DiceType.Anemo,
        DiceType.Geo,
        DiceType.Dendro,
        DiceType.Void,
      ],
      count,
    );
  }
  setFastAction(): void {
    if (this._fast) {
      console?.warn("Potential error: fast action already set");
      console?.trace();
    }
    this._log += `${stringifyState(this.caller)} set fast action.\n`;
    this._fast = true;
  }
}

export class ModifyAction3EventArg<
  InfoT extends ActionInfoBase,
> extends ModifyActionEventArgBase<InfoT> {
  deductAllCost() {
    this._log += `${stringifyState(this.caller)} deduct all cost.\n`;
    this._cost = new Map();
  }
}

export const GenericModifyActionEventArg = mixins(ModifyActionEventArgBase, [
  ModifyAction0EventArg,
  ModifyAction1EventArg,
  ModifyAction2EventArg,
  ModifyAction3EventArg,
]);

export class SwitchActiveEventArg extends EventArg {
  constructor(
    state: GameState,
    public readonly switchInfo: SwitchActiveInfo,
  ) {
    super(state);
  }
  override toString() {
    let result = `player ${this.switchInfo.who}, switch from ${stringifyState(
      this.switchInfo.from,
    )} to ${stringifyState(this.switchInfo.to)}`;
    if (this.switchInfo.via) {
      result += `, via skill [skill:${this.switchInfo.via.definition.id}]`;
    }
    return result;
  }
}

export class UseSkillEventArg extends PlayerEventArg {
  constructor(
    state: GameState,
    public readonly callerArea: EntityArea,
    protected readonly _skillInfo: InitiativeSkillInfo,
  ) {
    super(state, callerArea.who);
  }
  get skill() {
    return this._skillInfo;
  }
  get skillCaller() {
    return this._skillInfo.caller as CharacterState | EntityState;
  }
  get techniqueCaller() {
    if (
      this._skillInfo.definition.initiativeSkillConfig.skillType !== "technique"
    ) {
      throw new GiTcgDataError(`techniqueCaller only available on technique`);
    }
    if (this.callerArea.type !== "characters") {
      throw new GiTcgCoreInternalError(
        `Technique callerArea not in character zone`,
      );
    }
    return getEntityById(
      this.onTimeState,
      this.callerArea.characterId,
    ) as CharacterState;
  }
  override toString(): string {
    return `use skill [skill:${this.skill.definition.id}]`;
  }
  isSkillType(skillType: CommonSkillType): boolean {
    return this.skill.definition.initiativeSkillConfig?.skillType === skillType;
  }
  isChargedAttack(): this is ActionEventArg<UseSkillInfo> {
    return this.skill.charged;
  }
  isPlungingAttack(): this is ActionEventArg<UseSkillInfo> {
    return this.skill.plunging;
  }
}

export class ModifyUseSkillEventArg extends UseSkillEventArg {
  private _forcePlunging = false;
  private _forceCharged = false;

  forcePlunging() {
    this._forcePlunging = true;
  }
  forceCharged() {
    this._forceCharged = true;
  }

  override get skill() {
    const skillInfo = super.skill;
    return {
      ...skillInfo,
      charged: this._forceCharged || skillInfo.charged,
      plunging: this._forcePlunging || skillInfo.plunging,
    };
  }
}

export class PlayCardEventArg extends PlayerEventArg {
  constructor(
    state: GameState,
    public readonly playCardInfo: PlayCardInfo,
  ) {
    super(state, playCardInfo.who);
  }
  get card() {
    return this.playCardInfo.skill.caller;
  }
  override toString() {
    return `play card ${stringifyState(this.card)}`;
  }
  hasCardTag(tag: CardTag) {
    return this.card.definition.tags.includes(tag);
  }
  hasOneOfCardTag(...tags: CardTag[]) {
    return tags.some((tag) => this.card.definition.tags.includes(tag));
  }
}

export class DamageOrHealEventArg<
  InfoT extends DamageInfo | HealInfo,
> extends EventArg {
  public readonly sourceWho: 0 | 1;
  public readonly targetWho: 0 | 1;
  constructor(
    state: GameState,
    private readonly _damageInfo: InfoT,
  ) {
    super(state);
    this.sourceWho = getEntityArea(state, _damageInfo.source.id).who;
    this.targetWho = getEntityArea(state, _damageInfo.target.id).who;
  }
  toString() {
    return stringifyDamageInfo(this.damageInfo).split("\n")[0];
  }

  get damageInfo() {
    return this._damageInfo;
  }
  isDamageTypeDamage(): this is DamageOrHealEventArg<DamageInfo> {
    return !this.isDamageTypeHeal();
  }
  isDamageTypeHeal(): this is DamageOrHealEventArg<HealInfo> {
    return this._damageInfo.type === DamageType.Heal;
  }

  get source() {
    return this.damageInfo.source;
  }
  get target() {
    return this.damageInfo.target;
  }
  get type() {
    return this.damageInfo.type;
  }
  get value() {
    return this.damageInfo.value;
  }
  get via() {
    return this.damageInfo.via;
  }
  getReaction(): Reaction | null {
    if (!this.isDamageTypeDamage()) {
      return null;
    }
    return getReaction(this.damageInfo as DamageInfo);
  }
  isReactionRelatedTo(target: DamageType): boolean {
    if (!this.isDamageTypeDamage()) {
      return false;
    }
    return isReactionRelatedTo(this.damageInfo as DamageInfo, target);
  }
  isSwirl(): SwirlableElement | null {
    if (!this.isDamageTypeDamage()) {
      return null;
    }
    return isReactionSwirl(this.damageInfo as DamageInfo);
  }
  viaSkillType(skillType: CommonSkillType): boolean {
    return this.via.definition.initiativeSkillConfig?.skillType === skillType;
  }
  viaChargedAttack(): boolean {
    return this.via.charged;
  }
  viaPlungingAttack(): boolean {
    return this.via.plunging;
  }
  get log() {
    return this.damageInfo.log ?? "";
  }
}

class ModifyHealEventArgBase extends DamageOrHealEventArg<HealInfo> {
  protected _increased = 0;
  protected _decreased = 0;
  protected _cancelled = false;
  protected _log = super.damageInfo.log ?? "";

  get cancelled() {
    return this._cancelled;
  }

  override get damageInfo(): HealInfo {
    const healInfo = super.damageInfo;
    const expectedValue = Math.max(
      0,
      Math.ceil(healInfo.expectedValue + this._increased - this._decreased),
    );
    const targetLoss =
      healInfo.target.variables.maxHealth - healInfo.target.variables.health;
    const value = Math.min(expectedValue, targetLoss);
    return {
      ...healInfo,
      expectedValue,
      value,
      cancelled: this._cancelled,
      log: this._log,
    };
  }
  get healInfo() {
    return this.damageInfo;
  }
  get expectedValue() {
    return this.healInfo.expectedValue;
  }
}

export class ModifyHeal1EventArg extends ModifyHealEventArgBase {
  // increaseHeal(value: number) {
  //   this._log += `${stringifyState(this.caller)} increase heal by ${value}.\n`;
  //   this._increased += value;
  // }
  decreaseHeal(value: number) {
    if (this._cancelled) {
      return;
    }
    this._log += `${stringifyState(this.caller)} decrease heal by ${value}.\n`;
    this._decreased += value;
  }
}

export class ModifyHeal0EventArg extends ModifyHealEventArgBase {
  cancel() {
    this._log += `${stringifyState(this.caller)} cancel the heal.\n`;
    this._cancelled = true;
  }
}

export const GenericModifyHealEventArg = mixins(ModifyHealEventArgBase, [
  ModifyHeal0EventArg,
  ModifyHeal1EventArg,
]);

export class ModifyDamageEventArgBase extends DamageOrHealEventArg<DamageInfo> {
  protected _newDamageType: Exclude<DamageType, typeof DamageType.Heal> | null =
    null;
  protected _increased = 0;
  protected _multiplied: number | null = null;
  protected _divider = 1;
  protected _decreased = 0;
  protected _log = "";

  override get damageInfo(): DamageInfo {
    const targetHealth = super.damageInfo.target.variables.health;
    const type = this._newDamageType ?? super.damageInfo.type;
    let value = super.damageInfo.value;
    value = value + this._increased; // 加
    const multiplier = (this._multiplied ?? 1) / this._divider;
    value = Math.ceil(value * multiplier); // 乘除
    value = Math.max(0, value - this._decreased); // 减
    return {
      ...super.damageInfo,
      type,
      value,
      causeDefeated: value >= targetHealth,
      log: this._log,
    };
  }
}

export class ModifyDamage0EventArg extends ModifyDamageEventArgBase {
  changeDamageType(type: Exclude<DamageType, typeof DamageType.Heal>) {
    this._log += `${stringifyState(
      this.caller,
    )} change damage type from [damage:${
      super.damageInfo.type
    }] to [damage:${type}].\n`;
    if (this._newDamageType !== null) {
      console?.warn("Potential error: damage type already changed");
      console?.trace();
    }
    this._newDamageType = type;
  }
}

export class ModifyDamageByReactionEventArg extends ModifyDamageEventArgBase {
  increaseDamageByReaction() {
    const damageInfo = super.damageInfo;
    const targetAura = damageInfo.target.variables.aura;
    if (
      damageInfo.type === DamageType.Physical ||
      damageInfo.type === DamageType.Piercing
    ) {
      return;
    }
    const [, reaction] = REACTION_MAP[targetAura][damageInfo.type];
    switch (reaction) {
      case Reaction.Melt:
      case Reaction.Vaporize:
      case Reaction.Overloaded:
        this._increased += 2;
        this._log += `${
          damageInfo.log ?? ""
        }Reaction (${reaction}) increase damage by 2\n`;
        break;
      case Reaction.Superconduct:
      case Reaction.ElectroCharged:
      case Reaction.Frozen:
      case Reaction.CrystallizeCryo:
      case Reaction.CrystallizeHydro:
      case Reaction.CrystallizePyro:
      case Reaction.CrystallizeElectro:
      case Reaction.Burning:
      case Reaction.Bloom:
      case Reaction.Quicken:
        this._increased += 1;
        this._log += `${damageInfo.log}\nReaction (${reaction}) increase damage by 1`;
        break;
      default:
        // do nothing
        break;
    }
  }
}

export class ModifyDamage1EventArg extends ModifyDamageEventArgBase {
  increaseDamage(value: number) {
    this._log += `${stringifyState(
      this.caller,
    )} increase damage by ${value}.\n`;
    this._increased += value;
  }
}

export class ModifyDamage2EventArg extends ModifyDamageEventArgBase {
  multiplyDamage(multiplier: number) {
    this._log += `${stringifyState(
      this.caller,
    )} multiply damage by ${multiplier}.\n`;
    // WTF are u kidding me, mhy?
    this._multiplied = (this._multiplied ?? 0) + multiplier;
  }
  divideDamage(divider: number) {
    this._log += `${stringifyState(
      this.caller,
    )} divide damage by ${divider}.\n`;
    this._divider *= divider;
  }
}

export class ModifyDamage3EventArg extends ModifyDamageEventArgBase {
  decreaseDamage(value: number) {
    this._log += `${stringifyState(
      this.caller,
    )} decrease damage by ${value}.\n`;
    this._decreased += value;
  }
}

export const GenericModifyDamageEventArg = mixins(ModifyDamageEventArgBase, [
  ModifyDamage0EventArg,
  ModifyDamageByReactionEventArg,
  ModifyDamage1EventArg,
  ModifyDamage2EventArg,
  ModifyDamage3EventArg,
]);

export class EntityEventArg<T extends AnyState = AnyState> extends EventArg {
  public readonly area: EntityArea;
  public readonly who: 0 | 1;
  constructor(
    state: GameState,
    public readonly entity: T,
  ) {
    super(state);
    this.area = getEntityArea(state, entity.id);
    this.who = this.area.who;
  }
  toString(): string {
    return stringifyState(this.entity);
  }
}

export class EnterEventArg extends EntityEventArg {
  constructor(
    state: GameState,
    private readonly enterInfo: EnterEventInfo,
  ) {
    super(state, enterInfo.newState);
  }

  get overridden() {
    return this.enterInfo.overridden;
  }
  toString(): string {
    return `${super.toString()}, overridden: ${!!this.enterInfo.overridden}`;
  }
}

export class DisposeEventArg extends EntityEventArg<EntityState> {}

export class DisposeOrTuneCardEventArg extends EntityEventArg<CardState> {
  constructor(
    state: GameState,
    public readonly card: CardState,
    public readonly method: DisposeOrTuneMethod,
  ) {
    super(state, card);
  }

  diceCost() {
    return diceCostOfCard(this.card.definition);
  }
  override toString(): string {
    return `player ${this.who} ${this.method} card ${stringifyState(
      this.card,
    )}`;
  }
}

export class CharacterEventArg extends EventArg {
  public readonly who: 0 | 1;
  constructor(
    state: GameState,
    public readonly character: CharacterState,
  ) {
    super(state);
    this.who = getEntityArea(state, character.id).who;
  }
  toString() {
    return stringifyState(this.character);
  }
}

export class ReactionEventArg extends CharacterEventArg {
  constructor(
    state: GameState,
    public readonly reactionInfo: ReactionInfo,
  ) {
    super(state, reactionInfo.target);
  }

  get caller() {
    return this.reactionInfo.via.caller;
  }
  get target() {
    return this.reactionInfo.target;
  }
  get type() {
    return this.reactionInfo.type;
  }

  /** 是否为“角色引发的” */
  viaCharacterSkill() {
    return isCharacterInitiativeSkill(this.reactionInfo.via);
  }

  relatedTo(target: DamageType): boolean {
    return REACTION_RELATIVES[this.type].includes(target);
  }
  toString(): string {
    return `[reaction:${this.reactionInfo.type}] occurred on ${stringifyState(
      this.reactionInfo.target,
    )} via skill [skill:${this.reactionInfo.via.definition.id}]`;
  }
}

export interface ImmuneInfo {
  skill: SkillInfo;
  newHealth: number;
}

export class ZeroHealthEventArg extends ModifyDamage1EventArg {
  _immuneInfo: null | ImmuneInfo = null;
  _log = "";

  immune(newHealth: number) {
    this._log += `${stringifyState(
      this.caller,
    )} makes the character immune to defeated, and heals him to ${newHealth}.\n`;
    this._immuneInfo = {
      skill: this._currentSkillInfo!,
      newHealth,
    };
  }

  override get damageInfo(): DamageInfo {
    const damageInfo = super.damageInfo;
    return {
      ...damageInfo,
      causeDefeated: damageInfo.causeDefeated && this._immuneInfo === null,
    };
  }
}

export class TransformDefinitionEventArg extends EventArg {
  public readonly who: 0 | 1;
  public readonly oldDefinition: CharacterDefinition | EntityDefinition;
  constructor(
    state: GameState,
    public readonly entity: CharacterState | EntityState,
    public readonly newDefinition: CharacterDefinition | EntityDefinition,
  ) {
    super(state);
    const area = getEntityArea(state, entity.id);
    this.who = area.who;
    this.oldDefinition = entity.definition;
  }
}

export type HandCardInsertedReason = "drawn" | "stolen" | "created";

export class HandCardInsertedEventArg extends PlayerEventArg {
  constructor(
    state: GameState,
    who: 0 | 1,
    public readonly card: CardState,
    public readonly reason: HandCardInsertedReason,
  ) {
    super(state, who);
  }

  override toString(): string {
    return `player ${this.who} draw card ${stringifyState(this.card)}`;
  }
}

export type DisposeOrTuneMethod =
  | "disposeFromHands"
  | "disposeFromPiles"
  | "elementalTuning"
  | "onDrawTriggered";

export class GenerateDiceEventArg extends PlayerEventArg {
  constructor(
    state: GameState,
    who: 0 | 1,
    public readonly via: SkillInfo,
    public readonly dice: DiceType,
  ) {
    super(state, who);
  }

  override toString(): string {
    return `player ${this.who} generate dice [dice:${this.dice}]`;
  }
}

export interface ConsumeNightsoulInfo {
  oldValue: number;
  consumedValue: number;
  newValue: number;
}

export class ConsumeNightsoulEventArg extends CharacterEventArg {
  constructor(
    state: GameState,
    character: CharacterState,
    public readonly info: ConsumeNightsoulInfo,
  ) {
    super(state, character);
  }
}

export class SelectCardEventArg extends PlayerEventArg {
  constructor(
    state: GameState,
    who: 0 | 1,
    public readonly selectInfo: SelectCardInfo,
  ) {
    super(state, who);
  }
}

export class CustomEventEventArg<T = unknown> extends EntityEventArg {
  constructor(
    state: GameState,
    entity: AnyState,
    public readonly customEvent: CustomEvent<T>,
    public readonly arg: T,
  ) {
    super(state, entity);
  }

  toString() {
    return `${this.customEvent.name}, ${this.arg}`;
  }
}

export const EVENT_MAP = {
  onBattleBegin: EventArg,
  onRoundBegin: EventArg,
  onRoundEnd: EventArg,

  modifyRoll: ModifyRollEventArg,
  onActionPhase: EventArg,
  onEndPhase: EventArg,

  replaceAction: EventArg,

  onBeforeAction: PlayerEventArg,
  modifyAction0: ModifyAction0EventArg, // 增骰、减无色
  modifyAction1: ModifyAction1EventArg, // 减有色
  modifyAction2: ModifyAction2EventArg, // 减任意、快速行动
  modifyAction3: ModifyAction3EventArg, // 蒂玛乌斯 & 瓦格纳
  onAction: ActionEventArg,

  onBeforeUseSkill: UseSkillEventArg,
  // modifyUseSkill: ModifyUseSkillEventArg,
  onUseSkill: UseSkillEventArg,
  onBeforePlayCard: PlayCardEventArg,
  onPlayCard: PlayCardEventArg,
  onDisposeOrTuneCard: DisposeOrTuneCardEventArg,

  onSwitchActive: SwitchActiveEventArg,
  onHandCardInserted: HandCardInsertedEventArg,
  onReaction: ReactionEventArg,
  onTransformDefinition: TransformDefinitionEventArg,
  onGenerateDice: GenerateDiceEventArg,
  onConsumeNightsoul0: ConsumeNightsoulEventArg,
  onConsumeNightsoul1: ConsumeNightsoulEventArg,
  onSelectCard: SelectCardEventArg,

  modifyDamage0: ModifyDamage0EventArg, // 类型
  modifyDamage1: ModifyDamage1EventArg, // 加
  modifyDamage2: ModifyDamage2EventArg, // 乘除
  modifyDamage3: ModifyDamage3EventArg, // 减
  modifyHeal0: ModifyHeal0EventArg, // 取消（克洛琳德）
  modifyHeal1: ModifyHeal1EventArg, // 减（生命之契）
  onDamageOrHeal: DamageOrHealEventArg,

  onEnter: EnterEventArg,
  onDispose: DisposeEventArg,

  modifyZeroHealth: ZeroHealthEventArg,
  onRevive: CharacterEventArg,

  onCustomEvent: CustomEventEventArg,
} satisfies Record<string, new (...args: any[]) => EventArg>;

export type EventMap = typeof EVENT_MAP;
export type EventNames = keyof EventMap;

export type InlineEventNames =
  | "modifyDamage0"
  | "modifyDamage1"
  | "modifyDamage2"
  | "modifyDamage3"
  | "modifyHeal0"
  | "modifyHeal1";

export type EventArgOf<E extends EventNames> = InstanceType<EventMap[E]>;

class RequestArg {
  constructor(public readonly via: SkillInfo) {}
}

class SwitchHandsRequestArg extends RequestArg {
  constructor(
    via: SkillInfo,
    public readonly who: 0 | 1,
  ) {
    super(via);
  }
}

export type SelectCardInfo =
  | {
      readonly type: "createHandCard";
      readonly cards: readonly CardDefinition[];
    }
  | {
      readonly type: "createEntity";
      readonly cards: readonly EntityDefinition[];
    }
  | {
      readonly type: "requestPlayCard";
      readonly cards: readonly CardDefinition[];
      /** 使用手牌的目标 */
      readonly targets: AnyState[];
    };

class SelectCardRequestArg extends RequestArg {
  constructor(
    via: SkillInfo,
    public readonly who: 0 | 1,
    public readonly info: SelectCardInfo,
  ) {
    super(via);
  }
}

class RerollRequestArg extends RequestArg {
  constructor(
    via: SkillInfo,
    public readonly who: 0 | 1,
    public readonly times: number,
  ) {
    super(via);
  }
}

export interface UseSkillRequestOption {
  // 该技能是否将作为“准备技能”打出
  asPrepared?: boolean;
}

class UseSkillRequestArg extends RequestArg {
  constructor(
    requestBy: SkillInfo,
    public readonly who: 0 | 1,
    public readonly requestingSkillId: number,
    public readonly requestOption: UseSkillRequestOption,
  ) {
    super(requestBy);
  }
}

export class PlayCardRequestArg extends RequestArg {
  constructor(
    requestBy: SkillInfo,
    public readonly who: 0 | 1,
    public readonly cardDefinition: CardDefinition,
    public readonly targets: AnyState[],
  ) {
    super(requestBy);
  }
}

class TriggerEndPhaseSkillRequestArg extends RequestArg {
  constructor(
    requestBy: SkillInfo,
    public readonly who: 0 | 1,
    public readonly requestedEntity: EntityState,
  ) {
    super(requestBy);
  }
}

const REQUEST_MAP = {
  requestSwitchHands: SwitchHandsRequestArg,
  requestSelectCard: SelectCardRequestArg,
  requestReroll: RerollRequestArg,
  requestUseSkill: UseSkillRequestArg,
  requestPlayCard: PlayCardRequestArg,
  requestTriggerEndPhaseSkill: TriggerEndPhaseSkillRequestArg,
} satisfies Record<string, new (...args: any[]) => RequestArg>;
type RequestMap = typeof REQUEST_MAP;
type RequestNames = keyof RequestMap;

export type EventAndRequestNames = EventNames | RequestNames;
type EventAndRequestMap = EventMap & RequestMap;

export type EventAndRequestConstructorArgs<E extends EventAndRequestNames> =
  ConstructorParameters<EventAndRequestMap[E]>;

export type EventAndRequestArgOf<E extends EventAndRequestNames> = InstanceType<
  EventAndRequestMap[E]
>;

export function constructEventAndRequestArg<E extends EventAndRequestNames>(
  event: E,
  ...args: EventAndRequestConstructorArgs<E>
): EventAndRequestArgOf<E> {
  const Ctor = {
    ...EVENT_MAP,
    ...REQUEST_MAP,
  }[event] as new (...args: any[]) => EventAndRequestArgOf<E>;
  return new Ctor(...args);
}

export type EventAndRequest = {
  [E in EventAndRequestNames]: [E, EventAndRequestArgOf<E>];
}[EventAndRequestNames];

export type Event = {
  [E in EventNames]: [E, EventArgOf<E>];
}[EventNames];

export type SkillActionFilter<Arg> = (
  state: GameState,
  skillInfo: SkillInfo,
  arg: Arg,
) => boolean;

export interface TriggeredSkillDefinition<E extends EventNames = EventNames>
  extends SkillDefinitionBase<EventArgOf<E>> {
  readonly triggerOn: E;
  readonly initiativeSkillConfig: null;
}

export type SkillDefinition =
  | InitiativeSkillDefinition
  | TriggeredSkillDefinition;

export function stringifyDamageInfo(damage: DamageInfo | HealInfo): string {
  if (damage.type === DamageType.Heal) {
    let result = `${stringifyState(damage.source)} heal ${
      damage.value
    } to ${stringifyState(damage.target)}, via skill [skill:${
      damage.via.definition.id
    }]`;
    result += ` (${damage.healKind})`;
    return result;
  } else {
    let result = `${stringifyState(damage.source)} deal ${
      damage.value
    } [damage:${damage.type}] to ${stringifyState(
      damage.target,
    )}, via skill [skill:${damage.via.definition.id}]`;
    return result;
  }
}
