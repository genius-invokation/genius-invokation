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

import { character, skill, status, combatStatus, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 115111
 * @name 夜魂加持
 * @description
 * 所附属角色可累积「夜魂值」。（最多累积到2点）
 */
export const NightsoulsBlessing = status(115111)
  .since("v5.7.0")
  // TODO
  .done();

/**
 * @id 115112
 * @name 灵枪·仪式杖
 * @description
 * 特技：多重瞄准。
 * 此牌被弃置时，所附属角色结束夜魂加持。
 * （角色最多装备1个「特技」）
 * [1151121: 多重瞄准] (2*Anemo) 消耗1点「夜魂值」，造成1点风元素伤害，然后随机舍弃3张原本元素骰费用最高的手牌。
 * [1151122: ] ()
 */
export const SoulsniperRitualStaff = card(115112)
  .since("v5.7.0")
  // TODO
  .done();

/**
 * @id 115118
 * @name 掩护的心意
 * @description
 * 我方「切换角色」时：抓1张牌。
 * 可用次数：2
 */
export const IntentToCover = combatStatus(115118)
  .since("v5.7.0")
  // TODO
  .done();

/**
 * @id 15111
 * @name 迷羽流击
 * @description
 * 造成2点物理伤害。
 */
export const PhantomFeatherFlurry = skill(15111)
  .type("normal")
  .costAnemo(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 15112
 * @name 灵缰追影
 * @description
 * 造成1点风元素伤害，抓1张牌。
 * 本角色附属灵枪·仪式杖，进入夜魂加持，并获得2点「夜魂值」。（角色进入夜魂加持后不可使用此技能）（附属灵枪·仪式杖的角色可以使用特技：多重瞄准）
 * 我方接下来2次「切换角色」时：抓1张牌。
 */
export const SpiritReinsShadowHunt = skill(15112)
  .type("elemental")
  .costAnemo(3)
  // TODO
  .done();

/**
 * @id 15113
 * @name 索魂命袭
 * @description
 * 造成1点风元素伤害，对敌方所有后台角色造成1点穿透伤害，并抓3张牌。
 */
export const SoulReapersFatalRound = skill(15113)
  .type("burst")
  .costAnemo(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 15114
 * @name 追影弹
 * @description
 * 对局开始时，将6枚追影弹随机放置进牌库。
 */
export const ShadowhuntShell = skill(15114)
  .type("passive")
  // TODO
  .done();

/**
 * @id 1511
 * @name 恰斯卡
 * @description
 * 风花铿锵，飞羽凌空。
 */
export const Chasca = character(1511)
  .since("v5.7.0")
  .tags("anemo", "bow", "natlan")
  .health(10)
  .energy(2)
  .skills(PhantomFeatherFlurry, SpiritReinsShadowHunt, SoulReapersFatalRound, ShadowhuntShell)
  .done();

/**
 * @id 215111
 * @name 子弹的戏法
 * @description
 * 快速行动：我方恰斯卡在场时，对该角色打出。将一张追影弹加入手牌。
 * （牌组中包含恰斯卡，才能加入牌组）
 */
export const BulletTrick = card(215111)
  .since("v5.7.0")
  .costAnemo(1)
  .eventTalent(Chasca)
  // TODO
  .done();
