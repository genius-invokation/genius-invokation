import { AddPrefix, RemovePrefix } from "./utils";
import { PlayCardContext } from "./cards";
import { BeforeDamageCalculatedContext, BeforeDefeatedContext, DamageContext, DamageReadonlyContext, ElementalReactionContext, SkillDamageContext, SwitchActiveContext, UseDiceContext, RequestFastSwitchContext, RollContext } from "./contexts";
import { Context } from "./global";
import { SkillContext } from "./skills";

export type SyncHandlerResult = boolean | void;
export type AsyncHandlerResult = SyncHandlerResult | Promise<SyncHandlerResult>;

type SyncHandler<ThisT, ExtPoint> = (c: Context<ThisT, ExtPoint, false>) => SyncHandlerResult;
type AsyncHandler<ThisT, ExtPoint> = (c: Context<ThisT, ExtPoint, true>) => AsyncHandlerResult;

// Follow docs/develop/events.md of all events.

export type SyncEventMap = {
  onRollPhase: RollContext,

  onBeforeUseDice: UseDiceContext,
  onRequestFastSwitchActive: RequestFastSwitchContext,

  onEarlyBeforeDealDamage: BeforeDamageCalculatedContext,
  onBeforeDealDamage: DamageContext,
  onBeforeSkillDamage: SkillDamageContext,
  onBeforeDamaged: DamageContext,

  onBeforeDefeated: BeforeDefeatedContext,
}

type NO_EXTRA = Record<never, never>;

export type AsyncEventMap = {
  onBattleBegin: NO_EXTRA,
  onActionPhase: NO_EXTRA,

  onBeforeAction: NO_EXTRA,
  onUseSkill: SkillContext,
  onSwitchActive: SwitchActiveContext,
  onPlayCard: PlayCardContext,
  onDeclareEnd: NO_EXTRA,
  onAction: NO_EXTRA,

  onDealDamage: DamageReadonlyContext,
  onDamaged: DamageReadonlyContext,
  onElementalReaction: ElementalReactionContext,
  onDefeated: DamageReadonlyContext,
  onRevive: NO_EXTRA,

  onEnter: NO_EXTRA,
}

export type EventMap = SyncEventMap & AsyncEventMap;
export type EventNames = keyof EventMap;
export type EventHandler<ThisT, E extends EventNames> = E extends keyof SyncEventMap ? SyncHandler<ThisT, EventMap[E]> : AsyncHandler<ThisT, EventMap[E]>;
export type TriggerCondition<ThisT, E extends EventNames> = (c: Context<ThisT, EventMap[E], false>) => boolean;

export type EventHandlers<ThisT = any> = {
  [E in EventNames]?: EventHandler<ThisT, E>
};

export type ListenTarget = "master" | "my" | "all";

export interface EventHandlerAndState<ThisT = any> {
  readonly handler: EventHandlers<ThisT>;
  readonly state: ThisT;
}
