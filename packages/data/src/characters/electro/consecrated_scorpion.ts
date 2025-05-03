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

import { character, skill, combatStatus, card, DamageType } from "@gi-tcg/core/builder";
import { BonecrunchersEnergyBlock } from "../../cards/event/other";

/**
 * @id 124052
 * @name 雷锥陷阱
 * @description
 * 所在阵营的角色使用技能后：对所在阵营的出战角色造成2点雷元素伤害。
 * 可用次数：初始为创建时所弃置的噬骸能量块张数。（最多叠加到3）
 */
export const ThunderboreTrap = combatStatus(124052)
  .usage(0)
  .on("useSkill")
  .damage(DamageType.Electro, 2, "my active")
  .consumeUsage()
  .done();

/**
 * @id 24051
 * @name 蝎爪钳击
 * @description
 * 造成2点物理伤害。
 */
export const ScorpionStrike = skill(24051)
  .type("normal")
  .costElectro(1)
  .costVoid(2)
  .damage(DamageType.Physical, 2)
  .done();

/**
 * @id 24052
 * @name 蝎尾锥刺
 * @description
 * 造成3点雷元素伤害。
 * 生成1张噬骸能量块，随机置入我方牌库顶部2张牌之中。
 */
export const StingingSpine = skill(24052)
  .type("elemental")
  .costElectro(3)
  .damage(DamageType.Electro, 3)
  .createPileCards(BonecrunchersEnergyBlock, 1, "topRange2")
  .done();

/**
 * @id 24053
 * @name 雷锥散射
 * @description
 * 造成3点雷元素伤害，舍弃手牌中最多3张噬骸能量块，在对方场上生成雷锥陷阱。
 */
export const ThunderboreBlast = skill(24053)
  .type("burst")
  .costElectro(3)
  .costEnergy(2)
  .do((c) => {
    c.damage(DamageType.Electro, 3);
    const cards = c.player.hands.filter((card) => card.definition.id === BonecrunchersEnergyBlock).slice(0, 3);
    c.disposeCard(...cards);
    c.combatStatus(ThunderboreTrap, "opp", {
      overrideVariables: { usage: cards.length }
    });
  })
  .done();

/**
 * @id 24054
 * @name 不朽亡骸·雷
 * @description
 * 【被动】回合结束时，生成2张噬骸能量块，随机置入我方牌库顶部10张牌之中。
 */
export const ImmortalRemnantsElectro = skill(24054)
  .type("passive")
  .on("roundEnd")
  .createPileCards(BonecrunchersEnergyBlock, 2, "topRange10")
  .done();

/**
 * @id 2405
 * @name 圣骸毒蝎
 * @description
 * 因为啃噬伟大的生命体，而扭曲异变的毒蝎，操纵着险恶的轰雷。
 */
export const ConsecratedScorpion = character(2405)
  .since("v4.7.0")
  .tags("electro", "monster", "sacread")
  .health(10)
  .energy(2)
  .skills(ScorpionStrike, StingingSpine, ThunderboreBlast, ImmortalRemnantsElectro)
  .done();

/**
 * @id 224051
 * @name 亡雷凝蓄
 * @description
 * 入场时：生成1张噬骸能量块，置入我方手牌。
 * 装备有此牌的圣骸毒蝎在场，我方打出噬骸能量块后：抓1张牌，然后生成1张噬骸能量块，随机置入我方牌库中。
 * （牌组中包含圣骸毒蝎，才能加入牌组）
 */
export const FatalFulmination = card(224051)
  .since("v4.7.0")
  .costElectro(1)
  .talent(ConsecratedScorpion, "none")
  .on("enter")
  .createHandCard(BonecrunchersEnergyBlock)
  .on("playCard", (c, e) => e.card.definition.id === BonecrunchersEnergyBlock)
  .drawCards(1)
  .createPileCards(BonecrunchersEnergyBlock, 1, "random")
  .done();

/**
 * @id 124053
 * @name 噬骸能量块
 * @description
 * 本回合无法再打出噬骸能量块。
 */
const _ = void 0; // moved to cards
