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

import { character, skill, summon, status, combatStatus, card, DamageType, CombatStatusHandle, StatusHandle, customEvent } from "@gi-tcg/core/builder";

const TalentShouldDrawCard = customEvent("thunderManifestation/talentShouldDrawCard");

/**
 * @id 124022
 * @name 雷鸣探知
 * @description
 * 所附属角色受到雷音权现及其召唤物造成的伤害时：移除此状态，使此伤害+1。
 * （同一方场上最多存在一个此状态。雷音权现的部分技能，会以所附属角色为目标。）
 */
export const LightningRod: StatusHandle = status(124022)
  .unique()
  .on("increaseDamaged", (c, e) => [
      ThunderManifestation as number, 
      ThunderingShacklesSummon as number
    ].includes(e.source.definition.id))
  .increaseDamage(1)
  .dispose()
  .on("damaged")
  .emitCustomEvent(TalentShouldDrawCard)
  .on("selfDispose")
  // 雷音权现对已带有雷鸣探知的角色造成伤害会弃置雷鸣探知
  // 但此行为也会触发天赋的抽牌
  .emitCustomEvent(TalentShouldDrawCard)
  .done();

/**
 * @id 124023
 * @name 轰雷禁锢
 * @description
 * 结束阶段：对附属有雷鸣探知的敌方角色造成3点雷元素伤害。（如果敌方不存在符合条件角色，则改为对出战角色造成伤害）
 * 可用次数：1
 */
export const ThunderingShacklesSummon = summon(124023)
  .hint(DamageType.Electro, "3")
  .on("endPhase")
  .usage(1)
  .do((c) => {
    const target = c.$(`opp character has status with definition id ${LightningRod}`);
    if (target) {
      c.damage(DamageType.Electro, 3, target);
    } else {
      c.damage(DamageType.Electro, 3, "opp active");
    }
  })
  .done();

/**
 * @id 124021
 * @name 雷霆探针
 * @description
 * 所在阵营角色使用技能后：对所在阵营出战角色附属雷鸣探知。（每回合1次）
 */
export const LightningStrikeProbe: CombatStatusHandle = combatStatus(124021)
  .on("useSkill")
  .usagePerRound(1)
  .characterStatus(LightningRod, "my active")
  .done();

/**
 * @id 124024
 * @name 滚雷裂音
 * @description
 * 我方对附属有雷鸣探知的角色造成的伤害+1。
 */
export const RollingThunder = combatStatus(124024)
  .reserve();

/**
 * @id 24021
 * @name 轰霆翼斩
 * @description
 * 造成1点雷元素伤害。
 */
export const ThunderousWingslash = skill(24021)
  .type("normal")
  .costElectro(1)
  .costVoid(2)
  .damage(DamageType.Electro, 1)
  .done();

/**
 * @id 24022
 * @name 雷墙倾轧
 * @description
 * 对附属有雷鸣探知的敌方角色造成3点雷元素伤害。（如果敌方不存在符合条件角色，则改为对出战角色造成伤害）
 */
export const StrifefulLightning = skill(24022)
  .type("elemental")
  .costElectro(3)
  .do((c) => {
    const target = c.$(`opp character has status with definition id ${LightningRod}`);
    if (target) {
      c.damage(DamageType.Electro, 3, target);
    } else {
      c.damage(DamageType.Electro, 3, "opp active");
    }
  })
  .done();

/**
 * @id 24023
 * @name 轰雷禁锢
 * @description
 * 造成2点雷元素伤害，召唤轰雷禁锢。
 */
export const ThunderingShackles = skill(24023)
  .type("burst")
  .costElectro(3)
  .costEnergy(2)
  .damage(DamageType.Electro, 2)
  .summon(ThunderingShacklesSummon)
  .done();

/**
 * @id 24024
 * @name 雷霆探知
 * @description
 * 【被动】战斗开始时，在敌方场上生成雷霆探针。
 */
export const LightningProbe = skill(24024)
  .type("passive")
  .on("battleBegin")
  .combatStatus(LightningStrikeProbe, "opp")
  .done();

/**
 * @id 2402
 * @name 雷音权现
 * @description
 * 只要土地中的怨恨不消，那雷鸣也不会断绝吧。
 */
export const ThunderManifestation = character(2402)
  .since("v4.3.0")
  .tags("electro", "monster")
  .health(10)
  .energy(2)
  .skills(ThunderousWingslash, StrifefulLightning, ThunderingShackles, LightningProbe)
  .done();

/**
 * @id 224021
 * @name 悲号回唱
 * @description
 * 战斗行动：我方出战角色为雷音权现时，装备此牌。
 * 雷音权现装备此牌后，立刻使用一次雷墙倾轧。
 * 装备有此牌的雷音权现在场，附属有雷鸣探知的敌方角色受到伤害时：我方抓1张牌。（每回合1次）
 * （牌组中包含雷音权现，才能加入牌组）
 */
export const GrievingEcho = card(224021)
  .since("v4.3.0")
  .costElectro(3)
  .talent(ThunderManifestation)
  .on("enter")
  .useSkill(StrifefulLightning)
  .on(TalentShouldDrawCard)
  .listenToAll()
  .usagePerRound(1)
  .drawCards(1)
  .done();
