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

import { DamageType, DiceType, EntityState, card, combatStatus, diceCostOfCard, status } from "@gi-tcg/core/builder";
import { ForbiddenKnowledge } from "../event/other";

/**
 * @id 321001
 * @name 璃月港口
 * @description
 * 结束阶段：抓2张牌。
 * 可用次数：2
 */
export const LiyueHarborWharf = card(321001)
  .since("v3.3.0")
  .costSame(2)
  .support("place")
  .on("endPhase")
  .usage(2)
  .drawCards(2)
  .done();

/**
 * @id 321002
 * @name 骑士团图书馆
 * @description
 * 入场时：选择任意元素骰重投。
 * 投掷阶段：获得额外一次重投机会。
 */
export const KnightsOfFavoniusLibrary = card(321002)
  .since("v3.3.0")
  .support("place")
  .on("enter")
  .rerollDice(1)
  .on("roll")
  .addRerollCount(1)
  .done();

/**
 * @id 321003
 * @name 群玉阁
 * @description
 * 投掷阶段：2个元素骰初始总是投出我方出战角色类型的元素。
 * 行动阶段开始时：如果我方手牌数量不多于3，则弃置此牌，生成1个万能元素。
 */
export const JadeChamber = card(321003)
  .since("v3.3.0")
  .support("place")
  .on("roll")
  .do((c, e) => {
    e.fixDice(c.$("my active")!.element(), 2);
  })
  .on("actionPhase", (c) => c.player.hands.length <= 3)
  .generateDice(DiceType.Omni, 1)
  .dispose()
  .done();

/**
 * @id 321004
 * @name 晨曦酒庄
 * @description
 * 我方执行「切换角色」行动时：少花费1个元素骰。（每回合至多2次）
 */
export const DawnWinery = card(321004)
  .since("v3.3.0")
  .costSame(2)
  .support("place")
  .on("deductOmniDiceSwitch")
  .usagePerRound(2)
  .deductOmniCost(1)
  .done();

/**
 * @id 321005
 * @name 望舒客栈
 * @description
 * 结束阶段：治疗受伤最多的我方后台角色2点。
 * 可用次数：2
 */
export const WangshuInn = card(321005)
  .since("v3.3.0")
  .costSame(2)
  .support("place")
  .on("endPhase", (c) => c.$(`my standby with health < maxHealth`))
  .usage(2)
  .heal(2, "my standby characters order by health - maxHealth limit 1")
  .done();

/**
 * @id 321006
 * @name 西风大教堂
 * @description
 * 结束阶段：治疗我方「出战角色」2点。
 * 可用次数：2
 */
export const FavoniusCathedral = card(321006)
  .since("v3.3.0")
  .costSame(2)
  .support("place")
  .on("endPhase", (c) => c.$(`my active with health < maxHealth`))
  .usage(2)
  .heal(2, "my active")
  .done();

/**
 * @id 321007
 * @name 天守阁
 * @description
 * 行动阶段开始时：如果我方的元素骰包含5种不同的元素，则生成1个万能元素。
 */
export const Tenshukaku = card(321007)
  .since("v3.7.0")
  .costSame(2)
  .support("place")
  .on("actionPhase", (c) => new Set(c.player.dice).size >= 5)
  .generateDice(DiceType.Omni, 1)
  .done();

/**
 * @id 321008
 * @name 鸣神大社
 * @description
 * 每回合自动触发1次：生成1个随机的基础元素骰。
 * 可用次数：3
 */
export const GrandNarukamiShrine = card(321008)
  .since("v3.6.0")
  .costSame(2)
  .support("place")
  .on("enter")
  .generateDice("randomElement", 1)
  .on("actionPhase")
  .usage(2)
  .generateDice("randomElement", 1)
  .done();

/**
 * @id 321009
 * @name 珊瑚宫
 * @description
 * 结束阶段：治疗所有我方角色1点。
 * 可用次数：2
 */
export const SangonomiyaShrine = card(321009)
  .since("v3.7.0")
  .costSame(2)
  .support("place")
  .on("endPhase", (c) => c.$(`my characters with health < maxHealth`))
  .usage(2)
  .heal(1, "all my characters")
  .done();

/**
 * @id 321010
 * @name 须弥城
 * @description
 * 我方打出「天赋」牌或我方角色使用技能时：如果我方元素骰数量不多于手牌数量，则少花费1个元素骰。（每回合1次）
 */
export const SumeruCity = card(321010)
  .since("v3.7.0")
  .costSame(2)
  .support("place")
  .on("deductOmniDice", (c, e) =>
    (e.isUseSkill() || e.hasCardTag("talent")) && 
    (c.player.dice.length <= c.player.hands.length))
  .usagePerRound(1)
  .deductOmniCost(1)
  .done();

/**
 * @id 321011
 * @name 桓那兰那
 * @description
 * 结束阶段：收集最多2个未使用的元素骰。
 * 行动阶段开始时：拿回此牌所收集的元素骰。
 */
export const Vanarana = card(321011)
  .since("v3.7.0")
  .support("place")
  .variable("count", 0)
  .variable("d1", 0, { visible: false })
  .variable("d2", 0, { visible: false })
  .on("endPhase")
  .do((c) => {
    const absorbed = c.absorbDice("seq", 2);
    c.setVariable("count", absorbed.length);
    c.setVariable("d1", absorbed[0] ?? 0);
    c.setVariable("d2", absorbed[1] ?? 0);
  })
  .on("actionPhase")
  .do((c) => {
    if (c.getVariable("count") === 2) {
      c.generateDice(c.getVariable("d1"), 1);
      c.generateDice(c.getVariable("d2"), 1);
    } else if (c.getVariable("count") === 1) {
      c.generateDice(c.getVariable("d1"), 1);
    }
  })
  .setVariable("count", 0)
  .done();

/**
 * @id 321012
 * @name 镇守之森
 * @description
 * 行动阶段开始时：如果我方不是「先手牌手」，则生成1个出战角色类型的元素骰。
 * 可用次数：3
 */
export const ChinjuForest = card(321012)
  .since("v3.7.0")
  .costSame(1)
  .support("place")
  .on("actionPhase", (c) => !c.isMyTurn())
  .usage(3)
  .do((c) => {
    c.generateDice(c.$("my active")!.element(), 1);
  })
  .done();

/**
 * @id 321013
 * @name 黄金屋
 * @description
 * 我方打出原本元素骰费用至少为3的「武器」或「圣遗物」手牌时：少花费1个元素骰。（每回合1次）
 * 可用次数：2
 */
export const GoldenHouse = card(321013)
  .since("v4.0.0")
  .support("place")
  .on("deductOmniDiceCard", (c, e) =>
    e.hasOneOfCardTag("weapon", "artifact") &&
    e.originalDiceCostSize() >= 3)
  .usagePerRound(1)
  .usage(2)
  .deductOmniCost(1)
  .done();

/**
 * @id 321014
 * @name 化城郭
 * @description
 * 我方选择行动前，元素骰数量为0时：生成1个万能元素。（每回合1次）
 * 可用次数：3
 */
export const GandharvaVille = card(321014)
  .since("v4.1.0")
  .costSame(1)
  .support("place")
  .on("beforeAction", (c) => c.player.dice.length === 0)
  .usagePerRound(1)
  .generateDice(DiceType.Omni, 1)
  .done();

/**
 * @id 321015
 * @name 风龙废墟
 * @description
 * 入场时：从牌组中随机抽取1张「天赋」牌。
 * 我方打出「天赋」牌，或我方角色使用原本元素骰消耗至少为4的技能时：少花费1个元素骰。（每回合1次）
 * 可用次数：3
 */
export const StormterrorsLair = card(321015)
  .since("v4.2.0")
  .costSame(2)
  .support("place")
  .on("enter")
  .drawCards(1, { withTag: "talent" })
  .on("deductOmniDice", (c, e) => {
    return e.hasCardTag("talent") ||
      (e.isUseSkill() && e.originalDiceCostSize() >= 4);
  })
  .usage(3)
  .usagePerRound(1)
  .deductOmniCost(1)
  .done();

/**
 * @id 321016
 * @name 湖中垂柳
 * @description
 * 结束阶段：如果我方手牌数量不多于2，则抓2张牌。
 * 可用次数：2
 */
export const WeepingWillowOfTheLake = card(321016)
  .since("v4.3.0")
  .costSame(1)
  .support("place")
  .on("endPhase", (c) => c.player.hands.length <= 2)
  .usage(2)
  .drawCards(2)
  .done();

/**
 * @id 321017
 * @name 欧庇克莱歌剧院
 * @description
 * 我方选择行动前：如果我方角色所装备卡牌的原本元素骰费用总和不比对方更低，则生成1个出战角色类型的元素骰。（每回合1次）
 * 可用次数：3
 */
export const OperaEpiclese = card(321017)
  .since("v4.3.0")
  .costSame(1)
  .support("place")
  .on("beforeAction", (c) => {
    function costOfEquipment(equipment: EntityState) {
      const cardDef = c.state.data.cards.get(equipment.definition.id)!;
      return diceCostOfCard(cardDef);
    }
    const myCost = c.$$(`my equipments`).map((entity) => costOfEquipment(entity.state)).reduce((a, b) => a + b, 0);
    const oppCost = c.$$(`opp equipments`).map((entity) => costOfEquipment(entity.state)).reduce((a, b) => a + b, 0);
    return myCost >= oppCost;
  })
  .usage(3)
  .usagePerRound(1)
  .do((c) => {
    c.generateDice(c.$("my active")!.element(), 1);
  })
  .done();

/**
 * @id 301018
 * @name 严格禁令
 * @description
 * 本回合中，所在阵营打出的事件牌无效。
 * 可用次数：1
 */
export const StrictProhibited = combatStatus(301018)
  .tags("eventEffectless")
  .oneDuration()
  .on("playCard", (c, e) => e.card.definition.cardType === "event")
  .usage(1)
  .done();

/**
 * @id 321018
 * @name 梅洛彼得堡
 * @description
 * 我方出战角色受到伤害或治疗后：此牌累积1点「禁令」。（最多累积到4点）
 * 行动阶段开始时：如果此牌已有4点「禁令」，则消耗4点，在对方场上生成严格禁令。（本回合中打出的1张事件牌无效）
 */
export const FortressOfMeropide = card(321018)
  .since("v4.5.0")
  .costSame(1)
  .support("place")
  .variable("forbidden", 0)
  .on("damagedOrHealed", (c, e) => c.of(e.target).isActive())
  .addVariableWithMax("forbidden", 1, 4)
  .on("actionPhase", (c) => c.getVariable("forbidden") >= 4)
  .combatStatus(StrictProhibited, "opp")
  .addVariable("forbidden", -4)
  .done();

/**
 * @id 301019
 * @name 悠远雷暴
 * @description
 * 结束阶段：对所附属角色造成2点穿透伤害。
 * 可用次数：1
 */
export const DistantStorm = status(301019)
  .on("endPhase")
  .usage(1)
  .damage(DamageType.Piercing, 2, "@master")
  .done();

/**
 * @id 321019
 * @name 清籁岛
 * @description
 * 任意阵营的角色受到治疗后：使该角色附属悠远雷暴。（结束阶段受到2点穿透伤害，可用1次）
 * 持续回合：2
 */
export const SeiraiIsland = card(321019)
  .since("v4.6.0")
  .costSame(1)
  .support("place")
  .duration(2)
  .on("healed")
  .listenToAll()
  .do((c, e) => {
    c.characterStatus(DistantStorm, e.target);
  })
  .done();

/**
 * @id 301022
 * @name 赤王陵（生效中）
 * @description
 * 直到本回合结束前，所在阵营每抓1张牌，就立刻生成1张禁忌知识，随机地置入牌库中。
 */
export const TheMausoleumOfKingDeshretInEffect = combatStatus(301022)
  .oneDuration()
  .on("enter")
  .createPileCards(ForbiddenKnowledge, 2, "top")
  .on("drawCard")
  .createPileCards(ForbiddenKnowledge, 1, "random")
  .done();

/**
 * @id 321020
 * @name 赤王陵
 * @description
 * 对方累积抓4张牌后：弃置此牌，在对方牌库顶生成2张禁忌知识。然后直到本回合结束前，对方每抓1张牌，就立刻生成1张禁忌知识，随机地置入对方牌库中。
 */
export const TheMausoleumOfKingDeshret = card(321020)
  .since("v4.7.0")
  .costSame(1)
  .support("place")
  .variable("drawnCardCount", 0)
  .on("drawCard", (c, e) => e.who !== c.self.who)
  .listenToAll()
  .do((c) => {
    c.addVariable("drawnCardCount", 1);
    if (c.getVariable("drawnCardCount") === 4) {
      c.combatStatus(TheMausoleumOfKingDeshretInEffect, "opp");
      c.dispose();
    }
  })
  .done();

/**
 * @id 321021
 * @name 中央实验室遗址
 * @description
 * 我方舍弃或调和1张牌后：此牌累积1点「实验进展」。每当「实验进展」达到3点、6点、9点时，就获得1个万能元素。然后，如果「实验进展」至少为9点，则弃置此牌。
 */
export const CentralLaboratoryRuins = card(321021)
  .since("v4.7.0")
  .costSame(1)
  .support("place")
  .variable("progress", 0)
  .on("disposeOrTuneCard")
  .do((c) => {
    c.addVariable("progress", 1);
    const progress = c.getVariable("progress");
    if (progress % 3 === 0) {
      c.generateDice(DiceType.Omni, 1);
    }
    if (progress >= 9) {
      c.dispose();
    }
  })
  .done();

/**
 * @id 301023
 * @name 圣火竞技场（生效中）
 * @description
 * 角色造成的伤害+1。
 * 持续回合：2
 */
export const StadiumOfTheSacredFlameInEffect = combatStatus(301023)
  .duration(2)
  .on("increaseSkillDamage")
  .increaseDamage(1)
  .done();

/**
 * @id 321022
 * @name 圣火竞技场
 * @description
 * 我方使用技能或特技后：此牌累积1点「角逐之焰」。
 * 「角逐之焰」达到2时：生成1个随机基础元素骰。
 * 达到4时：治疗我方出战角色2点。
 * 达到6时：弃置此牌，使当前的我方出战角色在2回合内造成的伤害+1。
 */
export const StadiumOfTheSacredFlame = card(321022)
  .since("v5.0.0")
  .costSame(2)
  .support("place")
  .variable("flame", 0)
  .on("useSkillOrTechnique")
  .addVariable("flame", 1)
  .do((c) => {
    const flame = c.getVariable("flame");
    switch (flame) {
      case 2: {
        c.generateDice("randomElement", 1);
        break;
      }
      case 4: {
        c.heal(2, "my active");
        break;
      }
      case 6: {
        c.combatStatus(StadiumOfTheSacredFlameInEffect);
        c.dispose();
        break;
      }
    }
  })
  .done();

/**
 * @id 133087
 * @name 中央实验室旧址
 * @description
 * 我方舍弃或调和1张牌后：此牌累积1点「实验进展」。每当「实验进展」达到3点、6点、9点时，就获得1个万能元素。然后，如果「实验进展」至少为9点，则弃置此牌。
 */
export const FormerSiteOfTheCentralLaboratory = card(133087) // 骗骗花
  .reserve();

/**
 * @id 133088
 * @name 西风教堂
 * @description
 * 结束阶段：治疗我方「出战角色」2点。
 * 可用次数：2
 */
export const FakeFavoniusCathedral = card(133088) // 骗骗花
  .reserve();

/**
 * @id 321023
 * @name 特佩利舞台
 * @description
 * 我方打出名称不存在于本局最初牌组的牌时：此牌累积1点「瞩目」。
 * 敌方打出名称不存在于本局最初牌组的牌时：此牌扣除1点「瞩目」。
 * 行动阶段开始时：如果此牌有至少3点「瞩目」，则生成1个随机基础元素骰；如果此牌有至少1点「瞩目」，将1个元素骰转换为万能元素。
 */
export const StageTepetl = card(321023)
  .since("v5.1.0")
  .support("place")
  .variable("attention", 0)
  .on("playCard")
  .listenToAll()
  .do((c, e) => {
    const isMine = e.who === c.self.who;
    const player = isMine ? c.player : c.oppPlayer;
    const delta = isMine ? 1 : -1;
    if (!player.initialPile.some((card) => card.id === e.card.definition.id)) {
      c.addVariable("attention", delta);
    }
  })
  .on("actionPhase")
  .do((c) => {
    const attention = c.getVariable("attention");
    if (attention >= 3) {
      c.generateDice("randomElement", 1);
    } else if (attention >= 1) {
      c.convertDice(DiceType.Omni, 1);
    }
  })
  .done();

/**
 * @id 321024
 * @name 「悬木人」
 * @description
 * 我方打出名称不存在于本局最初牌组的牌时：如果打出的牌原本元素骰费用不低于此牌的「极限运动点」，则生成1个随机基础元素骰，然后此牌累积1个「极限运动点」。
 */
export const ScionsOfTheCanopy = card(321024)
  .since("v5.2.0")
  .support("place")
  .variable("point", 0)
  .on("playCard", (c, e) => !c.isInInitialPile(e.card) && diceCostOfCard(e.card.definition) >= c.getVariable("point"))
  .generateDice("randomElement", 1)
  .addVariable("point", 1)
  .done();

/**
 * @id 321025
 * @name 「流泉之众」
 * @description
 * 我方「召唤物」入场时：使其可用次数+1。
 * 可用次数：3
 */
export const PeopleOfTheSprings = card(321025)
  .since("v5.3.0")
  .costSame(2)
  .support("place")
  .on("enterRelative", (c, e) => e.entity.definition.type === "summon")
  .usage(3)
  .do((c, e) => {
    const target = c.$(`my summons with id ${e.entity.id}`);
    target?.addVariable("usage", 1);
  })
  .done();

/**
 * @id 301024
 * @name 「花羽会」（生效中）
 * @description
 * 下次切换至前台时，回复1个对应元素的骰子。（可叠加，每次触发一层）
 */
export const FlowerfeatherClanInEffect = status(301024)
  .on("switchActive", (c, e) => c.self.master().id === e.switchInfo.to.id)
  .usageCanAppend(1, Infinity)
  .do((c) => {
    const element = c.self.master().element();
    c.generateDice(element, 1);
  })
  .done();

/**
 * @id 321026
 * @name 「花羽会」
 * @description
 * 我方舍弃2张卡牌后：我方下一个后台角色获得1层“下次切换至前台时，回复1个对应元素的骰子”。（可叠加，每次触发1层）
 */
export const FlowerfeatherClan = card(321026)
  .since("v5.4.0")
  .support("place")
  .variable("disposedCardCount", 0)
  .on("disposeCard")
  .addVariable("disposedCardCount", 1)
  .on("disposeCard", (c) => c.getVariable("disposedCardCount") >= 2)
  .setVariable("disposedCardCount", 0)
  .characterStatus(FlowerfeatherClanInEffect, "my next")
  .done();

/**
 * @id 321027
 * @name 「烟谜主」
 * @description
 * 此牌初始具有4点灵觉。
 * 我方挑选后：灵觉-1。
 * 行动阶段开始时：若灵觉为0，则移除自身，然后从3个随机元素骰费用为2的支援牌中挑选一个生成。
 */
export const MastersOfTheNightwind = card(321027)
  .since("v5.5.0")
  .support("place")
  .variable("intuition", 4)
  .on("selectCard")
  .do((c) => {
    const newValue = Math.max(0, c.getVariable("intuition") - 1);
    c.setVariable("intuition", newValue);
  })
  .on("actionPhase", (c) => c.getVariable("intuition") === 0)
  .do((c) => {
    const cards = c.allCardDefinitions("support").filter((card) => diceCostOfCard(card) === 2);
    const candidates = c.randomSubset(cards, 3);
    c.selectAndPlay(candidates);
    c.dispose();
  })
  .done();
