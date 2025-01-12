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

import { character, skill, summon, status, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 114071
 * @name 雷罚恶曜之眼
 * @description
 * 结束阶段：造成1点雷元素伤害。
 * 可用次数：3
 * 此召唤物在场时：我方角色「元素爆发」造成的伤害+1。
 */
export const EyeOfStormyJudgment = summon(114071)
  .endPhaseDamage(DamageType.Electro, 1)
  .usage(3)
  .on("increaseSkillDamage", (c, e) => e.viaSkillType("burst"))
  .increaseDamage(1)
  .done();

/**
 * @id 114072
 * @name 诸愿百眼之轮
 * @description
 * 其他我方角色使用「元素爆发」后：累积1点「愿力」。（最多累积3点）
 * 所附属角色使用奥义·梦想真说时：消耗所有「愿力」，每点「愿力」使造成的伤害+1。
 */
export const ChakraDesiderataStatus = status(114072)
  .variable("chakra", 0)
  .on("useSkill", (c, e) => e.isSkillType("burst") && e.skill.caller.id !== c.self.master().id)
  .listenToPlayer()
  .addVariableWithMax("chakra", 1, 3)
  .on("increaseSkillDamage", (c, e) => e.via.definition.id === SecretArtMusouShinsetsu)
  .do((c, e) => {
    const currentVal = c.getVariable("chakra");
    if (c.self.master().hasEquipment(WishesUnnumbered)) {
      e.increaseDamage(currentVal * 2);
    } else {
      e.increaseDamage(currentVal);
    }
    c.setVariable("chakra", 0);
  })
  .done();

/**
 * @id 14071
 * @name 源流
 * @description
 * 造成2点物理伤害。
 */
export const Origin = skill(14071)
  .type("normal")
  .costElectro(1)
  .costVoid(2)
  .damage(DamageType.Physical, 2)
  .done();

/**
 * @id 14072
 * @name 神变·恶曜开眼
 * @description
 * 召唤雷罚恶曜之眼。
 */
export const TranscendenceBalefulOmen = skill(14072)
  .type("elemental")
  .costElectro(3)
  .summon(EyeOfStormyJudgment)
  .done();

/**
 * @id 14073
 * @name 奥义·梦想真说
 * @description
 * 造成3点雷元素伤害，其他我方角色获得2点充能。
 */
export const SecretArtMusouShinsetsu = skill(14073)
  .type("burst")
  .costElectro(4)
  .costEnergy(2)
  .damage(DamageType.Electro, 3)
  .gainEnergy(2, "all my characters and not @self")
  .done();

/**
 * @id 14074
 * @name 诸愿百眼之轮
 * @description
 * 【被动】战斗开始时，初始附属诸愿百眼之轮。
 */
export const ChakraDesiderata = skill(14074)
  .type("passive")
  .on("battleBegin")
  .characterStatus(ChakraDesiderataStatus)
  .on("revive")
  .characterStatus(ChakraDesiderataStatus)
  .done();

/**
 * @id 1407
 * @name 雷电将军
 * @description
 * 鸣雷寂灭，浮世泡影。
 */
export const RaidenShogun = character(1407)
  .since("v3.7.0")
  .tags("electro", "pole", "inazuma")
  .health(10)
  .energy(2)
  .skills(Origin, TranscendenceBalefulOmen, SecretArtMusouShinsetsu, ChakraDesiderata)
  .done();

/**
 * @id 214071
 * @name 万千的愿望
 * @description
 * 战斗行动：我方出战角色为雷电将军时，装备此牌。
 * 雷电将军装备此牌后，立刻使用一次奥义·梦想真说。
 * 装备有此牌的雷电将军使用奥义·梦想真说时：每消耗1点「愿力」，都使造成的伤害额外+1。
 * （牌组中包含雷电将军，才能加入牌组）
 */
export const WishesUnnumbered = card(214071)
  .since("v3.7.0")
  .costElectro(4)
  .costEnergy(2)
  .talent(RaidenShogun)
  .on("enter")
  .useSkill(SecretArtMusouShinsetsu)
  .done();
