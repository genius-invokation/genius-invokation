
/**
 * @id 332046
 * @name 飞行队出击！
 * @description
 * 随机舍弃至多2张原本元素骰费用最高的手牌，随后抓牌直至手牌中有4张牌。
 * 此牌在手牌被舍弃后：抓1张牌。
 */
export const FlyingSquadAttack = card(332046)
  .since("v5.6.51-beta")
  .costVoid(3)
  // TODO
  .do((c) => {
    c.disposeMaxCostHands(2);
    if (c.player.hands.length < 4) {
      c.drawCards(4 - c.player.hands.length, { who: "my" });
    }
  })
  .onDispose((c) => {
    c.drawCards(1);
  })
  .done();
/**
 * @id 303241
 * @name 健身的成果（生效中）
 * @description
 * 我方其他角色准备技能时：所选角色下次元素战技花费1个元素骰。（至多触发2次，不可叠加）
 */
export const FruitsOfTrainingInEffect01 = combatStatus(303241)
  // TODO
  // .on()
  // .do((c) => {
  //   c.toStatus(303242, "@targets.0")
  // })

  // .usagePerRound(2)
  .done();

/**
 * @id 303242
 * @name 健身的成果（生效中）
 * @description
 * 该角色下次元素战技花费1个元素骰。（不可叠加）
 */
export const FruitsOfTrainingInEffect02 = combatStatus(303242)
// TODO
// .once("deductOmniDice", (c, e) => e.isSkillOrTalentOf(c.self.master().state, "elemental"))
// .deductOmniCost(1)
.done();

/**
 * @id 332048
 * @name 健身的成果
 * @description
 * 选一个我方角色，我方其他角色准备技能时：所选角色下次元素战技少花费1个元素骰。（至多触发2次，不可叠加）
 */
export const FruitsOfTraining = card(332048)
  .since("v5.6.51-beta")
  // TODO
  // .addTarget("my characters")
  // .toStatus(303241, "@targets.0")

  .done();