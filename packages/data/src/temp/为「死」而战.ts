/**
 * @id
 * @name 为「死」而战
 * @description
 * 抓2张牌。
 * 我方场上每存在一个被击倒的角色：我方剩余全体角色+2最大生命上限。
 */
export const FightToTheDeath = card(999999999999)
  .since("v5.6.51-beta")
  .costSame(2)
  .legend()
  .drawCards(2)
  .variable("DefeatedCharactersCount", 0)
  .do((c) => {
    for (const ch of c.$$(`all my defeated characters`)) {
      c.addVariable("DefeatedCharactersCount", 1)
    }
    for (const ch of c.$$(`all my characters`)){
      c.increaseMaxHealth(c.getVariable("DefeatedCharactersCount"), ch)
    }
  })
  .done();