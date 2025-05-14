/**
 * @id
 * @name 船坞长剑
 * @description
 * 所附属角色受到伤害时：如可能，舍弃原本元素骰费用最高的1张手牌，以抵消1点伤害，然后累积1点「团结」。（每回合1次）
 * 角色造成伤害时：如果此牌已有「团结」，则消耗所有「团结」，使此伤害+1，并且每消耗1点「团结」就抓1张牌。
 * （「单手剑」角色才能装备。角色最多装备1件「武器」）
 */
export const SplendorOfTranquilWaters = card(99999999999999)
  .since("v5.6.51-beta")
  .costSame(2)
  .weapon("sword")
  .variable("Solidarity", 0)
  .on("damagedOrHealed")
  .addVariable("lake", 1)
  .on("deductVoidDiceSkill", (c, e) => e.isSkillType("normal") && c.getVariable("lake") >= 12)
  .usagePerRound(1)
  .deductVoidCost(2)
  .on("increaseSkillDamage", (c, e) => e.viaSkillType("normal") && c.getVariable("lake") >= 12)
  .usagePerRound(1)
  .addVariable("lake", -12)
  .increaseDamage(1)
  .heal(1, "@master")
  .done();