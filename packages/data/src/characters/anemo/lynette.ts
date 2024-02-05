import { character, skill, summon, status, combatStatus, card, DamageType, SkillHandle } from "@gi-tcg/core/builder";

/**
 * @id 115082
 * @name 惊奇猫猫盒
 * @description
 * 结束阶段：造成1点风元素伤害。
 * 可用次数：2
 * 我方出战角色受到伤害时：抵消1点伤害。（每回合1次）
 * 我方角色受到冰/水/火/雷伤害时：转换此牌的元素类型，改为造成所受到的元素类型的伤害。（离场前仅限一次）
 */
export const BogglecatBox = summon(115082)
  .endPhaseDamage("swirledAnemo", 1)
  .usage(2)
  .on("beforeDamaged", (c, e) => c.of(e.target).isActive())
  .usagePerRound(1)
  .decreaseDamage(1)
  .done();

/**
 * @id 115081
 * @name 攻袭余威
 * @description
 * 结束阶段：如果角色生命值至少为6，则受到2点穿透伤害。
 * 持续回合：1
 */
export const OverawingAssault = status(115081)
  .duration(1)
  .on("endPhase", (c) => c.self.master().health >= 6)
  .damage(DamageType.Piercing, 2, "@master")
  .done();

/**
 * @id 115083
 * @name 惊奇猫猫盒的嘲讽
 * @description
 * 我方出战角色受到伤害时：抵消1点伤害。（每回合1次）
 */
export const BogglecatBoxsTaunt = combatStatus(115083)
  .reserve();

/**
 * @id 15081
 * @name 迅捷礼刺剑
 * @description
 * 造成2点物理伤害。
 */
export const RapidRitesword = skill(15081)
  .type("normal")
  .costAnemo(1)
  .costVoid(2)
  .damage(DamageType.Physical, 2)
  .done();

/**
 * @id 15082
 * @name 谜影障身法
 * @description
 * 造成3点风元素伤害，本回合第一次使用此技能、且自身生命值不多于8时治疗自身2点，但是附属攻袭余威。
 */
export const EnigmaticFeint = skill(15082)
  .type("elemental")
  .costAnemo(3)
  .do((c) => {
    const count = c.countOfThisSkill();
    if (count === 0 &&
      c.self.health <= 8) {
      c.heal(2, "@self")
      c.characterStatus(OverawingAssault, "@self")
    }
    if (count === 1 && c.self.hasEquipment(AColdBladeLikeAShadow)) {
      c.damage(DamageType.Anemo, 5)
      c.switchActive("opp prev");
    } else {
      c.damage(DamageType.Anemo, 3)
    }
  })
  .done();

/**
 * @id 15083
 * @name 魔术·运变惊奇
 * @description
 * 造成2点风元素伤害，召唤惊奇猫猫盒。
 */
export const MagicTrickAstonishingShift = skill(15083)
  .type("burst")
  .costAnemo(3)
  .costEnergy(2)
  .damage(DamageType.Anemo, 2)
  .summon(BogglecatBox)
  .done();

/**
 * @id 1508
 * @name 琳妮特
 * @description
 * 水中窥月，洞见夜明。
 */
export const Lynette = character(1508)
  .tags("anemo", "sword", "fontaine", "fatui", "pneuma")
  .health(10)
  .energy(2)
  .skills(RapidRitesword, EnigmaticFeint, MagicTrickAstonishingShift)
  .done();

/**
 * @id 215081
 * @name 如影流露的冷刃
 * @description
 * 战斗行动：我方出战角色为琳妮特时，装备此牌。
 * 琳妮特装备此牌后，立刻使用一次谜影障身法。
 * 装备有此牌的琳妮特每回合第二次使用谜影障身法时：伤害+2，并强制敌方切换到前一个角色。
 * （牌组中包含琳妮特，才能加入牌组）
 */
export const AColdBladeLikeAShadow = card(215081)
  .costAnemo(3)
  .talent(Lynette)
  .on("enter")
  .useSkill(EnigmaticFeint)
  .done();
