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

import { character, skill, status, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 123051
 * @name 忿恨
 * @description
 * 每层使所附属角色造成的伤害和「元素爆发」造成的穿透伤害+1。（可叠加，没有上限）
 */
export const ResentmentStatus = status(123051)
  .since("v6.0.0")
  // TODO
  .done();

/**
 * @id 123052
 * @name 弃置卡牌数
 * @description
 * 我方每舍弃6张卡牌，自身附属1层忿恨。
 * 【此卡含描述变量】
 */
export const CardsDiscarded = status(123052)
  .since("v6.0.0")
  // TODO
  .done();

/**
 * @id 23051
 * @name 虚界玄爪
 * @description
 * 造成2点物理伤害。
 */
export const VoidClawStrike = skill(23051)
  .type("normal")
  .costPyro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 23052
 * @name 蚀灭火羽
 * @description
 * 造成3点火元素伤害，我方舍弃牌组顶部1张牌。
 */
export const ErodedFlamingFeathers = skill(23052)
  .type("elemental")
  .costPyro(3)
  // TODO
  .done();

/**
 * @id 23053
 * @name 斫劫源焰
 * @description
 * 造成1点火元素伤害，对所有敌方后台角色造成1点穿透伤害。双方舍弃牌组顶部3张牌，自身附属1层忿恨.
 */
export const SeveringPrimalFire = skill(23053)
  .type("burst")
  .costPyro(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 23054
 * @name 忿恨
 * @description
 * 【被动】我方每舍弃6张卡牌，自身附属1层忿恨。
 */
export const Resentment01 = skill(23054)
  .type("passive")
  // TODO
  .done();

/**
 * @id 23056
 * @name 忿恨
 * @description
 * 【被动】我方每舍弃6张卡牌，自身附属1层忿恨。
 */
export const Resentment02 = skill(23056)
  .type("passive")
  // TODO
  .done();

/**
 * @id 2305
 * @name 蚀灭的源焰之主
 * @description
 * 被称为深渊浮灭主亦被称为「古斯托特」的虚界魔物，拥有侵蚀地脉之中的回忆并将之凝聚为实体的如同灾厄的权能。
 */
export const LordOfErodedPrimalFire = character(2305)
  .since("v6.0.0")
  .tags("pyro", "monster")
  .health(12)
  .energy(2)
  .skills(VoidClawStrike, ErodedFlamingFeathers, SeveringPrimalFire, Resentment01, Resentment02)
  .done();

/**
 * @id 223051
 * @name 罔极盛怒
 * @description
 * 快速行动：装备给我方的蚀灭的源焰之主。
 * 敌方打出名称不存在于本局最初牌组的牌时：所附属角色获得1点充能，下次造成的伤害+1。（每回合1次）
 * （牌组中包含蚀灭的源焰之主，才能加入牌组）
 */
export const UndyingFury = card(223051)
  .since("v6.0.0")
  .costPyro(1)
  .talent(LordOfErodedPrimalFire)
  // TODO
  .done();
