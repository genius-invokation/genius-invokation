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
 * @id 113151
 * @name 夜魂加持
 * @description
 * 所附属角色可累积「夜魂值」。（最多累积到2点）
 * 夜魂值为0时，退出夜魂加持。
 */
export const NightsoulsBlessing = status(113151)
  .since("v5.7.0")
  // TODO
  .done();

/**
 * @id 113152
 * @name 死生之炉
 * @description
 * 我方全体角色的技能不消耗「夜魂值」。
 * 我方全体角色「普通攻击」造成的伤害+1。
 * 可用次数：2
 */
export const CrucibleOfDeathAndLife = status(113152)
  .since("v5.7.0")
  // TODO
  .done();

/**
 * @id 113157
 * @name 驰轮车·疾驰（生效中）
 * @description
 * 本角色将在下次行动时，直接使用技能：驰轮车·疾驰。
 */
export const FlamestriderFullThrottlePrepare = status(113157)
  .since("v5.7.0")
  // TODO
  .done();

/**
 * @id 113154
 * @name 驰轮车·跃升
 * @description
 * 此牌被舍弃后：对敌方出战角色造成1点火元素伤害。
 * 特技：跃升
 * （仅玛薇卡可用）
 * 可用次数：2
 * （角色最多装备1个「特技」）
 * [1131541: 跃升] (1*Void) 消耗1点「夜魂值」，造成4点火元素伤害。
 * [1131542: ] ()
 */
export const FlamestriderSoaringAscent = card(113154)
  .since("v5.7.0")
  // TODO
  .done();

/**
 * @id 113155
 * @name 驰轮车·涉渡
 * @description
 * 此卡牌被打出时：随机触发我方1个「召唤物」的「结束阶段」效果。
 * 特技：涉渡
 * （仅玛薇卡可用）
 * 可用次数：2
 * （角色最多装备1个「特技」）
 * [1131551: 涉渡] () 我方切换到下一个角色，将2个元素骰转换为万能元素。（此技能释放后，我方可继续行动）
 * [1131552: ] ()
 */
export const FlamestriderBlazingTrail = card(113155)
  .since("v5.7.0")
  // TODO
  .done();

/**
 * @id 113156
 * @name 驰轮车·疾驰
 * @description
 * 此卡牌可使用次数为0时：抓4张牌。
 * 特技：疾驰
 * （仅玛薇卡可用）
 * 可用次数：2
 * （角色最多装备1个「特技」）
 * [1131561: 疾驰] (2*Void) 消耗1点「夜魂值」，然后准备技能：驰轮车·疾驰。
 */
export const FlamestriderFullThrottleTechnique = card(113156)
  .since("v5.7.0")
  // TODO
  .done();

/**
 * @id 113153
 * @name 诸火武装·焚曜之环
 * @description
 * 我方其他角色使用「普通攻击」或特技后：消耗玛薇卡1点「夜魂值」，造成1点火元素伤害。（玛薇卡退出夜魂加持后销毁）
 */
export const AllfireArmamentsRingOfSearingRadiance = combatStatus(113153)
  .since("v5.7.0")
  // TODO
  .done();

/**
 * @id 113158
 * @name 驰轮车·疾驰（生效中）
 * @description
 * 行动阶段开始时：生成2个万能元素。
 */
export const FlamestriderFullThrottleInEffect = combatStatus(113158)
  .since("v5.7.0")
  // TODO
  .done();

/**
 * @id 13151
 * @name 以火织命
 * @description
 * 造成2点物理伤害。
 */
export const FlamesWeaveLife = skill(13151)
  .type("normal")
  .costPyro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 13152
 * @name 称名之刻
 * @description
 * 本角色进入夜魂加持，获得2点「夜魂值」，并从3张驰轮车中挑选1张加入手牌。
 */
export const TheNamedMoment = skill(13152)
  .type("elemental")
  .costPyro(2)
  // TODO
  .done();

/**
 * @id 13153
 * @name 燔天之时
 * @description
 * 本角色进入夜魂加持，获得1点「夜魂值」，消耗自身全部战意，对敌方前台造成等同于消耗战意数量的火元素伤害。
 * 若消耗了6点战意，则自身附属死生之炉。
 */
export const HourOfBurningSkies = skill(13153)
  .type("burst")
  .costPyro(4)
  // .costAl_energy(3)
  // TODO
  .done();

/**
 * @id 13154
 * @name 战意
 * @description
 * 角色不会获得充能。
 * 在我方消耗「夜魂值」或使用「普通攻击」后，获得1点战意。
 * 本角色使用元素战技或元素爆发时，附属诸火武装·焚曜之环。
 */
export const FightingSpirit = skill(13154)
  .type("passive")
  // TODO
  .done();

/**
 * @id 13155
 * @name 驰轮车·疾驰
 * @description
 * 行动阶段开始时：生成2个万能元素骰。
 */
export const FlamestriderFullThrottle = skill(13155)
  .type("elemental")
  // TODO
  .done();

/**
 * @id 1315
 * @name 玛薇卡
 * @description
 * 至明、至炽、至烈的再临之火。
 */
export const Mavuika = character(1315)
  .since("v5.7.0")
  .tags("pyro", "claymore", "natlan")
  .health(10)
  .energy(0)
  .skills(FlamesWeaveLife, TheNamedMoment, HourOfBurningSkies, FightingSpirit, FlamestriderFullThrottle)
  .done();

/**
 * @id 213151
 * @name 「人之名」解放
 * @description
 * 从3张驰轮车中挑选1张加入手牌。
 * 我方打出特技牌后：若可能，玛薇卡恢复1点「夜魂值」。（每回合1次）
 * （牌组中包含玛薇卡，才能加入牌组）
 */
export const HumanitysNameUnfettered = card(213151)
  .since("v5.7.0")
  .costPyro(1)
  .talent(Mavuika)
  // TODO
  .done();
