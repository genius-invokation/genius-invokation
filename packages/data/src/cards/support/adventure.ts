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

import { card, DamageType } from "@gi-tcg/core/builder";
import { ChenyuBrew } from "../event/food";
import { AgileSwitch, EfficientSwitch } from "../../commons";

/**
 * @id 321032
 * @name 沉玉谷
 * @description
 * 冒险经历达到2时：生成2张手牌沉玉茶露。
 * 冒险经历达到4时：我方获得3层高效切换和敏捷切换。
 * 冒险经历达到7时：我方全体角色附着水元素，治疗我方受伤最多的角色至最大生命值，并使其获得2点最大生命值，然后弃置此牌。
 */
export const ChenyuVale = card(321032)
  .since("v6.1.0")
  .adventureSpot()
  .on("adventure", (c) => c.getVariable("exp") >= 2)
  .usage(1, { name: "stage1", autoDispose: false, visible: false })
  .createHandCard(ChenyuBrew)
  .createHandCard(ChenyuBrew)
  .on("adventure", (c) => c.getVariable("exp") >= 4)
  .usage(1, { name: "stage2", autoDispose: false, visible: false })
  .combatStatus(EfficientSwitch, "my", {
    overrideVariables: {
      usage: 3
    }
  })
  .combatStatus(AgileSwitch, "my", {
    overrideVariables: {
      usage: 3
    }
  })
  .on("adventure", (c) => c.getVariable("exp") >= 7)
  .usage(1, { name: "stage3", visible: false })
  .apply(DamageType.Hydro, "all my characters")
  .do((c) => {
    const targetCh = c.$(`my characters order by health - maxHealth limit 1`);
    if (!targetCh) {
      return;
    }
    const healValue = 999; // interesting.
    c.heal(healValue, targetCh);
    c.increaseMaxHealth(2, targetCh);
    c.finishAdventure();
  })
  .done();
