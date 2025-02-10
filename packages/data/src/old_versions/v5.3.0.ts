import { card, DamageType, skill } from "@gi-tcg/core/builder";
import { DriftcloudWave, Skyladder } from "../characters/anemo/xianyun";

/**
 * @id 313002
 * @name 匿叶龙
 * @description
 * 特技：钩物巧技
 * 可用次数：2
 * （角色最多装备1个「特技」）
 * [3130021: 钩物巧技] (2*Same) 造成1点物理伤害，窃取1张原本元素骰费用最高的对方手牌。
 * 如果我方手牌数不多于2，此特技少花费1个元素骰。
 * [3130022: ] ()
 */
const Yumkasaurus = card(313002)
  .until("v5.3.0")
  .costSame(1)
  .technique()
  .on("deductOmniDiceSkill", (c, e) => e.action.skill.definition.id === 3130021 && c.player.hands.length <= 2)
  .deductOmniCost(1)
  .endOn()
  .provideSkill(3130021)
  .costSame(2)
  .usage(2)
  .damage(DamageType.Physical, 1)
  .do((c) => {
    const [handCard] = c.maxCostHands(1, { who: "opp" });
    if (handCard) {
      c.stealHandCard(handCard);
    }
  })
  .done();

/**
 * @id 15102
 * @name 朝起鹤云
 * @description
 * 造成2点风元素伤害，生成步天梯，本角色附属闲云冲击波。
 */
const WhiteCloudsAtDawn = skill(15102)
  .until("v5.3.0")
  .type("elemental")
  .costAnemo(3)
  .damage(DamageType.Anemo, 2)
  .combatStatus(Skyladder)
  .characterStatus(DriftcloudWave)
  .done();
