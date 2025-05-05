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
 * @id 114131
 * @name 寂想瞑影
 * @description
 * 所附属角色使用普通攻击时：造成的物理伤害变为雷元素伤害，伤害+1，少花费1个无色元素，并且对敌方生命值最低的角色造成1点穿透伤害。
 * 持续回合：2
 */
export const TwilightMeditation = status(114131)
  .since("v5.6.0")
  // TODO
  .done();

/**
 * @id 114132
 * @name 轰雷凝集
 * @description
 * 我方角色引发雷元素相关反应后:所附属角色获得1点充能。
 * 可用次数：1
 */
export const ThunderConvergence = status(114132)
  .since("v5.6.0")
  // TODO
  .done();

/**
 * @id 14131
 * @name 王家苇箭术
 * @description
 * 造成2点物理伤害。
 */
export const RoyalReedArchery = skill(14131)
  .type("normal")
  .costElectro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 14132
 * @name 古仪·鸣砂掣雷
 * @description
 * 敌方出战角色附着雷元素，我方切换到下一个角色。自身附属轰雷凝集。
 */
export const AncientRiteTheThunderingSands = skill(14132)
  .type("elemental")
  .costElectro(2)
  // TODO
  .done();

/**
 * @id 14133
 * @name 秘仪·瞑光贯影
 * @description
 * 造成3点雷元素伤害，自身附属寂想瞑影。
 */
export const SecretRiteTwilightShadowpiercer = skill(14133)
  .type("burst")
  .costElectro(3)
  .costEnergy(4)
  // TODO
  .done();

/**
 * @id 14134
 * @name 黑鸢的密喻
 * @description
 * 自身「普通攻击」不会获得充能。
 * 自身「普通攻击」后：如可能，消耗全部充能，对生命值最低的敌方造成等额+1的穿透伤害。
 */
export const BlackKitesEnigma = skill(14134)
  .type("passive")
  // TODO
  .done();

/**
 * @id 1413
 * @name 赛索斯
 * @description
 * 沙海来客，慧心慧业。
 */
export const Sethos = character(1413)
  .since("v5.6.0")
  .tags("electro", "bow", "sumeru")
  .health(10)
  .energy(4)
  .skills(RoyalReedArchery, AncientRiteTheThunderingSands, SecretRiteTwilightShadowpiercer, BlackKitesEnigma)
  .done();

/**
 * @id 214131
 * @name 巡日塔门书
 * @description
 * 我方赛索斯获得1点充能。
 * 我方赛索斯因黑鸢的密喻扣除充能后，获得1点充能。（每回合1次）
 * （牌组中包含赛索斯，才能加入牌组）
 */
export const PylonOfTheSojourningSunTemple = card(214131)
  .since("v5.6.0")
  .costElectro(1)
  .talent(Sethos)
  // TODO
  .done();
