import {
  DiceType,
  PbReactionType,
  PbSwitchActiveFromAction,
  Reaction,
  type ExposedMutation,
} from "@gi-tcg/typings";
import type { CardState, CharacterState, GameState } from "./base/state";
import { DetailLogType, type IDetailLogger } from "./log";
import {
  type Mutation,
  type StepRandomM,
  applyMutation,
  stringifyMutation,
} from "./base/mutation";
import {
  type EntityState,
  type EntityVariables,
  StateSymbol,
  stringifyState,
} from "./base/state";
import {
  allEntitiesAtArea,
  allSkills,
  getActiveCharacterIndex,
  getEntityArea,
  getEntityById,
  sortDice,
} from "./utils";
import { GiTcgCoreInternalError, GiTcgDataError, GiTcgIoError } from "./error";
import {
  type DamageInfo,
  EnterEventArg,
  type EventAndRequest,
  type EventArgOf,
  HandCardInsertedEventArg,
  type InlineEventNames,
  PlayCardRequestArg,
  ReactionEventArg,
  type ReactionInfo,
  type SelectCardInfo,
  type SkillDescription,
  type SkillInfo,
  type StateMutationAndExposedMutation,
  SwitchActiveEventArg,
  type SwitchActiveInfo,
} from "./base/skill";
import {
  type EntityArea,
  type EntityDefinition,
  stringifyEntityArea,
} from "./base/entity";
import type { CardDefinition } from "./base/card";
import { REACTION_MAP, type NontrivialDamageType } from "./base/reaction";
import {
  getReactionDescription,
  type ReactionDescriptionEventArg,
} from "./builder/reaction";

export class GiTcgPreviewAbortedError extends GiTcgCoreInternalError {
  constructor(message?: string) {
    super(`${message ?? "Preview aborted."} This error should be caught.`);
  }
}

export class GiTcgIoNotProvideError extends GiTcgPreviewAbortedError {
  constructor() {
    super("IO is not provided.");
  }
}

export interface NotifyOption {
  /** 即便没有积攒的 mutations，也执行 `onNotify`。适用于首次通知。 */
  readonly force?: boolean;
  readonly canResume?: boolean;
  readonly mutations?: readonly ExposedMutation[];
}

export interface InternalPauseOption {
  readonly state: GameState;
  readonly canResume: boolean;
  /** 自上次通知后，对局状态发生的所有变化 */
  readonly stateMutations: readonly Mutation[];
}
export interface InternalNotifyOption extends InternalPauseOption {
  /** 上层传入的其他变化（可直接输出前端） */
  readonly exposedMutations: readonly ExposedMutation[];
}

export interface MutatorConfig {
  /**
   * 详细日志输出器。
   */
  readonly logger?: IDetailLogger;

  /**
   * `notify` 时调用的接口。
   */
  readonly onNotify: (opt: InternalNotifyOption) => void;

  /**
   * `pause` 时调用的接口。
   */
  readonly onPause: (opt: InternalPauseOption) => Promise<void>;

  readonly howToSwitchHands?: (who: 0 | 1) => Promise<number[]>;
  readonly howToReroll?: (who: 0 | 1) => Promise<number[]>;
  readonly howToSelectCard?: (who: 0 | 1, cards: number[]) => Promise<number>;
  readonly howToChooseActive?: (
    who: 0 | 1,
    candidates: number[],
  ) => Promise<number>;
}

export interface CreateEntityOptions {
  /** 若重复创建，只修改 `overrideVariables` 中指定的变量 */
  readonly modifyOverriddenVariablesOnly?: boolean;
  /** 创建实体时，覆盖默认变量 */
  readonly overrideVariables?: Partial<EntityVariables>;
  /** 设定创建实体的 id。仅在打出支援牌和装备牌时直接继承原手牌 id */
  readonly withId?: number;
}

export interface CreateEntityResult {
  /** 若重复创建，给出被覆盖的原实体状态 */
  readonly oldState: EntityState | null;
  /** 若成功创建，给出新建的实体状态 */
  readonly newState: EntityState | null;
  /** 若成功创建，则引发的 onEnter 事件 */
  readonly events: EventAndRequest[];
}

export interface SwitchActiveOption {
  via?: SkillInfo;
  fast?: boolean | null;
  fromReaction?: Reaction | null;
}

export interface ApplyOption {
  via: SkillInfo;
  fromDamage: DamageInfo | null;
  // 以下属性在描述元素反应时有用，需要传入
  callerWho: 0 | 1;
  targetWho: 0 | 1;
  targetIsActive: boolean;
}

/**
 * 管理一个状态和状态的修改；同时也进行日志管理。
 *
 * - 当状态发生修改时，向日志输出；
 * - `notify` 方法会附加所有的修改信息。
 */
export class StateMutator {
  private _state: GameState;
  private _mutationsToBeNotified: Mutation[] = [];
  private _mutationsToBePause: Mutation[] = [];

  constructor(
    initialState: GameState,
    public readonly config: MutatorConfig,
  ) {
    this._state = initialState;
  }

  get state() {
    return this._state;
  }
  get logger() {
    return this.config.logger;
  }

  /**
   * Reset state with `newState`, notify mutations specified in `withMutations`.
   * @param newState
   * @param withMutations
   * @param notifyOpt
   */
  resetState(
    newState: GameState,
    withMutations: StateMutationAndExposedMutation,
    notifyOpt?: Omit<NotifyOption, "mutations">,
  ) {
    if (this._mutationsToBeNotified.length > 0) {
      console?.warn("Resetting state with pending mutations not notified");
      console?.warn(this._mutationsToBeNotified);
      console?.trace();
      // debugger;
    }
    this._state = newState;
    this._mutationsToBeNotified = [...withMutations.stateMutations];
    this._mutationsToBePause = [...withMutations.stateMutations];
    this.notify({
      ...notifyOpt,
      mutations: withMutations.exposedMutations,
    });
  }

  log(type: DetailLogType, value: string): void {
    return this.config.logger?.log(type, value);
  }
  subLog(type: DetailLogType, value: string) {
    return this.config.logger?.subLog(type, value);
  }

  mutate(mutation: Mutation) {
    this._state = applyMutation(this.state, mutation);
    const str = stringifyMutation(mutation);
    if (str) {
      this.log(DetailLogType.Mutation, str);
    }
    this._mutationsToBeNotified.push(mutation);
    this._mutationsToBePause.push(mutation);
  }

  private createNotifyInternalOption(opt: NotifyOption): InternalNotifyOption {
    const result = {
      state: this.state,
      canResume: opt.canResume ?? false,
      stateMutations: this._mutationsToBeNotified,
      exposedMutations: opt.mutations ?? [],
    };
    this._mutationsToBeNotified = [];
    return result;
  }
  private createPauseInternalOption(opt: NotifyOption): InternalPauseOption {
    const result = {
      state: this.state,
      canResume: opt.canResume ?? false,
      stateMutations: this._mutationsToBePause,
      exposedMutations: opt.mutations ?? [],
    };
    this._mutationsToBePause = [];
    return result;
  }

  notify(opt: NotifyOption = {}) {
    const internalOpt = this.createNotifyInternalOption(opt);
    if (
      opt.force ||
      internalOpt.stateMutations.length > 0 ||
      internalOpt.exposedMutations.length > 0
    ) {
      this.config.onNotify(internalOpt);
    }
  }
  async notifyAndPause(opt: NotifyOption = {}) {
    this.notify(opt);
    const internalPauseOpt = this.createPauseInternalOption(opt);
    await this.config.onPause(internalPauseOpt);
  }

  stepRandom(): number {
    const mut: StepRandomM = {
      type: "stepRandom",
      value: 0,
    };
    this.mutate(mut);
    return mut.value;
  }

  randomDice(count: number, alwaysOmni?: boolean): readonly DiceType[] {
    if (alwaysOmni) {
      return new Array<DiceType>(count).fill(DiceType.Omni);
    }
    const result: DiceType[] = [];
    for (let i = 0; i < count; i++) {
      result.push((this.stepRandom() % 8) + 1);
    }
    return result;
  }

  // --- INLINE SKILL HANDLING ---

  /* private */ executeInlineSkill<Arg>(
    skillDescription: SkillDescription<Arg>,
    skill: SkillInfo,
    arg: Arg,
  ): readonly EventAndRequest[] {
    this.notify();
    const [newState, { innerNotify, emittedEvents }] = skillDescription(
      this.state,
      skill,
      arg,
    );
    this.resetState(newState, innerNotify);
    return emittedEvents;
  }
  /* private */ handleInlineEvent<E extends InlineEventNames>(
    parentSkill: SkillInfo,
    event: E,
    arg: EventArgOf<E>,
  ): EventAndRequest[] {
    using l = this.subLog(
      DetailLogType.Event,
      `Handling inline event ${event} (${arg.toString()}):`,
    );
    const events: EventAndRequest[] = [];
    const infos = allSkills(this.state, event).map<SkillInfo>(
      ({ caller, skill }) => ({
        caller,
        definition: skill,
        requestBy: null,
        charged: false,
        plunging: false,
        prepared: false,
        isPreview: parentSkill.isPreview,
      }),
    );
    for (const info of infos) {
      arg._currentSkillInfo = info;
      if (!(0, info.definition.filter)(this.state, info, arg as any)) {
        continue;
      }
      using l = this.subLog(
        DetailLogType.Skill,
        `Using skill [skill:${info.definition.id}]`,
      );
      const desc = info.definition.action as SkillDescription<EventArgOf<E>>;
      const emitted = this.executeInlineSkill(desc, info, arg);
      events.push(...emitted);
    }
    return events;
  }

  // --- BASIC MUTATIVE PRIMITIVES ---

  apply(
    target: CharacterState,
    type: NontrivialDamageType,
    opt: ApplyOption,
  ): EventAndRequest[] {
    if (!target.variables.alive) {
      return [];
    }
    const events: EventAndRequest[] = [];
    const aura = target.variables.aura;
    const [newAura, reaction] = REACTION_MAP[aura][type];
    this.mutate({
      type: "modifyEntityVar",
      state: target,
      varName: "aura",
      value: newAura,
      direction: null,
    });
    if (!opt.fromDamage) {
      this.notify({
        mutations: [
          {
            $case: "applyAura",
            elementType: type,
            targetId: target.id,
            targetDefinitionId: target.definition.id,
            reactionType: reaction ?? PbReactionType.UNSPECIFIED,
            oldAura: aura,
            newAura,
          },
        ],
      });
    }
    if (reaction !== null) {
      this.log(
        DetailLogType.Other,
        `Apply reaction ${reaction} to ${stringifyState(target)}`,
      );
      const reactionInfo: ReactionInfo = {
        target: target,
        type: reaction,
        via: opt.via,
        fromDamage: opt.fromDamage,
      };
      events.push([
        "onReaction",
        new ReactionEventArg(this.state, reactionInfo),
      ]);
      const reactionDescriptionEventArg: ReactionDescriptionEventArg = {
        where: opt.targetWho === opt.callerWho ? "my" : "opp",
        here: opt.targetWho === opt.callerWho ? "opp" : "my",
        id: target.id,
        isDamage: !!opt.fromDamage,
        isActive: opt.targetIsActive,
      };
      const reactionDescription = getReactionDescription(reaction);
      if (reactionDescription) {
        events.push(
          ...this.executeInlineSkill(
            reactionDescription,
            opt.via,
            reactionDescriptionEventArg,
          ),
        );
      }
    }
    return events;
  }

  drawCard(who: 0 | 1): CardState | null {
    const candidate = this.state.players[who].pile[0];
    if (typeof candidate === "undefined") {
      return null;
    }
    this.mutate({
      type: "transferCard",
      who,
      from: "pile",
      to: "hands",
      value: candidate,
      reason: "draw",
    });
    if (
      this.state.players[who].hands.length > this.state.config.maxHandsCount
    ) {
      this.mutate({
        type: "removeCard",
        who,
        where: "hands",
        oldState: candidate,
        reason: "overflow",
      });
    }
    return candidate;
  }

  createHandCard(who: 0 | 1, definition: CardDefinition): EventAndRequest[] {
    using l = this.subLog(
      DetailLogType.Primitive,
      `Create hand card [card:${definition.id}]`,
    );
    const cardState: CardState = {
      [StateSymbol]: "card",
      id: 0,
      definition,
      variables: {},
    };
    this.mutate({
      type: "createCard",
      who,
      target: "hands",
      value: cardState,
    });
    const player = this.state.players[who];
    if (player.hands.length > this.state.config.maxHandsCount) {
      this.mutate({
        type: "removeCard",
        who,
        where: "hands",
        oldState: cardState,
        reason: "overflow",
      });
    }
    return [
      [
        "onHandCardInserted",
        new HandCardInsertedEventArg(this.state, who, cardState, "created"),
      ],
    ];
  }

  createEntity(
    def: EntityDefinition,
    area: EntityArea,
    opt: CreateEntityOptions = {},
  ): CreateEntityResult {
    using l = this.subLog(
      DetailLogType.Primitive,
      `Create entity [${def.type}:${def.id}] at ${stringifyEntityArea(area)}`,
    );
    const entitiesAtArea = allEntitiesAtArea(this.state, area);
    // handle immuneControl vs disableSkill;
    // do not generate Frozen etc. on those characters
    const immuneControl = entitiesAtArea.find(
      (e) =>
        e.definition.type === "status" &&
        e.definition.tags.includes("immuneControl"),
    );
    if (
      immuneControl &&
      def.type === "status" &&
      def.tags.includes("disableSkill")
    ) {
      this.log(
        DetailLogType.Other,
        "Because of immuneControl, entities with disableSkill cannot be created",
      );
      return { oldState: null, newState: null, events: [] };
    }
    const oldState = entitiesAtArea.find(
      (e): e is EntityState =>
        e.definition.type !== "character" &&
        e.definition.type !== "support" &&
        e.definition.id === def.id,
    );
    const { varConfigs } = def;
    const overrideVariables = opt.overrideVariables ?? {};
    if (oldState) {
      this.log(
        DetailLogType.Other,
        `Found existing entity ${stringifyState(
          oldState,
        )} at same area. Rewriting variables`,
      );
      const newValues: Record<string, number> = {};
      // refresh exist entity's variable
      for (const name in varConfigs) {
        if (opt.modifyOverriddenVariablesOnly && !(name in overrideVariables)) {
          continue;
        }
        let { initialValue, recreateBehavior } = varConfigs[name];
        if (typeof overrideVariables[name] === "number") {
          initialValue = overrideVariables[name]!;
        }
        const oldValue = oldState.variables[name] ?? 0;
        switch (recreateBehavior.type) {
          case "overwrite": {
            newValues[name] = initialValue;
            break;
          }
          case "takeMax": {
            newValues[name] = Math.max(initialValue, oldValue);
            break;
          }
          case "append": {
            if (oldValue > recreateBehavior.appendLimit) {
              // 如果当前值已经超过可叠加的上限，则不再叠加
              break;
            }
            const appendValue =
              overrideVariables[name] ?? recreateBehavior.appendValue;
            const appendResult = appendValue + oldValue;
            newValues[name] = Math.min(
              appendResult,
              recreateBehavior.appendLimit,
            );
            break;
          }
        }
      }
      for (const [name, value] of Object.entries(newValues)) {
        if (Reflect.has(oldState.variables, name)) {
          this.mutate({
            type: "modifyEntityVar",
            state: oldState,
            varName: name,
            value,
            direction: "increase",
          });
        }
      }
      const newState = getEntityById(this.state, oldState.id) as EntityState;
      const enterEvent: EventAndRequest = [
        "onEnter",
        new EnterEventArg(this.state, {
          overridden: oldState,
          newState,
        }),
      ];
      return { oldState, newState, events: [enterEvent] };
    } else {
      if (
        area.type === "summons" &&
        entitiesAtArea.length === this.state.config.maxSummonsCount
      ) {
        return { oldState: null, newState: null, events: [] };
      }
      const initState = {
        id: opt.withId ?? 0,
        definition: def,
        variables: Object.fromEntries(
          Object.entries(varConfigs).map(([name, { initialValue }]) => [
            name,
            overrideVariables[name] ?? initialValue,
          ]),
        ),
      };
      this.mutate({
        type: "createEntity",
        where: area,
        value: initState,
      });
      const newState = getEntityById(this.state, initState.id) as EntityState;
      const enterEvent: EventAndRequest = [
        "onEnter",
        new EnterEventArg(this.state, {
          overridden: null,
          newState,
        }),
      ];
      return { oldState: null, newState, events: [enterEvent] };
    }
  }

  switchActive(
    who: 0 | 1,
    target: CharacterState,
    opt: SwitchActiveOption = {},
  ): EventAndRequest[] {
    const from =
      this.state.players[who].characters[
        getActiveCharacterIndex(this.state.players[who])
      ];
    if (from.id === target.id) {
      return [];
    }
    let immuneControlStatus: EntityState | undefined;
    if (
      (immuneControlStatus = from.entities.find((st) =>
        st.definition.tags.includes("immuneControl"),
      ))
    ) {
      this.log(
        DetailLogType.Other,
        `Switch active from ${stringifyState(from)} to ${stringifyState(
          target,
        )}, but ${stringifyState(immuneControlStatus)} disabled this!`,
      );
      return [];
    }
    using l = this.subLog(
      DetailLogType.Primitive,
      `Switch active from ${stringifyState(from)} to ${stringifyState(target)}`,
    );
    this.mutate({
      type: "switchActive",
      who,
      value: target,
    });
    const fromReaction = opt.fromReaction ?? null;
    const switchInfo: SwitchActiveInfo = {
      type: "switchActive",
      who,
      from: from,
      via: opt.via,
      to: target,
      fromReaction: fromReaction !== null,
      fast: opt.fast ?? null,
    };
    this.postSwitchActive(switchInfo);
    return [
      ["onSwitchActive", new SwitchActiveEventArg(this.state, switchInfo)],
    ];
  }

  private postSwitchActive(switchInfo: SwitchActiveInfo) {
    // 处理切人时额外的操作：
    // - 通知前端
    // - 设置下落攻击 flag
    this.notify({
      mutations: [
        {
          $case: "switchActive",
          who: switchInfo.who,
          characterId: switchInfo.to.id,
          characterDefinitionId: switchInfo.to.definition.id,
          viaSkillDefinitionId: switchInfo.fromReaction
            ? Reaction.Overloaded
            : switchInfo.via?.definition.id,
          fromAction:
            switchInfo.fast === null
              ? PbSwitchActiveFromAction.NONE
              : switchInfo.fast
                ? PbSwitchActiveFromAction.FAST
                : PbSwitchActiveFromAction.SLOW,
        },
      ],
    });
    this.mutate({
      type: "setPlayerFlag",
      who: switchInfo.who,
      flagName: "canPlunging",
      value: true,
    });
  }

  // --- ASYNC OPERATIONS ---

  async reroll(who: 0 | 1, times: number) {
    const howToReroll = this.config.howToReroll;
    if (!howToReroll) {
      throw new GiTcgIoNotProvideError();
    }
    for (let i = 0; i < times; i++) {
      const oldDice = [...this.state.players[who].dice];
      const diceToReroll: readonly number[] = await howToReroll(who);
      if (diceToReroll.length === 0) {
        return;
      }
      for (const dice of diceToReroll) {
        const index = oldDice.indexOf(dice);
        if (index === -1) {
          throw new GiTcgIoError(
            who,
            `Requested to-be-rerolled dice ${dice} does not exists`,
          );
        }
        oldDice.splice(index, 1);
      }
      this.mutate({
        type: "resetDice",
        who,
        value: sortDice(this.state.players[who], [
          ...oldDice,
          ...this.randomDice(diceToReroll.length),
        ]),
        reason: "roll",
      });
      this.notify();
    }
  }

  async switchHands(who: 0 | 1) {
    if (!this.config.howToSwitchHands) {
      throw new GiTcgIoNotProvideError();
    }
    const removedHands = await this.config.howToSwitchHands(who);
    const player = () => this.state.players[who];
    // swapIn: 从手牌到牌堆
    // swapOut: 从牌堆到手牌
    const count = removedHands.length;
    const swapInCards = removedHands.map((id) => {
      const card = player().hands.find((c) => c.id === id);
      if (typeof card === "undefined") {
        throw new GiTcgIoError(who, `switchHands return unknown card ${id}`);
      }
      return card;
    });
    const swapInCardIds = swapInCards.map((c) => c.definition.id);

    for (const card of swapInCards) {
      const randomValue = this.stepRandom();
      const index = randomValue % (player().pile.length + 1);
      this.mutate({
        type: "transferCard",
        from: "hands",
        to: "pile",
        who,
        value: card,
        targetIndex: index,
        reason: "switch",
      });
    }
    // 如果牌堆顶的手牌是刚刚换入的同名牌，那么暂时不选它
    let topIndex = 0;
    for (let i = 0; i < count; i++) {
      let candidate: CardState;
      while (
        topIndex < player().pile.length &&
        swapInCardIds.includes(player().pile[topIndex].definition.id)
      ) {
        topIndex++;
      }
      if (topIndex >= player().pile.length) {
        // 已经跳过了所有同名牌，只能从头开始
        candidate = player().pile[0];
      } else {
        candidate = player().pile[topIndex];
      }
      this.mutate({
        type: "transferCard",
        from: "pile",
        to: "hands",
        who,
        value: candidate,
        reason: "switch",
      });
    }
    this.notify();
  }

  async selectCard(
    who: 0 | 1,
    via: SkillInfo,
    info: SelectCardInfo,
  ): Promise<EventAndRequest[]> {
    if (!this.config.howToSelectCard) {
      throw new GiTcgIoNotProvideError();
    }
    const selected = await this.config.howToSelectCard(
      who,
      info.cards.map((def) => def.id),
    );
    switch (info.type) {
      case "createHandCard": {
        const def = this.state.data.cards.get(selected);
        if (typeof def === "undefined") {
          throw new GiTcgDataError(`Unknown card definition id ${selected}`);
        }
        return this.createHandCard(who, def);
      }
      case "createEntity": {
        const def = this.state.data.entities.get(selected);
        if (typeof def === "undefined") {
          throw new GiTcgDataError(`Unknown card definition id ${selected}`);
        }
        if (def.type !== "summon") {
          throw new GiTcgDataError(`Entity type ${def.type} not supported now`);
        }
        const entityArea: EntityArea = {
          who,
          type: "summons",
        };
        const { oldState, newState } = this.createEntity(def, entityArea);
        if (newState) {
          const enterInfo = {
            overridden: oldState,
            newState,
          };
          return [["onEnter", new EnterEventArg(this.state, enterInfo)]];
        } else {
          return [];
        }
      }
      case "requestPlayCard": {
        const cardDefinition = this.state.data.cards.get(selected);
        if (!cardDefinition) {
          throw new GiTcgDataError(`Unknown card definition id ${selected}`);
        }
        return [
          [
            "requestPlayCard",
            new PlayCardRequestArg(via, who, cardDefinition, info.targets),
          ],
        ];
      }
      default: {
        const _: never = info;
        throw new GiTcgDataError(`Not recognized selectCard type`);
      }
    }
  }

  async chooseActive(who: 0 | 1): Promise<CharacterState> {
    if (!this.config.howToChooseActive) {
      throw new GiTcgIoNotProvideError();
    }
    const player = this.state.players[who];
    const candidates = player.characters.filter(
      (ch) => ch.variables.alive && ch.id !== player.activeCharacterId,
    );
    if (candidates.length === 0) {
      throw new GiTcgCoreInternalError(
        `No available candidate active character for player ${who}.`,
      );
    }
    const activeChId = await this.config.howToChooseActive(
      who,
      candidates.map((c) => c.id),
    );
    return getEntityById(this.state, activeChId) as CharacterState;
  }

  /** notify 'chooseActiveDone' */
  postChooseActive(
    p0chosen: CharacterState | null,
    p1chosen: CharacterState | null,
  ) {
    const states = [p0chosen, p1chosen] as const;
    for (const who of [0, 1] as const) {
      const state = states[who];
      if (!state) {
        continue;
      }
      this.notify({
        mutations: [
          {
            $case: "chooseActiveDone",
            who,
            characterId: state.id,
            characterDefinitionId: state.definition.id,
          },
        ],
      });
    }
  }
}
