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
  flattenPbOneof,
  PbPhaseType,
  type PbExposedMutation,
  type PbGameState,
} from "@gi-tcg/typings";
import type { HistoryBlock, UseSkillHistoryBlock } from "./history";

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
      }
    }
  }
  throw new Error(`unimplemented`);
}
