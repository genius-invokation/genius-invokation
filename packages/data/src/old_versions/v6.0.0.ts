import { card, combatStatus, DamageType, skill, summon } from "@gi-tcg/core/builder";
import { AlldevouringNarwhal, AnomalousAnatomy } from "../characters/hydro/alldevouring_narwhal";

/**
 * @id 122043
 * @name 黑色幻影
 * @description
 * 入场时：获得我方已吞噬卡牌中最高元素骰费用值的「攻击力」，获得该费用的已吞噬卡牌数量的可用次数。
 * 结束阶段和我方宣布结束时：造成此牌「攻击力」值的雷元素伤害。
 * 我方出战角色受到伤害时：抵消1点伤害，然后此牌可用次数-2。
 */
const DarkShadow = summon(122043)
  .until("v6.0.0")
  .tags("barrier")
  .usage(0)
  .variable("atk", 0, { visible: false })
  .variable("decreasedDamageId", 0, { visible: false })
  .hint(DamageType.Electro, (c, e) => e.variables.atk)
  .on("enter")
  .do((c) => {
    const domain = c.$(`my combat status with definition id ${DeepDevourersDomain}`)!;
    const maxCost = domain.getVariable("totalMaxCost");
    const count = domain.getVariable("totalMaxCostCount");
    if (count > 0) {
      c.setVariable("atk", maxCost);
      c.setVariable("usage", count);
    } else {
      c.dispose();
    }
  })
  .on("endPhase")
  .do((c) => {
    c.damage(DamageType.Electro, c.getVariable("atk"));
    c.consumeUsage();
  })
  .on("declareEnd")
  .do((c) => {
    c.damage(DamageType.Electro, c.getVariable("atk"));
    c.consumeUsage();
  })
  .on("decreaseDamaged", (c, e) => !c.getVariable("decreasedDamageId") && e.target.isActive())
  .do((c, e) => {
    e.decreaseDamage(1);
    c.setVariable("decreasedDamageId", e.damageInfo.id);
  })
  .on("damaged", (c, e) => e.damageInfo.id === c.getVariable("decreasedDamageId"))
  .consumeUsage(2)
  .setVariable("decreasedDamageId", 0)
  .done();

/**
 * @id 122041
 * @name 深噬之域
 * @description
 * 我方舍弃或调和的卡牌，会被吞噬。
 * 每吞噬3张牌：吞星之鲸在回合结束时获得1点额外最大生命；如果其中存在原本元素骰费用值相同的牌，则额外获得1点；如果3张均相同，再额外获得1点。
 * 【此卡含描述变量】
 */
const DeepDevourersDomain = combatStatus(122041)
  .until("v6.0.0")
  .variable("cardCount", 0)
  .variable("totalMaxCost", 0, { visible: false })
  .variable("totalMaxCostCount", 0, { visible: false })
  .variable("card0Cost", 0, { visible: false })
  .variable("card1Cost", 0, { visible: false })
  .variable("extraMaxHealth", 0, { visible: false })
  .replaceDescription("[GCG_TOKEN_SHIELD]", (_, self) => self.variables.extraMaxHealth)
  .on("disposeOrTuneCard")
  .do((c, e) => {
    const cost = e.diceCost();
    c.addVariable("cardCount", 1);
    switch (c.getVariable("cardCount")) {
      case 1: {
        c.setVariable("card0Cost", cost);
        break;
      }
      case 2: {
        c.setVariable("card1Cost", cost);
        break;
      }
      case 3: {
        const card0Cost = c.getVariable("card0Cost");
        const card1Cost = c.getVariable("card1Cost");
        const card2Cost = cost;
        const distinctCostCount = new Set([card0Cost, card1Cost, card2Cost]).size;
        const extraMaxHealth = 4 - distinctCostCount;
        c.addVariable("extraMaxHealth", extraMaxHealth);
        c.setVariable("cardCount", 0);
        break;
      }
    }
    const previousTotalMaxCost = c.getVariable("totalMaxCost");
    if (cost === previousTotalMaxCost) {
      c.addVariable("totalMaxCostCount", 1);
    } else if (cost > previousTotalMaxCost) {
      c.setVariable("totalMaxCost", cost);
      c.setVariable("totalMaxCostCount", 1);
    }
  })
  .on("endPhase") // 文本有误，实为结束阶段时
  .do((c, e) => {
    const extraMaxHealth = c.getVariable("extraMaxHealth");
    if (extraMaxHealth) {
      const narwhal = c.$(`my character with definition id ${AlldevouringNarwhal}`);
      if (narwhal) {
        narwhal.addStatus(AnomalousAnatomy, {
          overrideVariables: { extraMaxHealth }
        });
        c.increaseMaxHealth(extraMaxHealth, narwhal);
      }
      c.setVariable("extraMaxHealth", 0);
    }
  })
  .done();
