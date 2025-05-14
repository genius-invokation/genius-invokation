// Copyright (C) 2025 DrAbx123 @genius-invokation
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

import { character, skill, summon, status, card, DamageType, Aura } from "@gi-tcg/core/builder";

/**
 * @id 116111
 * @name 夜魂加持
 * @description
 * 所附属角色可累积「夜魂值」。（最多累积到2点）
 */
export const NightsoulsBlessing = status(116111)
  .since("v5.6.51-beta")
  .nightsoulsBlessing(2)
  .done();

/**
 * @id
 * @name 白曜护盾
 * @description
 * 为我方出战角色提供1点护盾。（可叠加）
 */
export const OpalShield = combatStatus(11111111111111111111111111111111)
  .shield(1, Infinity)
  .done();

/**
 * @id
 * @name 伊兹帕帕
 * @description
 * 我方角色受到伤害后：减少1点茜特菈莉的「夜魂值」，生成1层白曜护盾。
 * 当茜特菈莉获得「夜魂值」并使自身「夜魂值」等于2时，对敌方出战角色造成1点冰元素伤害。
 * 持续回合：2
 */
export const Itzpapa = combatStatus(11111111111111111111111111111111)
  .duration(2)
  .on("damaged")
  .consumeNightsoul(`my characters with definition id ${Citlali}`)
  .combatStatus(OpalShield)
  .on("gainNightsoul", (c, e) => {
    const nightsoul = c.query(`my characters with definition id ${Citlali}`).hasNightsoulsBlessing();
    if (nightsoul && c.of(nightsoul).getVariable("nightsoul") === 2) {
      c.damage(DamageType.Cryo, 1);
    }
  })
  .done();


  /**
 * @id
 * @name 五重天的寒雨（生效中）
 * @description
 * 我方造成的水元素伤害和火元素伤害+1，并使茜特菈莉获得1点夜魂值。（每回合1次）
 * 可用次数：2
 */
export const MamaloacosFrigidRainInEffect = combatStatus(11111111111111111111111111111111)
  .since("v5.6.51-beta")
  .on("increaseDamage", (c, e) => e.type === DamageType.Hydro || e.type === DamageType.Pyro)
  .usage(2)
  .increaseDamage(1)
  .gainNightsoul(`my characters with definition id ${Citlali}`, 2)
  .done();


/**
 * @id
 * @name 宿灵捕影
 * @description
 * 造成1点冰元素伤害。
 */
export const ShadowStealingSpiritVessel = skill(123456789011)
  .type("normal")
  .costCryo(1)
  .costVoid(2)
  .damage(DamageType.Cryo, 1)
  .done();

/**
 * @id
 * @name 霜昼黑星
 * @description
 * 造成1点冰元素伤害。
 * 自身进入夜魂加持，并获得1点「夜魂值」；生成1点白曜护盾和伊兹帕帕。（角色进入夜魂加持后不可使用此技能）
 */
export const DawnfrostDarkstar = skill(123456789012)
  .type("elemental")
  .costCryo(3)
  .filter((c) => !c.self.hasStatus(NightsoulsBlessing))
  .damage(DamageType.Cryo, 1)
  .gainNightsoul("@self", 1)
  .combatStatus(OpalShield)
  .combatStatus(Itzpapa)
  .done();

/**
 * @id
 * @name 诸曜饬令
 * @description
 * 造成2点冰元素伤害，对所有敌方后台角色造成1点穿透伤害，并获得2点「夜魂值」。
 */
export const EdictOfEntwinedSplendor = skill(25678909876543)
  .type("burst")
  .costCryo(3)
  .costEnergy(2)
  .damage(DamageType.Cryo, 2)
  .damage(DamageType.Piercing, 1, "opp standby")
  .gainNightsoul("@self", 2)
  .done();

/**
 * @id
 * @name 奥秘传唱
 * @description
 * 【被动】我方进行挑选或触发元素反应后：获得1点「夜魂值」。（每回合2次）
 */
export const SongsOfProfoundMysterySlection = skill(999999)
  .type("passive")
  .variable("gainNightsoulUsagePerRound", 2)
  .on("select", (c) => c.getVariable("gainNightsoulUsagePerRound"))
  .gainNightsoul("@self")
  .addVariable("gainNightsoulUsagePerRound", -1)
  .onDeferedReaction((c) => c.getVariable("gainNightsoulUsagePerRound"))
  .listenToPlayer()
  .gainNightsoul("@self")
  .addVariable("gainNightsoulUsagePerRound", -1)
  .on("roundEnd")
  .setVariable("gainNightsoulUsagePerRound", 2)
  .done()

/**
 * @id
 * @name 茜特菈莉
 * @description
 *
 */
export const Citlali = character(12345678901)
  .since("v5.6.51-beta")
  .tags("cryo", "catalyst", "natlan")
  .health(10)
  .energy(2)
  .skills(ShadowStealingSpiritVessel, DawnfrostDarkstar, EdictOfEntwinedSplendor, SongsOfProfoundMysterySlection)
  .done();

/**
 * @id
 * @name 五重天的寒雨
 * @description
 * 敌方受到冻结或融化反应伤害后：我方下2次造成的水元素伤害和火元素伤害+1，并使茜特菈莉获得1点夜魂值。（每回合1次）
 *（牌组中包含茜特菈莉，才能加入牌组）
 */
export const MamaloacosFrigidRain = card(2345654565443)
  .since("v5.6.51-beta")
  .costCryo(1)
  .talent(Citlali, "none")
  .on("damaged", (c, e) => (e.getReaction() === Reaction.Frozen || e.getReaction() === Reaction.Melt) && !c.of(e.target).isMine())
  .usagePerRound(1)
  .combatStatus(MamaloacosFrigidRainInEffect)
  .done();
