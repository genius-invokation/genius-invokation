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
 * @id 116111
 * @name 夜魂加持
 * @description
 * 所附属角色可累积「夜魂值」。（最多累积到2点）
 */
export const NightsoulsBlessing = status(116111)
  .since("v5.6.0")
  // TODO
  .done();

/**
 * @id 116113
 * @name 「源音采样」·岩
 * @description
 * 回合开始时：如果所附属角色拥有2点「夜魂值」，则在敌方场上生成受到的岩元素伤害增加。激活全部「源音采样」后，消耗2点「夜魂值」。
 */
export const SourceSampleGeo = status(116113)
  .since("v5.6.0")
  // TODO
  .done();

/**
 * @id 116114
 * @name 「源音采样」·水
 * @description
 * 回合开始时：如果所附属角色拥有2点「夜魂值」，则在敌方场上生成受到的水元素伤害增加。激活全部「源音采样」后，消耗2点「夜魂值」。
 */
export const SourceSampleHydro = status(116114)
  .since("v5.6.0")
  // TODO
  .done();

/**
 * @id 116115
 * @name 「源音采样」·火
 * @description
 * 回合开始时：如果所附属角色拥有2点「夜魂值」，则在敌方场上生成受到的火元素伤害增加。激活全部「源音采样」后，消耗2点「夜魂值」。
 */
export const SourceSamplePyro = status(116115)
  .since("v5.6.0")
  // TODO
  .done();

/**
 * @id 116116
 * @name 「源音采样」·冰
 * @description
 * 回合开始时：如果所附属角色拥有2点「夜魂值」，则在敌方场上生成受到的冰元素伤害增加。激活全部「源音采样」后，消耗2点「夜魂值」。
 */
export const SourceSampleCryo = status(116116)
  .since("v5.6.0")
  // TODO
  .done();

/**
 * @id 116117
 * @name 「源音采样」·雷
 * @description
 * 回合开始时：如果所附属角色拥有2点「夜魂值」，则在敌方场上生成受到的雷元素伤害增加。激活全部「源音采样」后，消耗2点「夜魂值」。
 */
export const SourceSampleElectro = status(116117)
  .since("v5.6.0")
  // TODO
  .done();

/**
 * @id 116112
 * @name 刃轮装束
 * @description
 * 所附属角色造成的物理伤害变为岩元素伤害。
 * 特技：高速腾跃
 * 所附属角色「夜魂值」为0时，弃置此牌；此牌被弃置时，所附属角色结束夜魂加持。
 * [1161121: 高速腾跃] (2*Void) 附属角色消耗1点「夜魂值」，抓3张牌。
 * [1161122: ] ()
 * [1161123: ] ()
 * [1161124: ] ()
 */
export const CombatBladingGear = card(116112)
  .since("v5.6.0")
  // TODO
  .done();

/**
 * @id 16111
 * @name 锐锋攫猎
 * @description
 * 造成2点物理伤害。若自身附属夜魂加持，则恢复1点「夜魂值」。
 */
export const EhecatlsRoar = skill(16111)
  .type("normal")
  .costGeo(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 16112
 * @name 音火锻淬
 * @description
 * 本角色附属刃轮装束，进入夜魂加持并获得1点「夜魂值」。（角色进入夜魂加持后不可使用此技能）
 * （附属刃轮装束的角色可以使用特技：高速腾跃）
 */
export const YohualsScratch = skill(16112)
  .type("elemental")
  .costGeo(2)
  // TODO
  .done();

/**
 * @id 16113
 * @name 豹烈律动！
 * @description
 * 造成2点岩元素伤害，抓1张牌，并且治疗我方受伤最多的角色1点。每层「源音采样」·岩额外抓1张牌，每层其他属性的「源音采样」额外治疗1点。
 */
export const OcelotlicuePoint = skill(16113)
  .type("burst")
  .costGeo(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 16114
 * @name 「源音采样」
 * @description
 * 【被动】战斗开始时，初始生成3层「源音采样」·岩，若我方存在火、水、冰、雷的角色，则将1层「源音采样」·岩转化为对应元素的「源音采样」。
 */
export const SourceSample = skill(16114)
  .type("passive")
  // TODO
  .done();

/**
 * @id 1611
 * @name 希诺宁
 * @description
 * 嵴锋荡响，铄石显金
 */
export const Xilonen = character(1611)
  .since("v5.6.0")
  .tags("geo", "sword", "natlan")
  .health(10)
  .energy(2)
  .skills(EhecatlsRoar, YohualsScratch, OcelotlicuePoint, SourceSample)
  .done();

/**
 * @id 216111
 * @name 丛山锻火驰行
 * @description
 * 战斗行动：我方出战角色为希诺宁时，装备此牌。
 * 希诺宁装备此牌后，立刻使用一次音火锻淬。
 * 装备有此牌的希诺宁在场时：切换至希诺宁或由希诺宁切换至其他角色时，若目标处于夜魂加持状态，则回复1点夜魂值。（每回合2次）
 * （牌组中包含希诺宁，才能加入牌组）
 */
export const TourOfTepeilhuitl = card(216111)
  .since("v5.6.0")
  .costGeo(2)
  .talent(Xilonen)
  // TODO
  .done();
