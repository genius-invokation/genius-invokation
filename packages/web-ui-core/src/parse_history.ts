// Copyright (C) 2025 Guyutongxue
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
  DamageEM,
  flattenPbOneof,
  ModifyEntityVarEM,
  PbPhaseType,
  type PbExposedMutation,
  type PbGameState,
} from "@gi-tcg/typings";
import type {
  DamageHistoryChild,
  HistoryBlock,
  UseSkillHistoryBlock,
  VariableChangeHistoryChild,
} from "./history";

class VariableRecord {
  private _current: number;
  constructor(private _init: number = 0) {
    this._current = _init;
  }
  set(current: number) {
    this._current = current;
  }
  take() {
    const result = {
      init: this._init,
      current: this._current,
    };
    this._init = this._current;
    return result;
  }
}

/**
 * 收集所有的 ModifyEntityVarEM。
 * - 将生命值和 Aura 与 DamageEM 合并为 DamageHistoryChild
 * - 将 Entity 的可见变量，角色的能量值、最大生命值记录为 VariableChangeHistoryChild
 */
class VariableRecorder {
  readonly visibleVarRecords = new Map<number, VariableRecord>();
  readonly healthVarRecords = new Map<number, VariableRecord>();
  readonly auraVarRecords = new Map<number, VariableRecord>();
  readonly energyVarRecords = new Map<number, VariableRecord>();
  readonly maxHealthVarRecords = new Map<number, VariableRecord>();
  readonly visibleVarNames = new Map<number, string>();

  constructor(private readonly previousState: PbGameState | undefined) {
    if (!previousState) {
      return;
    }
    for (const player of previousState.player) {
      for (const ch of player.character) {
        this.healthVarRecords.set(ch.id, new VariableRecord(ch.health));
        this.auraVarRecords.set(ch.id, new VariableRecord(ch.aura));
        this.energyVarRecords.set(ch.id, new VariableRecord(ch.energy));
        this.maxHealthVarRecords.set(ch.id, new VariableRecord(ch.maxHealth));
        for (const entity of ch.entity) {
          if (entity.variableName) {
            this.visibleVarNames.set(entity.id, entity.variableName);
            this.visibleVarRecords.set(
              entity.id,
              new VariableRecord(entity.variableValue ?? 0),
            );
          }
        }
      }
      for (const prop of ["combatStatus", "summon", "support"] as const) {
        for (const entity of player[prop]) {
          if (entity.variableName) {
            this.visibleVarNames.set(entity.id, entity.variableName);
            this.visibleVarRecords.set(
              entity.id,
              new VariableRecord(entity.variableValue ?? 0),
            );
          }
        }
      }
    }
  }

  receive(varMut: ModifyEntityVarEM): VariableChangeHistoryChild | null {}

  composeDamage(dmgMut: DamageEM): DamageHistoryChild {}
}

export function parseToHistory(
  previousState: PbGameState | undefined,
  mutations: PbExposedMutation[],
): HistoryBlock[] {
  const result: HistoryBlock[] = [];
  let currentSkillBlock: Extract<HistoryBlock, { children: unknown[] }> | null =
    null;
  const currentDone = () => {
    if (currentSkillBlock) {
      result.push(currentSkillBlock);
    }
    currentSkillBlock = null;
  };
  const varRecorder = new VariableRecorder(previousState);
  for (const pbm of mutations) {
    const m = flattenPbOneof(pbm.mutation!);
    switch (m.$case) {
      case "changePhase": {
        const newPhase = (
          {
            [PbPhaseType.INIT_HANDS]: "initHands",
            [PbPhaseType.INIT_ACTIVES]: "initActives",
            [PbPhaseType.ACTION]: "action",
            [PbPhaseType.END]: "end",
            [PbPhaseType.ROLL]: null,
            [PbPhaseType.GAME_END]: null,
          } as const
        )[m.newPhase];
        if (!newPhase) {
          continue;
        }
        currentDone();
        result.push({
          type: "changePhase",
          roundNumber: previousState?.roundNumber ?? 0,
          newPhase,
        });
        break;
      }
      case "resetDice": {
        // TODO
        break;
      }
      case "modifyEntityVar": {
        varRecorder.receive(m);
        break;
      }
      case "damage": {
        break;
      }
    }
  }
  throw new Error(`unimplemented`);
}
