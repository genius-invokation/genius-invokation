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

import type { EntityState, GameState } from "../base/state";
import type {
  CardTag,
  InitiativeSkillTargetKind,
  CardType,
  SupportTag,
  WeaponCardTag,
  CardDefinition,
} from "../base/card";
import type {
  DescriptionDictionary,
  DescriptionDictionaryEntry,
  DescriptionDictionaryKey,
} from "../base/entity";
import {
  type DisposeOrTuneCardEventArg,
  EMPTY_SKILL_RESULT,
  type HandCardInsertedEventArg,
  type InitiativeSkillDefinition,
  type InitiativeSkillEventArg,
  type SkillActionFilter,
  type SkillDefinition,
  type SkillDescription,
  type TriggeredSkillDefinition,
} from "../base/skill";
import { registerCard } from "./registry";
import {
  SkillBuilderWithCost,
  withShortcut,
  type BuilderWithShortcut,
  type SkillOperation,
  type StrictInitiativeSkillEventArg,
  type StrictInitiativeSkillFilter,
} from "./skill";
import type {
  CardHandle,
  CharacterHandle,
  CombatStatusHandle,
  EquipmentHandle,
  ExtensionHandle,
  StatusHandle,
  SupportHandle,
} from "./type";
import { EntityBuilder, type EntityBuilderPublic } from "./entity";
import type { GuessedTypeOfQuery } from "../query/types";
import { GiTcgDataError } from "../error";
import { costSize, diceCostSize, normalizeCost, type Writable } from "../utils";
import {
  type Version,
  type VersionInfo,
  type VersionMetadata,
  DEFAULT_VERSION_INFO,
} from "../base/version";

type DisposeCardBuilderMeta<AssociatedExt extends ExtensionHandle> = {
  callerType: "card";
  callerVars: never;
  eventArgType: DisposeOrTuneCardEventArg;
  associatedExtension: AssociatedExt;
};

type HCICardBuilderMeta<AssociatedExt extends ExtensionHandle> = {
  callerType: "card";
  callerVars: never;
  eventArgType: HandCardInsertedEventArg;
  associatedExtension: AssociatedExt;
};

export type TargetQuery =
  | `${string}character${string}`
  | `${string}summon${string}`
  | `${string}support${string}`;
export type TargetKindOfQuery<Q extends TargetQuery> = GuessedTypeOfQuery<Q>;

const SATIATED_ID = 303300 as StatusHandle;

type TalentRequirement = "action" | "actionSkill" | "active" | "none";

export interface FoodOption {
  /** 只允许对受伤角色打出 */
  injuredOnly?: boolean;
  /** 指定后不附着饱腹状态 */
  noSatiated?: boolean;
}
export interface CombatFoodOption {
  /**
   * - `existsNot`: 存在无饱腹角色时可打出（默认值）
   * - `allNot`: 所有角色都没有饱腹状态时可打出
   */
  satiatedFilter?: "existsNot" | "allNot";
}

export interface NightsoulTechniqueOption {
  /**
   * 若可存在于手牌中，则指定打出目标。
   * 默认为 `my characters`，即 `technique()` 的默认目标。
   */
  target?: string;
  /**
   * 弃置自身时同时弃置夜魂加持状态
   * @default true
   */
  alsoDisposeNightsoulsBlessing?: boolean;
}

type CardArea = { readonly who: 0 | 1 };
type CardDescriptionDictionaryGetter<AssociatedExt extends ExtensionHandle> = (
  st: GameState,
  self: { readonly area: CardArea },
  ext: AssociatedExt["type"],
) => string | number;

export class CardBuilder<
  KindTs extends InitiativeSkillTargetKind,
  AssociatedExt extends ExtensionHandle = never,
> extends SkillBuilderWithCost<{
  callerType: "card";
  callerVars: never;
  eventArgType: StrictInitiativeSkillEventArg<KindTs>;
  associatedExtension: AssociatedExt;
}> {
  private _type: CardType = "event";
  private _obtainable = true;
  private _tags: CardTag[] = [];
  /**
   * 在料理卡牌的行动结尾添加“设置饱腹状态”操作的目标；
   * `null` 表明不添加（不是料理牌或者手动指定）
   */
  private _satiatedTarget: string | null = null;
  private _descriptionOnHCI = false;
  private _doSameWhenDisposed = false;
  private _disposeOperation: SkillOperation<
    DisposeCardBuilderMeta<AssociatedExt>
  > | null = null;
  private _hciOperation: SkillOperation<
    HCICardBuilderMeta<AssociatedExt>
  > | null = null;
  private _descriptionDictionary: Writable<DescriptionDictionary> = {};

  constructor(private readonly cardId: number) {
    super(cardId);
  }

  private _versionInfo: VersionInfo = DEFAULT_VERSION_INFO;
  setVersionInfo<From extends keyof VersionMetadata>(
    from: From,
    value: VersionMetadata[From],
  ) {
    this._versionInfo = { from, value };
    return this;
  }
  since(version: Version) {
    return this.setVersionInfo("official", { predicate: "since", version });
  }
  until(version: Version) {
    return this.setVersionInfo("official", { predicate: "until", version });
  }

  /** 此定义未被使用。 */
  reserve(): void {}

  replaceDescription(
    key: DescriptionDictionaryKey,
    getter: CardDescriptionDictionaryGetter<AssociatedExt>,
  ): this {
    if (Reflect.has(this._descriptionDictionary, key)) {
      throw new GiTcgDataError(`Description key ${key} already exists`);
    }
    const extId = this.associatedExtensionId;
    const entry: DescriptionDictionaryEntry = function (st, id) {
      const ext = st.extensions.find((ext) => ext.definition.id === extId);
      const who = st.players[0].hands.find((c) => c.id === id) ? 0 : 1;
      return String(getter(st, { area: { who } }, ext?.state));
    };
    this._descriptionDictionary[key] = entry;
    return this;
  }

  associateExtension<NewExtT>(
    ext: ExtensionHandle<NewExtT>,
  ): BuilderWithShortcut<CardBuilder<KindTs, ExtensionHandle<NewExtT>>> {
    if (this.associatedExtensionId !== null) {
      throw new GiTcgDataError(
        `This card has already associated with extension ${this.id}`,
      );
    }
    this.associatedExtensionId = ext;
    return this as any;
  }

  tags(...tags: CardTag[]): this {
    this._tags.push(...tags);
    return this;
  }
  type(type: CardType): this {
    this._type = type;
    return this;
  }

  unobtainable(): this {
    this._obtainable = false;
    return this;
  }

  equipment<Q extends TargetQuery>(
    target: Q,
  ): EntityBuilderPublic<"equipment"> {
    const cardId = this.cardId as EquipmentHandle;
    this.type("equipment")
      .addTarget(target)
      .do((c) => {
        const ch = c.$("character and @targets.0");
        const caller = c.skillInfo.caller;
        ch?.equip(cardId, {
          fromCardId: caller.definition.type === "card" ? caller.id : void 0,
        });
      })
      .done();
    const builder = new EntityBuilder<"equipment", never, never, false, {}>(
      "equipment",
      cardId,
    );
    builder._versionInfo = this._versionInfo;
    return builder;
  }
  weapon(type: WeaponCardTag) {
    return this.tags("weapon", type)
      .equipment(`my characters with tag (${type})`)
      .tags("weapon", type);
  }
  artifact() {
    return this.tags("artifact").equipment("my characters").tags("artifact");
  }
  technique(targetQuery = "my characters") {
    return this.tags("technique")
      .equipment(targetQuery as "character")
      .tags("technique");
  }

  /**
   * 带有夜魂性质的特技：
   * 所附属角色「夜魂值」为0时，弃置此牌；此牌被弃置时，所附属角色结束夜魂加持。
   */
  nightsoulTechnique(option: NightsoulTechniqueOption = {}) {
    const { alsoDisposeNightsoulsBlessing = true, target } = option;
    const self = this.unobtainable()
      .technique(target)
      .on("beforeAction")
      .listenToAll()
      .do((c) => {
        const st = c.$(`status with tags (nightsoulsBlessing) at @master`);
        if (st && st.getVariable("nightsoul") <= 0) {
          c.dispose();
        }
      })
      .endOn();
    if (alsoDisposeNightsoulsBlessing) {
      self
        .on("selfDispose")
        .do((c, e) => {
          if (e.area.type !== "characters") {
            return;
          }
          c
            .$(
              `status with tags (nightsoulsBlessing) at with id ${e.area.characterId}`,
            )
            ?.dispose();
        })
        .endOn();
    }
    return self;
  }

  support(...tags: SupportTag[]): EntityBuilderPublic<"support"> {
    this.type("support");
    if (tags.length > 0) {
      this.tags(...tags);
    }
    const cardId = this.cardId as SupportHandle;
    this.do((c, e) => {
      // 支援牌的目标是要弃置的支援区卡牌
      const targets = e.targets as readonly EntityState[];
      if (targets.length > 0 && c.$(`my support with id ${targets[0].id}`)) {
        c.dispose(targets[0]);
      }
      const caller = c.skillInfo.caller;
      c.createEntity("support", cardId, void 0, {
        // 当从手牌打出支援牌时传入手牌 id
        // （并非从手牌打出的情况：selectAndPlay 直接在挑选后调用）
        fromCardId:
          caller.definition.type === "card" ? c.skillInfo.caller.id : void 0,
      });
    }).done();
    const builder = new EntityBuilder<"support", never, never, false, {}>(
      "support",
      cardId,
    );
    if (tags.length > 0) {
      builder.tags(...tags);
    }
    builder._versionInfo = this._versionInfo;
    return builder;
  }

  adventureSpot(): EntityBuilderPublic<"support", "progress"> {
    return this.unobtainable()
      .support("place", "adventureSpot")
      .variable("progress", 1);
  }

  /**
   * 添加“打出后生成出战状态”的操作。
   *
   * 此调用后，卡牌描述结束；接下来的 builder 将描述出战状态。
   * @param id 出战状态定义 id；默认与卡牌定义 id 相同
   * @returns 出战状态 builder
   */
  toCombatStatus(id: number, where: "my" | "opp" = "my") {
    id ??= this.cardId;
    this.do((c) => {
      c.combatStatus(id as CombatStatusHandle, where);
    }).done();
    const builder = new EntityBuilder<
      "combatStatus",
      never,
      never,
      true,
      never
    >("combatStatus", id, this.id);
    builder._versionInfo = this._versionInfo;
    return builder;
  }
  /**
   * 添加“打出后为某角色附着状态”的操作。
   *
   * 此调用后，卡牌描述结束；接下来的 builder 将描述状态。
   * @param target 要附着的角色（查询）
   * @param id 状态定义 id
   * @returns 状态 builder
   */
  toStatus(id: number, target: string) {
    id ??= this.cardId;
    this.do((c) => {
      c.characterStatus(id as StatusHandle, target);
    }).done();
    const builder = new EntityBuilder<"status", never, never, true, never>(
      "status",
      id,
      this.id,
    );
    builder._versionInfo = this._versionInfo;
    return builder;
  }

  addTarget<Q extends TargetQuery>(
    targetQuery: Q,
  ): BuilderWithShortcut<
    CardBuilder<readonly [...KindTs, TargetKindOfQuery<Q>], AssociatedExt>
  > {
    this.addTargetImpl(targetQuery);
    return this as any;
  }

  legend(): this {
    return this.tags("legend").filter((c) => !c.player.legendUsed);
  }

  /**
   * 执行通用的天赋牌准备工作。
   * - 设置 talent 标签
   * - 若是出战行动，设置 action 标签
   * - 设置牌组需求
   * - 若要求该角色出战，则设置 filter
   * @returns 打出目标需求
   */
  private prepareTalent(
    ch: CharacterHandle | CharacterHandle[],
    requires: TalentRequirement,
  ): `${string} character ${string}` {
    this.tags("talent");
    let extraCond = "";
    if (requires === "action" || requires === "actionSkill") {
      this.tags("action");
    }
    if (requires === "actionSkill") {
      // 出战行动的天赋牌，要求目标未被控制
      extraCond = "and not has status with tag (disableSkill)";
    }
    let chs: CharacterHandle[];
    if (Array.isArray(ch)) {
      chs = ch;
    } else {
      chs = [ch];
    }
    if (requires !== "none") {
      // 出战角色须为天赋角色
      this.filter((c) =>
        chs.includes(c.$("my active")!.definition.id as CharacterHandle),
      );
    }

    return chs
      .map((c) => `(my characters with definition id ${c} ${extraCond})`)
      .join(" or ") as any;
  }

  talent(
    ch: CharacterHandle | CharacterHandle[],
    requires: TalentRequirement = "actionSkill",
  ) {
    const equipQuery = this.prepareTalent(ch, requires);
    return this.equipment(equipQuery).tags("talent");
  }

  eventTalent(
    ch: CharacterHandle | CharacterHandle[],
    requires: TalentRequirement = "action",
  ) {
    const targetQuery = this.prepareTalent(ch, requires);
    return this.addTarget(targetQuery);
  }

  /** 增加 food 标签；设置目标为我方非饱腹角色 */
  food(opt: FoodOption = {}) {
    if (!opt.noSatiated) {
      this._satiatedTarget = "@targets.0";
    }
    let targetFilter =
      "(my characters and not has status with definition id 303300)";
    if (opt?.injuredOnly) {
      targetFilter += ` and (characters with health < maxHealth)`;
    }
    return this.tags("food").addTarget(targetFilter as "characters");
  }

  /**
   * 增加 food 标签。通常为剩余没有饱腹的角色附着效果，使用如下 query 获得这些角色：
   * `my characters and not has status with definition id ${Satiated}`
   */
  combatFood(opt: CombatFoodOption = {}) {
    this._satiatedTarget =
      "my characters and not has status with definition id 303300";
    const satiatedFilter = opt.satiatedFilter ?? "existsNot";
    if (satiatedFilter === "allNot") {
      this.filter(
        (c) => !c.$("my characters has status with definition id 303300"),
      );
    } else if (satiatedFilter === "existsNot") {
      this.filter((c) =>
        c.$("my characters and not has status with definition id 303300"),
      );
    }
    return this.tags("food");
  }

  doSameWhenDisposed() {
    if (this._disposeOperation || this._descriptionOnHCI) {
      throw new GiTcgDataError(
        `Cannot specify dispose action when using .onDispose() or .descriptionOnDraw().`,
      );
    }
    if (this._targetQueries.length > 0) {
      throw new GiTcgDataError(
        `Cannot specify targets when using .doSameWhenDisposed().`,
      );
    }
    this._doSameWhenDisposed = true;
    return this;
  }
  /** @deprecated use `descriptionOnHCI` */
  descriptionOnDraw() {
    return this.descriptionOnHCI();
  }
  /**
   * 下述描述适用于当此牌加入手牌时（"handCardInserted"），并随后弃置此牌。
   */
  descriptionOnHCI() {
    if (this._doSameWhenDisposed || this._disposeOperation) {
      throw new GiTcgDataError(
        `Cannot specify descriptionOnHCI when using .doSameWhenDisposed() or .onDispose().`,
      );
    }
    if (this._targetQueries.length > 0) {
      throw new GiTcgDataError(
        `Cannot specify targets when using .descriptionOnHCI().`,
      );
    }
    this._descriptionOnHCI = true;
    return this;
  }
  onDispose(op: SkillOperation<DisposeCardBuilderMeta<AssociatedExt>>) {
    if (this._doSameWhenDisposed || this._descriptionOnHCI) {
      throw new GiTcgDataError(
        `Cannot specify dispose action when using .doSameWhenDisposed() or .descriptionOnDraw().`,
      );
    }
    this._disposeOperation = op;
    return this;
  }
  /**
   * 当此牌加入手牌时（"handCardInserted"）执行的代码
   */
  onHCI(op: SkillOperation<HCICardBuilderMeta<AssociatedExt>>) {
    if (this._descriptionOnHCI) {
      throw new GiTcgDataError(
        `Cannot specify dispose action when using .descriptionOnDraw().`,
      );
    }
    this._hciOperation = op;
    return this;
  }

  done(): CardHandle {
    if (this._targetQueries.length > 0 && this._doSameWhenDisposed) {
      throw new GiTcgDataError(
        `Cannot specify targets when using .doSameWhenDisposed().`,
      );
    }
    if (this._satiatedTarget !== null) {
      const target = this._satiatedTarget;
      this.operations.push((c) => c.characterStatus(SATIATED_ID, target));
    }
    const skills: SkillDefinition[] = [];

    const targetGetter = this.buildTargetGetter();
    if (this._doSameWhenDisposed || this._disposeOperation !== null) {
      const disposeOp = this._disposeOperation;
      const disposeAction = disposeOp
        ? this.buildAction<DisposeOrTuneCardEventArg>(disposeOp)
        : this.buildAction<DisposeOrTuneCardEventArg>();
      const disposeDef: TriggeredSkillDefinition<"onDisposeOrTuneCard"> = {
        type: "skill",
        id: this.cardId + 0.02,
        ownerType: "card",
        triggerOn: "onDisposeOrTuneCard",
        initiativeSkillConfig: null,
        action: disposeAction,
        filter: (st, info, arg) => {
          return (
            info.caller.id === arg.entity.id && arg.method !== "elementalTuning"
          );
        },
        usagePerRoundVariableName: null,
      };
      skills.push(disposeDef);
    }
    if (this._descriptionOnHCI || this._hciOperation !== null) {
      const hciOp = this._hciOperation;
      let drawAction: SkillDescription<HandCardInsertedEventArg>;
      let filter: SkillActionFilter<InitiativeSkillEventArg>;
      let action: SkillDescription<InitiativeSkillEventArg>;
      if (hciOp) {
        drawAction = this.buildAction<HandCardInsertedEventArg>(hciOp);
        filter = this.buildFilter();
        action = this.buildAction();
      } else {
        this.do((c) => {
          c.mutate({
            type: "removeCard",
            who: c.self.who,
            where: "hands",
            oldState: c.self.latest(),
            reason: "onDrawTriggered",
          });
        });
        drawAction = this.buildAction<HandCardInsertedEventArg>();
        filter = () => false;
        action = (st) => [st, EMPTY_SKILL_RESULT];
      }
      const drawSkillDef: TriggeredSkillDefinition<"onHandCardInserted"> = {
        type: "skill",
        id: this.cardId + 0.03,
        ownerType: "card",
        triggerOn: "onHandCardInserted",
        initiativeSkillConfig: null,
        filter: (st, info, arg) => {
          return info.caller.id === arg.card.id;
        },
        action: drawAction,
        usagePerRoundVariableName: null,
      };
      const skillDef: InitiativeSkillDefinition = {
        type: "skill",
        id: this.cardId + 0.01,
        ownerType: "card",
        triggerOn: "initiative",
        initiativeSkillConfig: {
          skillType: "playCard",
          requiredCost: normalizeCost(this._cost),
          computed$costSize: costSize(this._cost),
          computed$diceCostSize: diceCostSize(this._cost),
          gainEnergy: false,
          shouldFast: !this._tags.includes("action"),
          alwaysCharged: false,
          alwaysPlunging: false,
          hidden: false,
          getTarget: targetGetter,
        },
        filter,
        action,
        usagePerRoundVariableName: null,
      };
      skills.push(skillDef, drawSkillDef);
    } else {
      const action = this.buildAction<InitiativeSkillEventArg>();
      const filter = this.buildFilter<InitiativeSkillEventArg>();
      const skillDef: InitiativeSkillDefinition = {
        type: "skill",
        id: this.cardId + 0.01,
        ownerType: "card",
        triggerOn: "initiative",
        initiativeSkillConfig: {
          skillType: "playCard",
          requiredCost: normalizeCost(this._cost),
          computed$costSize: costSize(this._cost),
          computed$diceCostSize: diceCostSize(this._cost),
          gainEnergy: false,
          shouldFast: !this._tags.includes("action"),
          alwaysCharged: false,
          alwaysPlunging: false,
          hidden: false,
          getTarget: targetGetter,
        },
        filter,
        action,
        usagePerRoundVariableName: null,
      };
      skills.push(skillDef);
    }
    const cardDef: CardDefinition = {
      __definition: "cards",
      type: "card",
      id: this.cardId,
      cardType: this._type,
      obtainable: this._obtainable,
      tags: this._tags,
      version: this._versionInfo,
      skills,
      descriptionDictionary: this._descriptionDictionary,
    };
    registerCard(cardDef);
    return this.cardId as CardHandle;
  }
}

export function card(id: number) {
  return withShortcut(new CardBuilder<readonly []>(id));
}
