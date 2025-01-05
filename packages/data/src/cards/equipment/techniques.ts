// Copyright (C) 2024 Guyutongxue
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

import { CardDefinition } from "@gi-tcg/core";
import { card, DamageType, status, StatusHandle } from "@gi-tcg/core/builder";

/**
 * @id 115102
 * @name 竹星
 * @description
 * 特技：仙力助推
 * 可用次数：2
 * （角色最多装备1个「特技」）
 * [1151021: 仙力助推] (1*Same) 治疗所附属角色2点，并使其下次普通攻击视为下落攻击，伤害+1，并且技能结算后造成1点风元素伤害。
 */
const Starwicker = void 0; // moved to xianyun

/**
 * @id 122051
 * @name 水泡史莱姆
 * @description
 * 特技：水泡战法
 * 可用次数：2
 * （角色最多装备1个「特技」）
 * [1220511: 水泡战法] (1*Same) （需准备1个行动轮）造成1点水元素伤害，敌方出战角色附属水泡围困。
 * [1220512: 水泡封锁] () 造成1点水元素伤害，敌方出战角色附属水泡围困。
 * [1220513: 水泡封锁] () 造成1点水元素伤害，敌方出战角色附属水泡围困。
 */
const MistBubbleSlime = void 0; // moved to hydro_hilichurl_rogue

/**
 * @id 313001
 * @name 异色猎刀鳐
 * @description
 * 特技：原海水刃
 * 可用次数：2
 * （角色最多装备1个「特技」）
 * [3130011: 原海水刃] (2*Void) 造成2点物理伤害。
 */
export const XenochromaticHuntersRay = card(313001)
  .since("v5.0.0")
  .technique()
  .provideSkill(3130011)
  .costVoid(2)
  .usage(2)
  .damage(DamageType.Physical, 2)
  .done();

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
export const Yumkasaurus = card(313002)
  .since("v5.0.0")
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
    const hands = c.getMaxCostHands("opp");
    // const [selected] = c.randomCard(hands);
    c.stealHandCard(hands[0]);
  })
  .done();

/**
 * @id 313003
 * @name 鳍游龙
 * @description
 * 特技：游隙灵道
 * 可用次数：2
 * （角色最多装备1个「特技」）
 * [3130031: 游隙灵道] (1*Same) 选择一个我方「召唤物」，立刻触发其「结束阶段」效果。（每回合最多使用1次）
 * [3130032: ] ()
 */
export const Koholasaurus = card(313003)
  .since("v5.0.0")
  .costSame(2)
  .technique()
  .provideSkill(3130031)
  .costSame(1)
  .usage(2)
  .usagePerRound(1)
  .addTarget("my summon")
  .do((c, e) => {
    c.triggerEndPhaseSkill(e.targets[0])
  })
  .done();

/**
 * @id 123031
 * @name 厄灵·炎之魔蝎
 * @description
 * 所附属角色受到伤害时：如可能，失去1点充能，以抵消1点伤害，然后生成魔蝎祝福。（每回合至多2次）
 * 特技：炙烧攻势
 * 可用次数：1
 * （角色最多装备1个「特技」）
 * [1230311: 炙烧攻势] (2*Same) 造成2点火元素伤害。
 * [1230312: ] ()
 */
const SpiritOfOmenPyroScorpion = void 0; // moved to eremite_scorching_loremaster

/**
 * @id 127032
 * @name 厄灵·草之灵蛇
 * @description
 * 特技：藤蔓锋鳞
 * 可用次数：2
 * （角色最多装备1个「特技」）
 * [1270321: 藤蔓锋鳞] (1*Void, 1*Energy) 造成1点草元素伤害。
 * [2270312: ] ()
 */
const SpiritOfOmenDendroSpiritserpent = void 0; // moved to eremite_floral_ringdancer

/**
 * @id 301301
 * @name 掘进的收获
 * @description
 * 提供2点护盾，保护所附属角色。
 */
const DiggingDownToPaydirt = status(301301)
  .shield(2)
  .done();

/**
 * @id 313004
 * @name 嵴锋龙
 * @description
 * 特技：掘进突击
 * 可用次数：2
 * （角色最多装备1个「特技」）
 * [3130041: 掘进突击] (2*Void) 抓2张牌。然后，如果手牌中存在名称不存在于本局最初牌组中的牌，则提供2点护盾保护所附属角色。
 */
export const Tepetlisaurus = card(313004)
  .since("v5.1.0")
  .costSame(2)
  .technique()
  .provideSkill(3130031)
  .costVoid(2)
  .drawCards(2)
  .if((c) => {
    return c.player.hands.some((card) => !c.isInInitialPile(card));
  })
  .characterStatus(DiggingDownToPaydirt, "@master")
  .done();

/**
 * @id 313005
 * @name 暝视龙
 * @description
 * 特技：灵性援护
 * 可用次数：2
 * （角色最多装备1个「特技」）
 * [3130051: 灵性援护] (1*Same) 从「场地」「道具」「料理」中挑选1张加入手牌，并且治疗附属角色1点。
 */
export const Iktomisaurus = card(313005)
  .since("v5.2.0")
  .costSame(2)
  .technique()
  .provideSkill(3130051)
  .usage(2)
  .costSame(1)
  .heal(1, "@master")
  .do((c) => {
    const tags = ["place", "item", "food"] as const;
    const candidates: CardDefinition[] = [];
    for (const tag of tags) {
      const def = c.random(c.allCardDefinitions(tag));
      candidates.push(def);
    }
    c.selectAndCreateHandCard(candidates);
  })
  .done();

/**
 * @id 112142
 * @name 咬咬鲨鱼
 * @description
 * 双方切换角色后，且玛拉妮为出战角色时：消耗1点「夜魂值」，使敌方出战角色附属啃咬目标。
 * 特技：鲨鲨冲浪板
 * 所附属角色「夜魂值」为0时，弃置此牌；此牌被弃置时，所附属角色结束夜魂加持。
 * [1121421: ] ()
 * [1121422: 鲨鲨冲浪板] (1*Hydro) 切换到上一个我方角色，使敌方出战角色附属1层啃咬目标。（若我方后台角色均被击倒，则额外消耗1点「夜魂值」）
 * [1121423: ] ()
 */
const BiteyShark = void 0; /* moved to mualani */


/**
 * @id 301302
 * @name 目标
 * @description
 * 敌方附属有绒翼龙的角色切换至前台时：自身减少1层效果。
 */
export const Target: StatusHandle = status(301302)
  .variableCanAppend("effect", 1, Infinity)
  // 目标本身实际并无效果
  // .on("switchActive", (c, e) => {
  //   const switchTo = c.of(e.switchInfo.to);
  //   return !switchTo.isMine() && switchTo.hasEquipment(Qucusaurus);
  // })
  // .listenToAll()
  // .do((c) => {
  //   c.addVariable("effect", -1);
  //   if (c.getVariable("effect") <= 0) {
  //     c.dispose();
  //   }
  // })
  .done();

/**
 * @id 313006
 * @name 绒翼龙
 * @description
 * 入场时：敌方出战角色附属目标。
 * 附属角色切换为出战角色，且敌方出战角色附属目标时：如可能，舍弃原本元素骰费用最高的1张手牌，将此次切换视为「快速行动」而非「战斗行动」，少花费1个元素骰，并移除对方所有角色的目标。
 * 特技：迅疾滑翔
 * 可用次数：2
 * （角色最多装备1个「特技」）
 * [3130061: ] ()
 * [3130062: ] ()
 * [3130063: 迅疾滑翔] (1*Same) 切换到下一名角色，敌方出战角色附属目标。
 */
export const Qucusaurus = card(313006)
  .since("v5.3.0")
  .costSame(1)
  .technique()
  .on("enter")
  .characterStatus(Target, "opp active")
  .on("deductOmniDiceSwitch", (c, e) =>                           // 绒翼龙只在可以减费时生效
    c.$(`opp active has status with definition id ${Target}`) &&  // 敌方出战角色附属目标
    e.action.to.id === c.self.master().id &&                      // 附属角色切换为出战角色
    c.player.hands.length > 0)                                    // 有手牌（“如可能，舍弃”）
  .deductOmniCost(1)
  .setFastAction()
  .do((c) => {
    c.disposeRandomCard(c.getMaxCostHands());
    for (const st of c.$$(`opp status with definition id ${Target}`)) {
      st.dispose();
    }
  })
  .endOn()
  .provideSkill(3130063)
  .usage(2)
  .costSame(1)
  .switchActive("my next")
  .characterStatus(Target, "opp active")
  .done();
