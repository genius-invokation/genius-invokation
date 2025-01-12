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

import { DiceType, card, combatStatus, status } from "@gi-tcg/core/builder";
import { Satiated } from "../../commons";

/**
 * @id 333001
 * @name 绝云锅巴
 * @description
 * 本回合中，目标角色下一次「普通攻击」造成的伤害+1。
 * （每回合每个角色最多食用1次「料理」）
 */
export const [JueyunGuoba] = card(333001)
  .since("v3.3.0")
  .food()
  .toStatus(303301, "@targets.0")
  .oneDuration()
  .once("increaseSkillDamage", (c, e) => e.viaSkillType("normal"))
  .increaseDamage(1)
  .done();

/**
 * @id 333002
 * @name 仙跳墙
 * @description
 * 本回合中，目标角色下一次「元素爆发」造成的伤害+3。
 * （每回合每个角色最多食用1次「料理」）
 */
export const [AdeptusTemptation] = card(333002)
  .since("v3.3.0")
  .costVoid(2)
  .food()
  .toStatus(303302, "@targets.0")
  .oneDuration()
  .once("increaseSkillDamage", (c, e) => e.viaSkillType("burst"))
  .increaseDamage(3)
  .done();

/**
 * @id 333003
 * @name 莲花酥
 * @description
 * 本回合中，目标角色下次受到的伤害-3。
 * （每回合中每个角色最多食用1次「料理」）
 */
export const [LotusFlowerCrisp] = card(333003)
  .since("v3.3.0")
  .costSame(1)
  .food()
  .toStatus(303303, "@targets.0")
  .oneDuration()
  .once("decreaseDamaged")
  .decreaseDamage(3)
  .done();

/**
 * @id 333004
 * @name 北地烟熏鸡
 * @description
 * 本回合中，目标角色下一次「普通攻击」少花费1个无色元素。
 * （每回合每个角色最多食用1次「料理」）
 */
export const [NorthernSmokedChicken] = card(333004)
  .since("v3.3.0")
  .food()
  .toStatus(303304, "@targets.0")
  .oneDuration()
  .once("deductVoidDiceSkill", (c, e) => e.isSkillType("normal"))
  .deductVoidCost(1)
  .done();

/**
 * @id 333005
 * @name 甜甜花酿鸡
 * @description
 * 治疗目标角色1点。
 * （每回合每个角色最多食用1次「料理」）
 */
export const SweetMadame = card(333005)
  .since("v3.3.0")
  .food({ extraTargetRestraint: "with health < maxHealth" })
  .heal(1, "@targets.0")
  .done();

/**
 * @id 333006
 * @name 蒙德土豆饼
 * @description
 * 治疗目标角色2点。
 * （每回合每个角色最多食用1次「料理」）
 */
export const MondstadtHashBrown = card(333006)
  .since("v3.3.0")
  .costSame(1)
  .food({ extraTargetRestraint: "with health < maxHealth" })
  .heal(2, "@targets.0")
  .done();

/**
 * @id 333007
 * @name 烤蘑菇披萨
 * @description
 * 治疗目标角色1点，两回合内结束阶段再治疗此角色1点。
 * （每回合每个角色最多食用1次「料理」）
 */
export const [MushroomPizza] = card(333007)
  .since("v3.3.0")
  .costSame(1)
  .food({ extraTargetRestraint: "with health < maxHealth" })
  .heal(1, "@targets.0")
  .toStatus(303305, "@targets.0")
  .duration(2)
  .on("endPhase")
  .heal(1, "@master")
  .done();

/**
 * @id 333008
 * @name 兽肉薄荷卷
 * @description
 * 目标角色在本回合结束前，之后三次「普通攻击」都少花费1个无色元素。
 * （每回合每个角色最多食用1次「料理」）
 */
export const [MintyMeatRolls] = card(333008)
  .since("v3.3.0")
  .costSame(1)
  .food()
  .toStatus(303306, "@targets.0")
  .oneDuration()
  .on("deductVoidDiceSkill", (c, e) => e.isSkillType("normal"))
  .usage(3)
  .deductVoidCost(1)
  .done();

/**
 * @id 303307
 * @name 复苏冷却中
 * @description
 * 本回合无法通过「料理」复苏角色。
 */
export const ReviveOnCooldown = combatStatus(303307)
  .oneDuration()
  .done();

/**
 * @id 333009
 * @name 提瓦特煎蛋
 * @description
 * 复苏目标角色，并治疗此角色1点。
 * （每回合中，最多通过「料理」复苏1个角色，并且每个角色最多食用1次「料理」）
 */
export const TeyvatFriedEgg = card(333009)
  .since("v3.7.0")
  .costSame(2)
  .tags("food")
  .filter((c) => !c.$(`my combat status with definition id ${ReviveOnCooldown}`))
  .addTarget("my defeated characters")
  .heal(1, "@targets.0", { kind: "revive" })
  .characterStatus(Satiated, "@targets.0")
  .combatStatus(ReviveOnCooldown)
  .done();

/**
 * @id 333010
 * @name 刺身拼盘
 * @description
 * 目标角色在本回合结束前，「普通攻击」造成的伤害+1。
 * （每回合每个角色最多食用1次「料理」）
 */
export const [SashimiPlatter] = card(333010)
  .since("v3.7.0")
  .costSame(1)
  .food()
  .toStatus(303308, "@targets.0")
  .oneDuration()
  .on("increaseSkillDamage", (c, e) => e.viaSkillType("normal"))
  .increaseDamage(1)
  .done();

/**
 * @id 333011
 * @name 唐杜尔烤鸡
 * @description
 * 本回合中，所有我方角色下一次「元素战技」造成的伤害+2。
 * （每回合每个角色最多食用1次「料理」）
 */
export const [TandooriRoastChicken] = card(333011)
  .since("v3.7.0")
  .costVoid(2)
  .food({ satiatedTarget: "all my characters" })
  .toStatus(303309, "all my characters")
  .oneDuration()
  .once("increaseSkillDamage", (c, e) => e.viaSkillType("elemental"))
  .increaseDamage(2)
  .done();

/**
 * @id 333012
 * @name 黄油蟹蟹
 * @description
 * 本回合中，所有我方角色下次受到的伤害-2。
 * （每回合每个角色最多食用1次「料理」）
 */
export const [ButterCrab] = card(333012)
  .since("v3.7.0")
  .costVoid(2)
  .food({ satiatedTarget: "all my characters" })
  .toStatus(303310, "all my characters")
  .oneDuration()
  .once("decreaseDamaged")
  .decreaseDamage(2)
  .done();

/**
 * @id 333013
 * @name 炸鱼薯条
 * @description
 * 本回合中，所有我方角色下次使用技能时少花费1个元素骰。
 * （每回合每个角色最多食用1次「料理」）
 */
export const [FishAndChips] = card(333013)
  .since("v4.3.0")
  .costVoid(2)
  .food({ satiatedTarget: "all my characters" })
  .toStatus(303311, "all my characters")
  .oneDuration()
  .once("deductOmniDiceSkill")
  .deductOmniCost(1)
  .done();

/**
 * @id 333014
 * @name 松茸酿肉卷
 * @description
 * 治疗目标角色2点，3回合内的结束阶段再治疗此角色1点。
 * （每回合每个角色最多食用1次「料理」）
 */
export const [MatsutakeMeatRolls] = card(333014)
  .since("v4.4.0")
  .costSame(2)
  .food({ extraTargetRestraint: "with health < maxHealth" })
  .heal(2, "@targets.0")
  .toStatus(303312, "@targets.0")
  .on("endPhase")
  .usage(3)
  .heal(1, "@master")
  .done();

/**
 * @id 333015
 * @name 缤纷马卡龙
 * @description
 * 治疗目标角色1点，该角色接下来3次受到伤害后再治疗其1点。
 * （每回合每个角色最多食用1次「料理」）
 */
export const [RainbowMacarons] = card(333015)
  .since("v4.6.0")
  .costVoid(2)
  .food({ extraTargetRestraint: "with health < maxHealth" })
  .heal(1, "@targets.0")
  .toStatus(303313, "@targets.0")
  .on("damaged")
  .usage(3)
  .heal(1, "@master")
  .done();

/**
 * @id 133085
 * @name 唐社尔烤鸡
 * @description
 * 本回合中，所有我方角色下一次「元素战技」造成的伤害+2。
 * （每回合每个角色最多食用1次「料理」）
 */
export const TandooriGrilledChicken = card(133085) // 骗骗花
  .reserve();

/**
 * @id 133097
 * @name 甜甜酿花鸡
 * @description
 * 治疗目标角色1点。
 * （每回合每个角色最多食用1次「料理」）
 */
export const SweetMaam = card(133097) // 骗骗花
  .reserve();

/**
 * @id 133098
 * @name 美味马卡龙
 * @description
 * 治疗目标角色1点，该角色接下来3次受到伤害后再治疗其1点。
 * （每回合每个角色最多食用1次「料理」）
 */
export const DeliciousMacarons = card(133098) // 骗骗花
  .reserve();

/**
 * @id 333016
 * @name 龙龙饼干
 * @description
 * 本回合中，目标角色下一次使用「特技」少花费1个元素骰。
 * （每回合每个角色最多食用1次「料理」）
 */
export const [SaurusCrackers] = card(333016)
  .since("v5.1.0")
  .food()
  .toStatus(303314, "@targets.0")
  .oneDuration()
  .once("deductOmniDiceTechnique")
  .deductOmniCost(1)
  .done();

/**
 * @id 333017
 * @name 宝石闪闪
 * @description
 * 目标角色获得1点额外最大生命值。
 * （每回合每个角色最多食用1次「料理」）
 */
export const GlitteringGemstones = card(333017)
  .since("v5.3.0")
  .costSame(1)
  .food()
  .increaseMaxHealth(1, "@targets.0")
  .done();

/**
 * @id 333018
 * @name 咚咚嘭嘭
 * @description
 * 接下来3次名称不存在于初始牌组中的牌加入我方手牌时，目标我方角色治疗自身1点。
 * （每回合每个角色最多食用1次「料理」）
 */
export const [PuffPops] = card(333018)
  .since("v5.3.0")
  .costSame(1)
  .food()
  .toStatus(303315, "@targets.0")
  .on("handCardInserted", (c, e) => !c.isInInitialPile(e.card))
  .usage(3)
  .heal(1, "@master") 
  .done();
