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

import type {
  ModifyEntityVarM,
  Mutation,
  SwitchActiveM,
} from "./base/mutation";
import {
  ActionEventArg,
  DisposeOrTuneCardEventArg,
  GenericModifyActionEventArg,
  PlayCardEventArg,
  SwitchActiveEventArg,
  UseSkillEventArg,
  type ActionInfo,
  type ActionInfoBase,
  type EventAndRequest,
  type InitiativeSkillEventArg,
  type InitiativeSkillInfo,
  type WithActionDetail,
} from "./base/skill";
import type { GameState } from "./base/state";
import { SkillExecutor } from "./skill_executor";
import { getActiveCharacterIndex, getEntityArea, type Writable } from "./utils";
import { GiTcgPreviewAbortedError, StateMutator } from "./mutator";
import {
  ActionValidity,
  type ExposedMutation,
  type FlattenOneof,
  type PreviewData,
  unFlattenOneof,
} from "@gi-tcg/typings";
import { exposeMutation } from "./io";

export type ActionInfoWithModification = ActionInfo & {
  eventArg: InstanceType<typeof GenericModifyActionEventArg>;
};

class PreviewContext {
  private mutator: StateMutator;
  private stateMutations: Mutation[] = [];
  private exposedMutations: ExposedMutation[] = [];
  public stopped = false;
  constructor(private readonly initialState: GameState) {
    this.mutator = new StateMutator(initialState, {
      onNotify: ({ stateMutations, exposedMutations }) => {
        this.stateMutations.push(...stateMutations);
        this.exposedMutations.push(...exposedMutations);
      },
      onPause: async () => {},
    });
  }

  get state() {
    return this.mutator.state;
  }

  mutate(mutation: Mutation) {
    this.mutator.mutate(mutation);
  }

  async previewSkill(
    skillInfo: InitiativeSkillInfo,
    arg: InitiativeSkillEventArg,
  ) {
    if (this.stopped) {
      return;
    }
    const executor = new SkillExecutor(this.mutator, { preview: true });
    try {
      await executor.finalizeSkill(skillInfo, arg);
    } catch (e) {
      if (e instanceof GiTcgPreviewAbortedError) {
        this.stopped = true;
      } else {
        throw e;
      }
    }
  }
  async previewEvent(...event: EventAndRequest) {
    if (this.stopped) {
      return;
    }
    const executor = new SkillExecutor(this.mutator, { preview: true });
    try {
      await executor.handleEvent(event);
    } catch (e) {
      if (e instanceof GiTcgPreviewAbortedError) {
        this.stopped = true;
      } else {
        throw e;
      }
    }
  }

  getMainDamageTargetId(): number | undefined {
    for (const em of this.exposedMutations) {
      if (em.$case === "damage" && em.isSkillMainDamage) {
        return em.targetId;
      }
    }
  }

  getPreviewData(): PreviewData[] {
    const result: ExposedMutation[] = [];
    for (const em of this.exposedMutations) {
      if (em.$case === "elementalReaction") {
        result.push(em);
      }
    }
    const newActives = new Map<0 | 1, SwitchActiveM>();
    const newHealths = new Map<number, ModifyEntityVarM>();
    const newEnergies = new Map<number, ModifyEntityVarM>();
    const newAura = new Map<number, ModifyEntityVarM>();
    const newAlive = new Map<number, ModifyEntityVarM>();
    const newVisibleVar = new Map<number, ModifyEntityVarM>();
    for (const m of this.stateMutations) {
      switch (m.type) {
        case "switchActive": {
          newActives.set(m.who, m);
          break;
        }
        case "modifyEntityVar": {
          const type = m.state.definition.type;
          if (type === "character") {
            const maps = {
              health: newHealths,
              energy: newEnergies,
              aura: newAura,
              alive: newAlive,
            };
            if (m.varName in maps) {
              const map = maps[m.varName as keyof typeof maps];
              map.set(m.state.id, {
                ...m,
                // keep first direction
                direction: map.get(m.state.id)?.direction ?? m.direction,
              });
            }
          } else {
            if (m.varName === m.state.definition.visibleVarName) {
              newVisibleVar.set(m.state.id, {
                ...m,
                // keep first direction
                direction: newVisibleVar.get(m.state.id)?.direction ?? m.direction,
              });
            }
          }
          break;
        }
        case "createEntity": {
          let where: "summons" | "supports";
          if (m.where.type === "summons" || m.where.type === "supports") {
            where = m.where.type;
          } else {
            break;
          }
          const em = exposeMutation(0, m);
          if (em) {
            result.push(em);
          }
          break;
        }
        case "removeEntity": {
          const em = exposeMutation(0, m);
          if (em) {
            result.push(em);
          }
          break;
        }
      }
    }
    result.push(
      ...[
        ...newActives.values(),
        ...newHealths.values(),
        ...newEnergies.values(),
        ...newAura.values(),
        ...newAlive.values(),
        ...newVisibleVar.values(),
      ]
        .map((m) => exposeMutation(0, m))
        .filter((em) => em !== null),
    );
    return result.map((r) => ({
      mutation: unFlattenOneof(r as FlattenOneof<PreviewData["mutation"]>),
    }));
  }
}

/**
 * - 对 actionInfo 应用 modifyAction
 * - 判断角色技能的主要伤害目标
 * - 判断使用手牌是否会被无效化
 * - 附属预览结果
 */
export class ActionPreviewer {
  constructor(
    private readonly originalState: GameState,
    private readonly who: 0 | 1,
  ) {}

  async modifyAndPreview(
    actionInfo: ActionInfo,
  ): Promise<ActionInfoWithModification> {
    // eventArg_PreCalc 为预计算，只应用 ActionInfo 的副作用
    // eventArg_Real 行动后使用，然后传入 handleEvent 使其真正发生
    const eventArgPreCalc = new GenericModifyActionEventArg(
      this.originalState,
      actionInfo,
    );
    const eventArgReal = new GenericModifyActionEventArg(
      this.originalState,
      actionInfo,
    );
    if (actionInfo.validity !== ActionValidity.VALID) {
      return {
        ...actionInfo,
        eventArg: eventArgReal,
      };
    }
    const ctx = new PreviewContext(this.originalState);
    await ctx.previewEvent("modifyAction0", eventArgPreCalc);
    await ctx.previewEvent("modifyAction1", eventArgPreCalc);
    await ctx.previewEvent("modifyAction2", eventArgPreCalc);
    await ctx.previewEvent("modifyAction3", eventArgPreCalc);
    const newActionInfo: Writable<WithActionDetail<ActionInfoBase>> =
      eventArgPreCalc.action;

    const player = () => ctx.state.players[this.who];
    const activeCh = () =>
      player().characters[getActiveCharacterIndex(player())];
    switch (newActionInfo.type) {
      case "useSkill": {
        const skillInfo = newActionInfo.skill;
        const callerArea = getEntityArea(ctx.state, activeCh().id);
        await ctx.previewEvent(
          "onBeforeUseSkill",
          new UseSkillEventArg(ctx.state, callerArea, newActionInfo.skill),
        );
        const skillArg: InitiativeSkillEventArg = {
          targets: newActionInfo.targets,
        };
        await ctx.previewSkill(skillInfo, skillArg);
        await ctx.previewEvent(
          "onUseSkill",
          new UseSkillEventArg(ctx.state, callerArea, newActionInfo.skill),
        );
        newActionInfo.mainDamageTargetId = ctx.getMainDamageTargetId();
        break;
      }
      case "playCard": {
        const card = newActionInfo.skill.caller;
        if (card.definition.tags.includes("legend")) {
          ctx.mutate({
            type: "setPlayerFlag",
            who: this.who,
            flagName: "legendUsed",
            value: true,
          });
        }
        await ctx.previewEvent(
          "onBeforePlayCard",
          new PlayCardEventArg(ctx.state, newActionInfo),
        );
        if (
          player().combatStatuses.find((st) =>
            st.definition.tags.includes("eventEffectless"),
          ) &&
          card.definition.cardType === "event"
        ) {
          newActionInfo.willBeEffectless = true;
          ctx.mutate({
            type: "removeCard",
            who: this.who,
            where: "hands",
            oldState: card,
            reason: "playNoEffect",
          });
        } else {
          ctx.mutate({
            type: "removeCard",
            who: this.who,
            where: "hands",
            oldState: card,
            reason: "play",
          });
          const arg = { targets: newActionInfo.targets };
          await ctx.previewSkill(newActionInfo.skill, arg);
          await ctx.previewEvent(
            "onPlayCard",
            new PlayCardEventArg(ctx.state, newActionInfo),
          );
        }
        break;
      }
      case "switchActive": {
        ctx.mutate({
          type: "switchActive",
          who: this.who,
          value: newActionInfo.to,
        });
        await ctx.previewEvent(
          "onSwitchActive",
          new SwitchActiveEventArg(ctx.state, newActionInfo),
        );
        break;
      }
      case "elementalTuning": {
        const card = newActionInfo.card;
        const tuneCardEventArg = new DisposeOrTuneCardEventArg(
          ctx.state,
          card,
          "elementalTuning",
        );
        ctx.mutate({
          type: "removeCard",
          who: this.who,
          where: "hands",
          oldState: card,
          reason: "elementalTuning",
        });
        await ctx.previewEvent("onDisposeOrTuneCard", tuneCardEventArg);
        break;
      }
      case "declareEnd": {
        ctx.mutate({
          type: "setPlayerFlag",
          who: this.who,
          flagName: "declaredEnd",
          value: true,
        });
        break;
      }
    }
    await ctx.previewEvent(
      "onAction",
      new ActionEventArg(ctx.state, newActionInfo),
    );
    return {
      ...newActionInfo,
      eventArg: eventArgReal,
      preview: ctx.getPreviewData(),
    };
  }
}
