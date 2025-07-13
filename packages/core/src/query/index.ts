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

import type { ContextMetaBase, SkillContext } from "../builder/context/skill";
import type { TypedExEntity } from "../builder/type";
import type { GuessedTypeOfQuery } from "./types";
import { type QueryArgs, doSemanticQueryAction } from "./semantic";
import { allEntities, allEntitiesInclPile, getEntityArea } from "../utils";
import type { AnyState, GameState } from "../base/state";
import type {
  InitiativeSkillEventArg,
  DamageOrHealEventArg,
  DamageInfo,
  SwitchActiveEventArg,
  UseSkillEventArg,
} from "../base/skill";
import { GiTcgDataError } from "../error";

export function executeQuery<
  Meta extends ContextMetaBase,
  const Q extends string,
>(ctx: SkillContext<Meta>, q: Q): TypedExEntity<Meta, GuessedTypeOfQuery<Q>>[] {
  const targetLength = (ctx.eventArg as any)?.targets?.length ?? 0;
  const allEntities = allEntitiesInclPile(ctx.state);
  const arg: QueryArgs = {
    state: ctx.state,
    allEntities,
    callerWho: ctx.callerArea.who,
    candidates: allEntities,
    externals: {
      self: () => ctx.self,
      master: () => {
        const area = ctx.self.area;
        if (area.type !== "characters") {
          throw new GiTcgDataError(`This caller do not have @master`);
        }
        return ctx.get(area.characterId);
      },
      event: {
        skillCaller: () => (ctx.eventArg as UseSkillEventArg).skill.caller,
        switchTo: () => (ctx.eventArg as SwitchActiveEventArg).switchInfo.to,
      },
      damage: {
        target: () => (ctx.eventArg as DamageOrHealEventArg<DamageInfo>).target,
      },
      targets: Object.fromEntries(
        new Array(targetLength)
          .fill(0)
          .map((_, i) => [
            `${i}`,
            () => (ctx.eventArg as InitiativeSkillEventArg).targets[i],
          ]),
      ),
    },
  };
  const result = doSemanticQueryAction(q, arg);
  // TODO: typing
  return result.map((st) => (st) as any);
}

export function executeQueryOnState(
  state: GameState,
  who: 0 | 1,
  q: string,
): AnyState[] {
  const allEntities = allEntitiesInclPile(state);
  return doSemanticQueryAction(q, {
    state,
    allEntities,
    candidates: allEntities,
    callerWho: who,
    externals: {},
  });
}
