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

import { CardHandle, CharacterState, DamageType, DiceType, Reaction, SkillHandle, SupportHandle, card, combatStatus, extension, flip, pair, status, summon } from "@gi-tcg/core/builder";
import { BurningFlame, CatalyzingField, DendroCore } from "../../commons";

/**
 * @id 303211
 * @name 冰箭丘丘人
 * @description
 * 结束阶段：造成1点冰元素伤害。
 * 可用次数：2
 */
export const CryoHilichurlShooter = summon(303211)
  .endPhaseDamage(DamageType.Cryo, 1)
  .usage(2)
  .done();

/**
 * @id 303212
 * @name 水丘丘萨满
 * @description
 * 结束阶段：造成1点水元素伤害。
 * 可用次数：2
 */
export const HydroSamachurl = summon(303212)
  .endPhaseDamage(DamageType.Hydro, 1)
  .usage(2)
  .done();


/**
 * @id 303213
 * @name 冲锋丘丘人
 * @description
 * 结束阶段：造成1点火元素伤害。
 * 可用次数：2
 */
export const HilichurlBerserker = summon(303213)
  .endPhaseDamage(DamageType.Pyro, 1)
  .usage(2)
  .done();

/**
 * @id 303214
 * @name 雷箭丘丘人
 * @description
 * 结束阶段：造成1点雷元素伤害。
 * 可用次数：2
 */
export const ElectroHilichurlShooter = summon(303214)
  .endPhaseDamage(DamageType.Electro, 1)
  .usage(2)
  .done();

/**
 * @id 303216
 * @name 愚人众伏兵·冰萤术士
 * @description
 * 所在阵营的角色使用技能后：对所在阵营的出战角色造成1点冰元素伤害。（每回合1次）
 * 可用次数：2
 */
export const FatuiAmbusherCryoCicinMage = combatStatus(303216)
  .on("useSkill")
  .usage(2)
  .damage(DamageType.Cryo, 1, "my active")
  .done();

/**
 * @id 303217
 * @name 愚人众伏兵·藏镜仕女
 * @description
 * 所在阵营的角色使用技能后：对所在阵营的出战角色造成1点水元素伤害。（每回合1次）
 * 可用次数：2
 */
export const FatuiAmbusherMirrorMaiden = combatStatus(303217)
  .on("useSkill")
  .usage(2)
  .damage(DamageType.Hydro, 1, "my active")
  .done();

/**
 * @id 303218
 * @name 愚人众伏兵·火铳游击兵
 * @description
 * 所在阵营的角色使用技能后：对所在阵营的出战角色造成1点火元素伤害。（每回合1次）
 * 可用次数：2
 */
export const FatuiAmbusherPyroslingerBracer = combatStatus(303218)
  .on("useSkill")
  .usage(2)
  .damage(DamageType.Pyro, 1, "my active")
  .done();

/**
 * @id 303219
 * @name 愚人众伏兵·雷锤前锋军
 * @description
 * 所在阵营的角色使用技能后：对所在阵营的出战角色造成1点雷元素伤害。（每回合1次）
 * 可用次数：2
 */
export const FatuiAmbusherElectrohammerVanguard = combatStatus(303219)
  .on("useSkill")
  .usage(2)
  .damage(DamageType.Electro, 1, "my active")
  .done();

/**
 * @id 331102
 * @name 元素共鸣：粉碎之冰
 * @description
 * 本回合中，我方当前出战角色下一次造成的伤害+2。
 * （牌组包含至少2个冰元素角色，才能加入牌组）
 */
export const [ElementalResonanceShatteringIce] = card(331102)
  .since("v3.3.0")
  .costCryo(1)
  .tags("resonance")
  .toStatus(303112, "my active")
  .oneDuration()
  .once("increaseSkillDamage")
  .increaseDamage(2)
  .done();

/**
 * @id 331202
 * @name 元素共鸣：愈疗之水
 * @description
 * 治疗我方出战角色2点。然后，治疗所有我方后台角色1点。
 * （牌组包含至少2个水元素角色，才能加入牌组）
 */
export const ElementalResonanceSoothingWater = card(331202)
  .since("v3.3.0")
  .costHydro(1)
  .tags("resonance")
  .filter((c) => c.$(`my characters with health < maxHealth`))
  .heal(2, "my active")
  .heal(1, "my standby")
  .done();

/**
 * @id 331302
 * @name 元素共鸣：热诚之火
 * @description
 * 本回合中，我方当前出战角色下一次引发火元素相关反应时，造成的伤害+3。
 * （牌组包含至少2个火元素角色，才能加入牌组）
 */
export const [ElementalResonanceFerventFlames] = card(331302)
  .since("v3.3.0")
  .costPyro(1)
  .tags("resonance")
  .toStatus(303132, "my active")
  .oneDuration()
  .once("increaseSkillDamage", (c, e) => e.isReactionRelatedTo(DamageType.Pyro))
  .increaseDamage(3)
  .done();

/**
 * @id 331402
 * @name 元素共鸣：强能之雷
 * @description
 * 我方出战角色和下一名充能未满的角色获得1点充能。
 * （牌组包含至少2个雷元素角色，才能加入牌组）
 */
export const ElementalResonanceHighVoltage = card(331402)
  .since("v3.3.0")
  .costElectro(1)
  .tags("resonance")
  .filter((c) => c.$(`my characters with energy < maxEnergy`))
  .gainEnergy(1, "my active")
  .gainEnergy(1, "my standby character with energy < maxEnergy limit 1")
  .done();

/**
 * @id 303133
 * @name 元素共鸣：迅捷之风（生效中）
 * @description
 * 我方下次执行「切换角色」行动时：少花费1个元素骰。
 */
export const ElementalResonanceImpetuousWindsInEffect01 = combatStatus(303133)
  .once("deductOmniDiceSwitch")
  .deductOmniCost(1)
  .done();

/**
 * @id 303136
 * @name 元素共鸣：迅捷之风（生效中）
 * @description
 * 我方下次执行「切换角色」行动时：将此次切换视为「快速行动」而非「战斗行动」。
 */
export const ElementalResonanceImpetuousWindsInEffect03 = combatStatus(303136)
  .once("beforeFastSwitch")
  .setFastAction()
  .done();

/**
 * @id 303134
 * @name 元素共鸣：迅捷之风（生效中）
 * @description
 * 我方下次触发扩散反应时对目标以外的所有敌方角色造成的伤害+1。
 */
export const ElementalResonanceImpetuousWindsInEffect02 = combatStatus(303134)
  .on("increaseDamage", (c, e) => (
    ([
      Reaction.SwirlCryo, 
      Reaction.SwirlElectro, 
      Reaction.SwirlHydro, 
      Reaction.SwirlPyro
    ] as (Reaction | null)[]).includes(e.damageInfo.fromReaction)) &&
    !c.of(e.target).isMine())
  .increaseDamage(1)
  .on("reaction", (c, e) =>
    e.reactionInfo.fromDamage && 
    c.of(e.reactionInfo.fromDamage.source).who === c.self.who &&
    e.relatedTo(DamageType.Anemo))
  .listenToAll()
  .dispose()
  .done();

/**
 * @id 331502
 * @name 元素共鸣：迅捷之风
 * @description
 * 我方下次执行「切换角色」行动时：将此次切换视为「快速行动」而非「战斗行动」，并且少花费1个元素骰。
 * 我方下次触发扩散反应时对目标以外的所有敌方角色造成的伤害+1。
 * （牌组包含至少2个风元素角色，才能加入牌组）
 */
export const ElementalResonanceImpetuousWinds = card(331502)
  .since("v3.3.0")
  .costAnemo(1)
  .tags("resonance")
  .combatStatus(ElementalResonanceImpetuousWindsInEffect01)
  .combatStatus(ElementalResonanceImpetuousWindsInEffect02)
  .combatStatus(ElementalResonanceImpetuousWindsInEffect03)
  .done();

/**
 * @id 303162
 * @name 护盾
 * @description
 * 为我方出战角色提供3点护盾。
 */
export const Shield = combatStatus(303162)
  .shield(3)
  .done();

/**
 * @id 331602
 * @name 元素共鸣：坚定之岩
 * @description
 * 为我方出战角色提供3点护盾。
 */
export const ElementalResonanceEnduringRock = card(331602)
  .since("v3.3.0")
  .costGeo(1)
  .tags("resonance")
  .combatStatus(Shield)
  .done();

/**
 * @id 331702
 * @name 元素共鸣：蔓生之草
 * @description
 * 若我方场上存在燃烧烈焰/草原核/激化领域，则对对方出战角色造成1点火元素伤害/水元素伤害/雷元素伤害。
 * （牌组包含至少2个草元素角色，才能加入牌组）
 */
export const ElementalResonanceSprawlingGreenery = card(331702)
  .since("v3.3.0")
  .costDendro(1)
  .tags("resonance")
  .filter((c) => c.$(`
    my combat status with definition id ${DendroCore} or 
    my combat status with definition id ${CatalyzingField} or
    my summon with definition id ${BurningFlame}`))
  .do((c) => {
    if (c.$(`my combat status with definition id ${DendroCore}`)) {
      c.damage(DamageType.Hydro, 1, "opp active");
    }
    if (c.$(`my combat status with definition id ${CatalyzingField}`)) {
      c.damage(DamageType.Electro, 1, "opp active");
    }
    if (c.$(`my summon with definition id ${BurningFlame}`)) {
      c.damage(DamageType.Pyro, 1, "opp active");
    }
  })
  .done();

/**
 * @id 331101
 * @name 元素共鸣：交织之冰
 * @description
 * 生成1个冰元素骰。
 * （牌组包含至少2个冰元素角色，才能加入牌组）
 */
export const ElementalResonanceWovenIce = card(331101)
  .since("v3.3.0")
  .tags("resonance")
  .generateDice(DiceType.Cryo, 1)
  .done();

/**
 * @id 331201
 * @name 元素共鸣：交织之水
 * @description
 * 生成1个水元素骰。
 * （牌组包含至少2个水元素角色，才能加入牌组）
 */
export const ElementalResonanceWovenWaters = card(331201)
  .since("v3.3.0")
  .tags("resonance")
  .generateDice(DiceType.Hydro, 1)
  .done();

/**
 * @id 331301
 * @name 元素共鸣：交织之火
 * @description
 * 生成1个火元素骰。
 * （牌组包含至少2个火元素角色，才能加入牌组）
 */
export const ElementalResonanceWovenFlames = card(331301)
  .since("v3.3.0")
  .tags("resonance")
  .generateDice(DiceType.Pyro, 1)
  .done();

/**
 * @id 331401
 * @name 元素共鸣：交织之雷
 * @description
 * 生成1个雷元素骰。
 * （牌组包含至少2个雷元素角色，才能加入牌组）
 */
export const ElementalResonanceWovenThunder = card(331401)
  .since("v3.3.0")
  .tags("resonance")
  .generateDice(DiceType.Electro, 1)
  .done();

/**
 * @id 331501
 * @name 元素共鸣：交织之风
 * @description
 * 生成1个风元素骰。
 * （牌组包含至少2个风元素角色，才能加入牌组）
 */
export const ElementalResonanceWovenWinds = card(331501)
  .since("v3.3.0")
  .tags("resonance")
  .generateDice(DiceType.Anemo, 1)
  .done();

/**
 * @id 331601
 * @name 元素共鸣：交织之岩
 * @description
 * 生成1个岩元素骰。
 * （牌组包含至少2个岩元素角色，才能加入牌组）
 */
export const ElementalResonanceWovenStone = card(331601)
  .since("v3.3.0")
  .tags("resonance")
  .generateDice(DiceType.Geo, 1)
  .done();

/**
 * @id 331701
 * @name 元素共鸣：交织之草
 * @description
 * 生成1个草元素骰。
 * （牌组包含至少2个草元素角色，才能加入牌组）
 */
export const ElementalResonanceWovenWeeds = card(331701)
  .since("v3.3.0")
  .tags("resonance")
  .generateDice(DiceType.Dendro, 1)
  .done();

/**
 * @id 331801
 * @name 风与自由
 * @description
 * 本回合中，我方角色使用技能后：将下一个我方后台角色切换到场上。
 * （牌组包含至少2个「蒙德」角色，才能加入牌组）
 */
export const [WindAndFreedom, WindAndFreedomInEffect] = card(331801)
  .since("v3.7.0")
  .filter((c) => c.$(`my standby characters`))
  .toCombatStatus(303181)
  .oneDuration()
  .on("useSkill")
  .switchActive("my next")
  .done();

/**
 * @id 331802
 * @name 岩与契约
 * @description
 * 下回合行动阶段开始时：生成3点万能元素，抓1张牌。
 * （牌组包含至少2个「璃月」角色，才能加入牌组）
 */
export const [StoneAndContracts] = card(331802)
  .since("v3.7.0")
  .costVoid(3)
  .toCombatStatus(303182)
  .once("actionPhase")
  .generateDice(DiceType.Omni, 3)
  .drawCards(1)
  .done();

/**
 * @id 331803
 * @name 雷与永恒
 * @description
 * 将我方所有元素骰转换为万能元素。
 * （牌组包含至少2个「稻妻」角色，才能加入牌组）
 */
export const ThunderAndEternity = card(331803)
  .since("v3.7.0")
  .convertDice(DiceType.Omni, "all")
  .done();

/**
 * @id 331804
 * @name 草与智慧
 * @description
 * 抓1张牌。然后，选择任意手牌替换。
 * （牌组包含至少2个「须弥」角色，才能加入牌组）
 */
export const NatureAndWisdom = card(331804)
  .since("v3.7.0")
  .costSame(1)
  .drawCards(1)
  .switchCards()
  .done();

/**
 * @id 331805
 * @name 水与正义
 * @description
 * 平均分配我方未被击倒的角色的生命值，然后治疗所有我方角色1点。
 * （牌组包含至少2个「枫丹」角色，才能加入牌组）
 */
export const WaterAndJustice = card(331805)
  .since("v4.7.0")
  .costVoid(2)
  .filter((c) => c.$(`my characters with health < maxHealth`))
  .do((c) => {
    const chs = c.$$("all my characters");
    const chCount = chs.length;
    const totalHealth = chs.reduce((acc, ch) => acc + ch.health, 0);
    const avgHealth = Math.floor(totalHealth / chCount);
    const remainder = totalHealth % chCount;
    for (let i = 0; i < chCount; i++) {
      const currentHealth = chs[i].health;
      const expectHealth = avgHealth + (i < remainder ? 1 : 0);
      if (currentHealth > expectHealth) {
        c.damage(DamageType.Piercing, currentHealth - expectHealth, chs[i].state);
      } else if (currentHealth < expectHealth) {
        c.heal(expectHealth - currentHealth, chs[i].state, { kind: "distribution" });
      }
    }
    c.heal(1, "all my characters");
  })
  .done();

/**
 * @id 332001
 * @name 最好的伙伴！
 * @description
 * 生成2个万能元素。
 */
export const TheBestestTravelCompanion = card(332001)
  .since("v3.3.0")
  .costVoid(2)
  .generateDice(DiceType.Omni, 2)
  .done();

/**
 * @id 332002
 * @name 换班时间
 * @description
 * 我方下次执行「切换角色」行动时：少花费1个元素骰。
 */
export const [ChangingShifts] = card(332002)
  .since("v3.3.0")
  .filter((c) => c.$(`my standby characters`))
  .toCombatStatus(303202)
  .once("deductOmniDiceSwitch")
  .deductOmniCost(1)
  .done();

/**
 * @id 332003
 * @name 一掷乾坤
 * @description
 * 选择任意元素骰重投，可重投2次。
 */
export const TossUp = card(332003)
  .since("v3.3.0")
  .rerollDice(2)
  .done();

/**
 * @id 332004
 * @name 运筹帷幄
 * @description
 * 抓2张牌。
 */
export const Strategize = card(332004)
  .since("v3.3.0")
  .costSame(1)
  .drawCards(2)
  .done();

/**
 * @id 303205
 * @name 本大爷还没有输！（冷却中）
 * @description
 * 本回合无法再打出「本大爷还没有输！」。
 */
export const IHaventLostYetCooldown = combatStatus(303205)
  .oneDuration()
  .done()

/**
 * @id 332005
 * @name 本大爷还没有输！
 * @description
 * 本回合有我方角色被击倒，才能打出：生成1个万能元素，我方当前出战角色获得1点充能。（每回合中，最多只能打出1张「本大爷还没有输！」。）
 */
export const IHaventLostYet = card(332005)
  .since("v3.3.0")
  .filter((c) => c.player.hasDefeated && !c.$(`my combat status with definition id ${IHaventLostYetCooldown}`))
  .generateDice(DiceType.Omni, 1)
  .gainEnergy(1, "my active")
  .combatStatus(IHaventLostYetCooldown)
  .done();

/**
 * @id 332006
 * @name 交给我吧！
 * @description
 * 我方下次执行「切换角色」行动时：将此次切换视为「快速行动」而非「战斗行动」。
 */
export const [LeaveItToMe] = card(332006)
  .since("v3.3.0")
  .filter((c) => c.$(`my standby characters`))
  .toCombatStatus(303206)
  .once("beforeFastSwitch")
  .setFastAction()
  .done();

/**
 * @id 332007
 * @name 鹤归之时
 * @description
 * 我方下一次使用技能后：将下一个我方后台角色切换到场上。
 */
export const [WhenTheCraneReturned] = card(332007)
  .since("v3.3.0")
  .filter((c) => c.$(`my standby characters`))
  .costSame(1)
  .toCombatStatus(303207)
  .once("useSkill")
  .switchActive("my next")
  .done();

/**
 * @id 332008
 * @name 星天之兆
 * @description
 * 我方当前出战角色获得1点充能。
 */
export const Starsigns = card(332008)
  .since("v3.3.0")
  .costVoid(2)
  .filter((c) => c.$(`my active with energy < maxEnergy`))
  .do((c) => c.$("my active character")!.gainEnergy(1))
  .done();

/**
 * @id 332009
 * @name 白垩之术
 * @description
 * 从最多2个我方后台角色身上，转移1点充能到我方出战角色。
 */
export const CalxsArts = card(332009)
  .since("v3.3.0")
  .costSame(1)
  .filter((c) => c.$(`my standby with energy > 0`) && c.$(`my active with energy < maxEnergy`))
  .do((c) => {
    const chs = c.$$("my standby characters limit 2");
    let count = 0;
    for (const ch of chs) {
      count += ch.loseEnergy();
    }
    c.$("my active character")!.gainEnergy(count);
  })
  .done();

/**
 * @id 332010
 * @name 诸武精通
 * @description
 * 将一个装备在我方角色的「武器」装备牌，转移给另一个武器类型相同的我方角色，并重置其效果的「每回合」次数限制。
 */
export const MasterOfWeaponry = card(332010)
  .since("v3.3.0")
  .addTarget("my character has equipment with tag (weapon)")
  .addTarget("my character with tag weapon of (@targets.0) and not @targets.0")
  .do((c, e) => {
    const weapon = c.of(c.of(e.targets[0]).hasWeapon()!);
    weapon.resetUsagePerRound();
    const target = c.of(e.targets[1]);
    const area = {
      type: "characters" as const,
      who: target.who,
      characterId: target.id,
    };
    const targetOldWeapon = target.hasWeapon();
    if (targetOldWeapon) {
      c.dispose(targetOldWeapon);
    }
    c.transferEntity(weapon.state, area);
  })
  .done();

/**
 * @id 332011
 * @name 神宝迁宫祝词
 * @description
 * 将一个装备在我方角色的「圣遗物」装备牌，转移给另一个我方角色，并重置其效果的「每回合」次数限制。
 */
export const BlessingOfTheDivineRelicsInstallation = card(332011)
  .since("v3.3.0")
  .addTarget("my character has equipment with tag (artifact)")
  .addTarget("my character and not @targets.0")
  .do((c, e) => {
    const artifact = c.of(c.of(e.targets[0]).hasArtifact()!);
    artifact.resetUsagePerRound();
    const target = c.of(e.targets[1]);
    const area = {
      type: "characters" as const,
      who: target.who,
      characterId: target.id,
    };
    const targetOldArtifact = target.hasArtifact();
    if (targetOldArtifact) {
      c.dispose(targetOldArtifact);
    }
    c.transferEntity(artifact.state, area);
  })
  .done();

/**
 * @id 332012
 * @name 快快缝补术
 * @description
 * 选择一个我方「召唤物」，使其「可用次数」+1。
 */
export const QuickKnit = card(332012)
  .since("v3.3.0")
  .costSame(1)
  .addTarget("my summons")
  .do((c, e) => {
    c.of(e.targets[0]).addVariable("usage", 1);
  })
  .done();

/**
 * @id 332013
 * @name 送你一程
 * @description
 * 选择一个敌方「召唤物」，使其「可用次数」-2。
 */
export const SendOff = card(332013)
  .since("v3.3.0")
  .costSame(2)
  .addTarget("opp summon")
  .do((c, e) => {
    c.of(e.targets[0]).consumeUsage(2);
  })
  .done();

/**
 * @id 332014
 * @name 护法之誓
 * @description
 * 消灭所有「召唤物」。（不分敌我！）
 */
export const GuardiansOath = card(332014)
  .since("v3.3.0")
  .costSame(4)
  .dispose("all summons")
  .done();

/**
 * @id 332015
 * @name 深渊的呼唤
 * @description
 * 召唤一个随机「丘丘人」召唤物！
 * （牌组包含至少2个「魔物」角色，才能加入牌组）
 */
export const AbyssalSummons = card(332015)
  .since("v3.3.0")
  .costSame(2)
  .do((c) => {
    c.summon(
      c.random([
        CryoHilichurlShooter, 
        HydroSamachurl, 
        HilichurlBerserker, 
        ElectroHilichurlShooter
      ])
    );
  })
  .done();

/**
 * @id 332016
 * @name 愚人众的阴谋
 * @description
 * 在对方场上，生成1个随机类型的「愚人众伏兵」。
 * （牌组包含至少2个「愚人众」角色，才能加入牌组）
 */
export const FatuiConspiracy = card(332016)
  .since("v3.7.0")
  .costSame(2)
  .do((c) => {
    c.combatStatus(
      c.random([
        FatuiAmbusherCryoCicinMage,
        FatuiAmbusherMirrorMaiden,
        FatuiAmbusherPyroslingerBracer,
        FatuiAmbusherElectrohammerVanguard
      ]),
      "opp"
    );
  })
  .done();

/**
 * @id 332017
 * @name 下落斩
 * @description
 * 战斗行动：切换到目标角色，然后该角色进行「普通攻击」。
 */
export const PlungingStrike = card(332017)
  .since("v3.7.0")
  .costSame(3)
  .tags("action")
  .addTarget("my characters and not has status with tag (disableSkill)")
  .switchActive("@targets.0")
  .useSkill("normal")
  .done();

/**
 * @id 332018
 * @name 重攻击
 * @description
 * 本回合中，当前我方出战角色下次「普通攻击」造成的伤害+1。
 * 此次「普通攻击」为重击时：伤害额外+1。
 */
export const [HeavyStrike] = card(332018)
  .since("v3.7.0")
  .costSame(1)
  .toStatus(303220, "my active")
  .oneDuration()
  .once("increaseSkillDamage", (c, e) => e.viaSkillType("normal"))
  .increaseDamage(1)
  .if((c, e) => e.viaChargedAttack())
  .increaseDamage(1)
  .done();

/**
 * @id 332019
 * @name 温妮莎传奇
 * @description
 * 生成4个不同类型的基础元素骰。
 */
export const TheLegendOfVennessa = card(332019)
  .since("v3.7.0")
  .costSame(3)
  .generateDice("randomElement", 4)
  .done();

/**
 * @id 332020
 * @name 永远的友谊
 * @description
 * 手牌数小于4的牌手抓牌，直到手牌数各为4张。
 */
export const FriendshipEternal = card(332020)
  .since("v3.7.0")
  .costSame(2)
  .do((c) => {
    if (c.player.hands.length < 4) {
      c.drawCards(4 - c.player.hands.length, { who: "my" });
    }
    if (c.oppPlayer.hands.length < 4) {
      c.drawCards(4 - c.oppPlayer.hands.length, { who: "opp" });
    }
  })
  .done();

/**
 * @id 332021
 * @name 大梦的曲调
 * @description
 * 我方下次打出「武器」或「圣遗物」手牌时：少花费1个元素骰。
 */
export const [RhythmOfTheGreatDream] = card(332021)
  .since("v3.8.0")
  .toCombatStatus(302021)
  .once("deductOmniDiceCard", (c, e) => e.hasOneOfCardTag("weapon", "artifact"))
  .deductOmniCost(1)
  .done();

/**
 * @id 332022
 * @name 藏锋何处
 * @description
 * 将一个我方角色所装备的「武器」返回手牌。
 * 本回合中，我方下次打出「武器」手牌时：少花费2个元素骰。
 */
export const [WhereIsTheUnseenRazor] = card(332022)
  .since("v4.0.0")
  .addTarget("my character has equipment with tag (weapon)")
  .do((c, e) => {
    const { definition } = c.of(e.targets[0]).removeWeapon()!;
    c.createHandCard(definition.id as CardHandle);
  })
  .toCombatStatus(303222)
  .oneDuration()
  .once("deductOmniDiceCard", (c, e) => e.hasCardTag("weapon"))
  .deductOmniCost(2)
  .done();

/**
 * @id 332023
 * @name 拳力斗技！
 * @description
 * 我方至少剩余8个元素骰，且对方未宣布结束时，才能打出：本回合中一位牌手先宣布结束时，未宣布结束的牌手抓2张牌。
 */
export const [Pankration] = card(332023)
  .since("v4.1.0")
  .filter((c) => c.player.dice.length >= 8 && !c.oppPlayer.declaredEnd)
  .toCombatStatus(303223)
  .once("declareEnd")
  .listenToAll()
  .do((c) => {
    if (c.player.declaredEnd) {
      c.drawCards(2, { who: "opp" });
    } else {
      c.drawCards(2, { who: "my" });
    }
  })
  .done();

const LyresongIsFirstExtension = extension(332024, { first: pair(false) })
  .description("打出琴音之诗前该方该轮次未打出过其他行动牌")
  .mutateWhen("onRoundEnd", (c) => c.first = pair(false))
  .mutateWhen("onPlayCard", (c, e) => c.first[e.who] = true)
  .done();

/**
 * @id 303232
 * @name 琴音之诗（生效中）
 * @description
 * 本回合中，我方下次打出「圣遗物」手牌时：少花费1个元素骰。
 */
const LyresongInEffect1 = combatStatus(303232)
  .conflictWith(303224)
  .oneDuration()
  .once("deductOmniDiceCard", (c, e) => e.hasCardTag("artifact"))
  .deductOmniCost(1)
  .done();


/**
 * @id 303224
 * @name 琴音之诗（生效中）
 * @description
 * 本回合中，我方下次打出「圣遗物」手牌时：少花费2个元素骰。
 */
const LyresongInEffect2 = combatStatus(303224)
  .conflictWith(303232)
  .oneDuration()
  .once("deductOmniDiceCard", (c, e) => e.hasCardTag("artifact"))
  .deductOmniCost(2)
  .done();

/**
 * @id 332024
 * @name 琴音之诗
 * @description
 * 将一个我方角色所装备的「圣遗物」返回手牌。
 * 本回合中，我方下次打出「圣遗物」手牌时：少花费1个元素骰。如果打出此牌前我方未打出过其他行动牌，则改为少花费2个元素骰。
 */
export const Lyresong = card(332024)
  .since("v4.2.0")
  .associateExtension(LyresongIsFirstExtension)
  .addTarget("my character has equipment with tag (artifact)")
  .do((c, e) => {
    const { definition } = c.of(e.targets[0]).removeArtifact()!;
    c.createHandCard(definition.id as CardHandle);
    if (c.getExtensionState().first[c.self.who]) {
      c.combatStatus(LyresongInEffect2);
    } else {
      c.combatStatus(LyresongInEffect1);
    }
  })
  .done();

/**
 * @id 332025
 * @name 野猪公主
 * @description
 * 本回合中，我方每有1张装备在角色身上的「装备牌」被弃置时：获得1个万能元素。（最多获得2个）
 * （角色被击倒时弃置装备牌，或者覆盖装备「武器」「圣遗物」或「特技」，都可以触发此效果）
 */
export const [TheBoarPrincess] = card(332025)
  .since("v4.3.0")
  .toCombatStatus(303225)
  .usage(2)
  .oneDuration()
  .on("dispose", (c, e) => e.entity.definition.type === "equipment")
  .generateDice(DiceType.Omni, 1)
  .consumeUsage()
  .on("enter", (c, e) => e.overridden && e.entity.definition.type === "equipment")
  .generateDice(DiceType.Omni, 1)
  .consumeUsage()
  .done();

/**
 * @id 332026
 * @name 坍陷与契机
 * @description
 * 我方至少剩余8个元素骰，且对方未宣布结束时，才能打出：本回合中，双方牌手进行「切换角色」行动时需要额外花费1个元素骰。
 */
export const [FallsAndFortune] = card(332026)
  .since("v4.3.0")
  .filter((c) => c.player.dice.length >= 8 && !c.oppPlayer.declaredEnd)
  .toCombatStatus(303226)
  .oneDuration()
  .on("addDice", (c, e) => e.action.type === "switchActive")
  .listenToAll()
  .addCost(DiceType.Void, 1)
  .done();

/**
 * @id 332027
 * @name 浮烁的四叶印
 * @description
 * 目标角色附属四叶印：每个回合的结束阶段，我方都切换到此角色。
 */
export const [FlickeringFourleafSigil] = card(332027)
  .since("v4.3.0")
  .addTarget("my characters")
  .toStatus(303227, "@targets.0")
  .on("endPhase")
  .switchActive("@master")
  .done();

/**
 * @id 332028
 * @name 机关铸成之链
 * @description
 * 目标我方角色每次受到伤害或治疗后：累积1点「备战度」（最多累积2点）。
 * 我方打出原本费用不多于「备战度」的「武器」或「圣遗物」时：移除所有「备战度」，以免费打出该牌。
 */
export const [MachineAssemblyLine] = card(332028)
  .since("v4.4.0")
  .addTarget("my characters")
  .toStatus(303228, "@targets.0")
  .variable("readiness", 0)
  .on("damagedOrHealed")
  .addVariableWithMax("readiness", 1, 2)
  .once("deductOmniDiceCard", (c, e) =>
    e.hasOneOfCardTag("weapon", "artifact") &&
    e.originalDiceCostSize() <= c.getVariable("readiness"))
  .do((c, e) => {
    e.deductOmniCost(e.diceCostSize());
    c.setVariable("readiness", 0);
  })
  .done();

/**
 * @id 332029
 * @name 净觉花
 * @description
 * 选择一张我方支援区的牌，将其弃置。然后，在我方手牌中随机生成2张支援牌。
 * 本回合中，我方下次打出支援牌时：少花费1个元素骰。
 */
export const [SunyataFlower] = card(332029)
  .since("v4.4.0")
  .addTarget("my supports")
  .dispose("@targets.0")
  .do((c) => {
    const candidates = c.allCardDefinitions("support");
    const card0 = c.random(candidates);
    const card1 = c.random(candidates);
    c.createHandCard(card0.id as CardHandle);
    c.createHandCard(card1.id as CardHandle);
  })
  .toCombatStatus(303229)
  .oneDuration()
  .once("deductOmniDiceCard", (c, e) => e.action.skill.caller.definition.cardType === "support")
  .deductOmniCost(1)
  .done();

/**
 * @id 332030
 * @name 可控性去危害化式定向爆破
 * @description
 * 对方支援区和召唤物区的卡牌数量总和至少为4时，才能打出：双方所有召唤物的可用次数-1。
 */
export const ControlledDirectionalBlast = card(332030)
  .since("v4.5.0")
  .costSame(1)
  .filter((c) => c.$$("opp summons or opp supports").length >= 4)
  .do((c) => {
    for (const summon of c.$$("all summons")) {
      summon.consumeUsage();
    }
  })
  .done();

/**
 * @id 302202
 * @name 太郎丸的存款
 * @description
 * 生成1个万能元素。
 */
export const TaroumarusSavings = card(302202)
  .since("v4.6.0")
  .generateDice(DiceType.Omni, 1)
  .done();

/**
 * @id 302203
 * @name 「清洁工作」
 * @description
 * 我方出战角色下次造成的伤害+1。（可叠加，最多叠加到+2）
 */
export const [CalledInForCleanup] = card(302203)
  .since("v4.6.0")
  .toCombatStatus(302204)
  .variableCanAppend("damage", 1, 2)
  .once("increaseSkillDamage")
  .do((c, e) => {
    e.increaseDamage(c.getVariable("damage"));
  })
  .done();

/**
 * @id 303231
 * @name 海底宝藏（冷却中）
 * @description
 * 本回合此角色不会再受到来自「海底宝藏」的治疗。
 */
const UnderseaTreasureOnCD = status(303231)
  .oneDuration()
  .done()

/**
 * @id 303230
 * @name 海底宝藏
 * @description
 * 生成1个随机基础元素骰，治疗我方出战角色1点。（每个角色每回合最多受到1次来自本效果的治疗）
 */
export const UnderseaTreasure = card(303230)
  .since("v4.6.0")
  .generateDice("randomElement", 1)
  .do((c) => {
    if (!c.$(`my active has status with definition id ${UnderseaTreasureOnCD}`)) {
      c.heal(1, "my active")
      c.characterStatus(UnderseaTreasureOnCD, "my active");
    }
  })
  .done();

/**
 * @id 332031
 * @name 海中寻宝
 * @description
 * 生成6张海底宝藏，随机地置入我方牌库中。
 */
export const UnderwaterTreasureHunt = card(332031)
  .since("v4.6.0")
  .costSame(2)
  .createPileCards(UnderseaTreasure, 6, "random")
  .done();

/**
 * @id 124053
 * @name 噬骸能量块
 * @description
 * 本回合无法再打出噬骸能量块。
 */
export const BonecrunchersEnergyBlockCombatStatus = combatStatus(124053)
  .oneDuration()
  .done();

/**
 * @id 124051
 * @name 噬骸能量块
 * @description
 * 随机舍弃1张原本元素骰费用最高的手牌，生成1个我方出战角色类型的元素骰。（每回合最多打出1张）
 */
export const BonecrunchersEnergyBlock = card(124051)
  .since("v4.7.0")
  .filter((c) => !c.$(`my combat status with definition id ${BonecrunchersEnergyBlockCombatStatus}`))
  .do((c) => {
    c.disposeMaxCostHands(1);
    const activeCh = c.$("my active")!;
    c.generateDice(activeCh.element(), 1);
    c.combatStatus(BonecrunchersEnergyBlockCombatStatus)
  })
  .done();

/**
 * @id 301021
 * @name 禁忌知识（冷却中）
 * @description
 * 本回合无法再打出「禁忌知识」。
 */
export const ForbiddenKnowledgeCoolDown = combatStatus(301021)
  .oneDuration()
  .done();

/**
 * @id 301020
 * @name 禁忌知识
 * @description
 * 无法使用此牌进行元素调和，且每回合最多只能打出1张「禁忌知识」。
 * 对我方出战角色造成1点穿透伤害，抓1张牌。
 */
export const ForbiddenKnowledge = card(301020)
  .since("v4.7.0")
  .tags("noTuning")
  .damage(DamageType.Piercing, 1, "my active")
  .drawCards(1)
  .combatStatus(ForbiddenKnowledgeCoolDown)
  .done();

/**
 * @id 332032
 * @name 幻戏倒计时：3
 * @description
 * 将我方所有元素骰转换为万能元素，抓4张牌。
 * 此牌在手牌或牌库中被舍弃后：将1张元素骰费用比此牌少1个的「幻戏倒计时」放置到你的牌库顶。
 */
export const CountdownToTheShow3 = card(332032)
  .since("v4.7.0")
  .costSame(3)
  .convertDice(DiceType.Omni, "all")
  .drawCards(4)
  .onDispose((c) => {
    c.createPileCards(CountdownToTheShow2, 1, "top");
  })
  .done();

/**
 * @id 332033
 * @name 幻戏倒计时：2
 * @description
 * 将我方所有元素骰转换为万能元素，抓4张牌。
 * 此牌在手牌或牌库中被舍弃后：将1张元素骰费用比此牌少1个的「幻戏倒计时」放置到你的牌库顶。
 */
export const CountdownToTheShow2 = card(332033)
  .since("v4.7.0")
  .costSame(2)
  .convertDice(DiceType.Omni, "all")
  .drawCards(4)
  .onDispose((c) => {
    c.createPileCards(CountdownToTheShow1, 1, "top");
  })
  .done();

/**
 * @id 332034
 * @name 幻戏倒计时：1
 * @description
 * 将我方所有元素骰转换为万能元素，抓4张牌。
 * 此牌在手牌或牌库中被舍弃后：将1张元素骰费用为0的「幻戏开始！」放置到你的牌库顶。
 */
export const CountdownToTheShow1 = card(332034)
  .since("v4.7.0")
  .costSame(1)
  .convertDice(DiceType.Omni, "all")
  .drawCards(4)
  .onDispose((c) => {
    c.createPileCards(TheShowBegins, 1, "top");
  })
  .done();

/**
 * @id 332035
 * @name 幻戏开始！
 * @description
 * 将我方所有元素骰转换为万能元素，抓4张牌。
 */
export const TheShowBegins = card(332035)
  .since("v4.7.0")
  .convertDice(DiceType.Omni, "all")
  .drawCards(4)
  .done();

/**
 * @id 302206
 * @name 瑟琳的声援
 * @description
 * 随机将2张美露莘推荐的「料理」加入手牌。
 */
export const SerenesSupport = card(302206)
  .since("v4.8.0")
  .do((c) => {
    const candidates = c.allCardDefinitions("food");
    // 似乎是“有放回抽样”，两张牌可重
    const card0 = c.random(candidates);
    const card1 = c.random(candidates);
    c.createHandCard(card0.id as CardHandle);
    c.createHandCard(card1.id as CardHandle);
  })
  .done();

/**
 * @id 302207
 * @name 洛梅的声援
 * @description
 * 随机将2张美露莘好奇的「圣遗物」加入手牌。
 */
export const LaumesSupport = card(302207)
  .since("v4.8.0")
  .do((c) => {
    const candidates = c.allCardDefinitions("artifact");
    const card0 = c.random(candidates);
    const card1 = c.random(candidates);
    c.createHandCard(card0.id as CardHandle);
    c.createHandCard(card1.id as CardHandle);
  })
  .done();

/**
 * @id 302208
 * @name 柯莎的声援
 * @description
 * 随机将2张美露莘称赞的「武器」加入手牌。
 */
export const CosanzeanasSupport = card(302208)
  .since("v4.8.0")
  .do((c) => {
    const candidates = c.allCardDefinitions("weapon");
    // 似乎是“有放回抽样”，两张牌可重
    const card0 = c.random(candidates);
    const card1 = c.random(candidates);
    c.createHandCard(card0.id as CardHandle);
    c.createHandCard(card1.id as CardHandle);
  })
  .done();

const MELUSINE_EVENT_CARDS = [
  331102, // ElementalResonanceShatteringIce
  331202, // ElementalResonanceSoothingWater
  331302, // ElementalResonanceFerventFlames
  331402, // ElementalResonanceHighVoltage
  331502, // ElementalResonanceImpetuousWinds
  331602, // ElementalResonanceEnduringRock
  331702, // ElementalResonanceSprawlingGreenery
  331801, // WindAndFreedom
  331802, // StoneAndContracts
  331803, // ThunderAndEternity
  331804, // NatureAndWisdom
  331805, // WaterAndJustice
  // 331806, 
  // 331807, 
] as CardHandle[];

/**
 * @id 302209
 * @name 夏诺蒂拉的声援
 * @description
 * 随机将2张美露莘看好的超棒事件牌加入手牌。
 */
export const CanotilasSupport = card(302209)
  .since("v4.8.0")
  .costSame(1)
  .do((c) => {
    const card0 = c.random(MELUSINE_EVENT_CARDS);
    const card1 = c.random(MELUSINE_EVENT_CARDS);
    c.createHandCard(card0);
    c.createHandCard(card1);
  })
  .done();

/**
 * @id 302219
 * @name 希洛娜的心意
 * @description
 * 回合结束时：随机将1张超棒事件牌加入手牌。
 * 可用次数：3
 */
const ThironasGoodWill = combatStatus(302219)
  .on("endPhase") // 文本有误
  .usage(3)
  .do((c) => {
    const card = c.random(MELUSINE_EVENT_CARDS);
    c.createHandCard(card);
  })
  .done();

/**
 * @id 302210
 * @name 希洛娜的声援
 * @description
 * 接下来3个回合结束时，各将1张美露莘看好的超棒事件牌加入手牌。
 */
export const ThironasSupport = card(302210)
  .since("v4.8.0")
  .combatStatus(ThironasGoodWill)
  .done();

/**
 * @id 302211
 * @name 希露艾的声援
 * @description
 * 复制对方牌库顶部的3张牌，加入手牌。
 */
export const SluasisSupport = card(302211)
  .since("v4.8.0")
  .costSame(1)
  .do((c) => {
    for (const card of c.oppPlayer.pile.slice(0, 3)) {
      c.createHandCard(card.definition.id as CardHandle);
    };
  })
  .done();

/**
 * @id 302212
 * @name 薇尔妲的声援
 * @description
 * 随机将2张「秘传」卡牌加入你的手牌，并恢复双方牌手的「秘传」卡牌使用机会。
 */
export const VirdasSupport = card(302212)
  .since("v4.8.0")
  .costVoid(2)
  .do((c) => {
    const candidates = c.allCardDefinitions("legend");
    const card0 = c.random(candidates);
    const card1 = c.random(candidates);
    c.createHandCard(card0.id as CardHandle);
    c.createHandCard(card1.id as CardHandle);
    c.mutate({
      type: "setPlayerFlag",
      who: 0,
      flagName: "legendUsed",
      value: false
    });
    c.mutate({
      type: "setPlayerFlag",
      who: 1,
      flagName: "legendUsed",
      value: false
    });
  })
  .done();

/**
 * @id 302213
 * @name 芙佳的声援
 * @description
 * 随机生成「伙伴」到场上，直到填满双方支援区。
 */
export const PucasSupport = card(302213)
  .since("v4.8.0")
  .do((c) => {
    const allies = c.allCardDefinitions("ally");
    const myCount = c.remainingSupportCount("my");
    for (let i = 0; i < myCount; i++) {
      const ally = c.random(allies);
      c.createEntity("support", ally.id as SupportHandle, {
        type: "supports",
        who: c.self.who
      });
    }
    const oppCount = c.remainingSupportCount("opp");
    for (let i = 0; i < oppCount; i++) {
      const ally = c.random(allies);
      c.createEntity("support", ally.id as SupportHandle, {
        type: "supports",
        who: flip(c.self.who)
      });
    }
  })
  .done();

/**
 * @id 302216
 * @name 托皮娅的心意
 * @description
 * 本回合打出手牌后，随机舍弃1张牌或抓1张牌。
 */
const TopyassGoodwill = combatStatus(302216)
  .oneDuration()
  .on("playCard")
  .abortPreview()
  .do((c) => {
    let doDrawCard: boolean;
    if (c.player.pile.length === 0 && c.player.hands.length === 0) {
      // 啥也做不了
      return;
    } else if (c.player.pile.length === 0) {
      // 只能舍弃
      doDrawCard = false;
    } else if (c.player.hands.length === 0) {
      // 只能抽牌
      doDrawCard = true;
    } else {
      // 随机
      doDrawCard = c.random([true, false]);
    }
    if (doDrawCard) {
      c.drawCards(1);
    } else {
      const target = c.random(c.player.hands);
      c.disposeCard(target);
    }
  })
  .done();

/**
 * @id 302214
 * @name 托皮娅的声援
 * @description
 * 抓2张牌，双方获得以下效果：「本回合打出手牌后，随机舍弃1张牌或抓1张牌。」
 */
export const TopyassSupport = card(302214)
  .since("v4.8.0")
  .drawCards(2)
  .combatStatus(TopyassGoodwill, "my")
  .combatStatus(TopyassGoodwill, "opp")
  .done();

/**
 * @id 302217
 * @name 卢蒂妮的心意
 * @description
 * 我方角色使用技能后：受到2点治疗或2点穿透伤害。
 * 可用次数：2
 */
const LutinesGoodwill = combatStatus(302217)
  .on("useSkill")
  .usage(2)
  .abortPreview()
  .do((c, e) => {
    if (c.random([true, false])) {
      c.heal(2, e.skill.caller as CharacterState);
    } else {
      c.damage(DamageType.Piercing, 2, e.skill.caller as CharacterState);
    }
  })
  .done();

/**
 * @id 302215
 * @name 卢蒂妮的声援
 * @description
 * 抓2张牌，双方获得以下效果：「角色使用技能后，随机受到2点治疗或2点穿透伤害。可用次数：2」
 */
export const LutinesSupport = card(302215)
  .since("v4.8.0")
  .drawCards(2)
  .combatStatus(LutinesGoodwill, "my")
  .combatStatus(LutinesGoodwill, "opp")
  .done();

/**
 * @id 302218
 * @name 美露莘的声援
 * @description
 * 效果随机的超棒贴纸，凝聚了美露莘们的心意。
 */
export const MelusineSupport = card(302218)
  .reserve();

/**
 * @id 332036
 * @name 「看到那小子挣钱…」
 * @description
 * 本回合中，每当对方获得2个元素骰，你就获得1个万能元素。（此效果提供的元素骰除外）
 */
export const [IdRatherLoseMoneyMyself] = card(332036)
  .since("v4.8.0")
  .toCombatStatus(303236)
  .oneDuration()
  .variable("count", 0)
  .on("generateDice", (c, e) => e.who !== c.self.who && e.via.caller.definition.id !== c.self.definition.id)
  .listenToAll()
  .do((c) => {
    c.addVariable("count", 1);
    if (c.getVariable("count") === 2) {
      c.generateDice(DiceType.Omni, 1);
      c.setVariable("count", 0);
    }
  })
  .done();

/**
 * @id 332037
 * @name 噔噔！
 * @description
 * 对我方「出战角色」造成1点物理伤害。本回合的结束阶段时，抓1张牌。
 */
export const [Tada] = card(332037)
  .since("v4.8.0")
  .damage(DamageType.Physical, 1, "my active")
  .toCombatStatus(303237)
  .on("endPhase")
  .usage(1)
  .drawCards(1)
  .done();

/**
 * @id 332039
 * @name 龙伙伴的聚餐
 * @description
 * 选择一个装备在我方角色的「特技」装备牌，使其可用次数+1。
 */
export const SaurianDiningBuddies = card(332039)
  .since("v5.0.0")
  .addTarget("my character has equipment with tag (technique)")
  .do((c, e) => {
    const technique = c.of(e.targets[0]).hasTechnique();
    if (technique) {
      c.addVariable("usage", 1, technique);
    }
  })
  .done();

/**
 * @id 133090
 * @name 海底寻宝
 * @description
 * 生成6张海底宝藏，随机地置入我方牌库中。
 */
export const FakeUnderwaterTreasureHunt = card(133090) // 骗骗花
  .reserve();

/**
 * @id 133091
 * @name 可控性危害化式定向爆破
 * @description
 * 对方支援区和召唤物区的卡牌数量总和至少为4时，才能打出：双方所有召唤物的可用次数-1。
 */
export const FakeControlledDirectionalBlast = card(133091) // 骗骗花
  .reserve();

/**
 * @id 133094
 * @name 温妮莎传说
 * @description
 * 生成4个不同类型的基础元素骰。
 */
export const TheTaleOfVennessa = card(133094) // 骗骗花
  .reserve();

/**
 * @id 332040
 * @name 镀金旅团的茶歇
 * @description
 * 如果我方存在相同元素类型的角色，则从3张「场地」中挑选1张加入手牌；
 * 如果我方存在相同武器类型的角色，则从3张「道具」中挑选1张加入手牌；
 * 如果我方存在相同所属势力的角色，则从3张「料理」中挑选1张加入手牌。
 */
export const EremiteTeatime = card(332040)
  .since("v5.1.0")
  .costSame(2)
  .do((c) => {
    const characters = c.$$("my characters include defeated");
    const elements = characters.map((ch) => ch.element());
    const weapons = characters.map((ch) => ch.weaponTag());
    const nations = characters.flatMap((ch) => ch.nationTags());
    if (new Set(elements).size < characters.length) {
      const cards = c.allCardDefinitions("place");
      const candidates = c.randomSubset(cards, 3);
      c.selectAndCreateHandCard(candidates);
    }
    if (new Set(weapons).size < characters.length) {
      const cards = c.allCardDefinitions("item");
      const candidates = c.randomSubset(cards, 3);
      c.selectAndCreateHandCard(candidates);
    }
    if (new Set(nations).size < characters.length) {
      const cards = c.allCardDefinitions("food");
      const candidates = c.randomSubset(cards, 3);
      c.selectAndCreateHandCard(candidates);
    }
  })
  .done();

/**
 * @id 332041
 * @name 强劲冲浪拍档！
 * @description
 * 双方场上至少存在合计2个「召唤物」时，才能打出：随机触发我方和敌方各1个「召唤物」的「结束阶段」效果。
 */
export const UltimateSurfingBuddy = card(332041)
  .since("v5.2.0")
  .filter((c) => c.$$(`all summons`).length >= 2)
  .do((c) => {
    const mySummons = c.$$(`my summons`);
    if (mySummons.length > 0) {
      const mySummon = c.random(mySummons);
      c.triggerEndPhaseSkill(mySummon.state);
    }
    const oppSummons = c.$$(`opp summons`);
    if (oppSummons.length > 0) {
      const oppSummon = c.random(oppSummons);
      c.triggerEndPhaseSkill(oppSummon.state);
    }
  })
  .done();

/**
 * @id 332042
 * @name 燃素充盈
 * @description
 * 本回合我方下次角色消耗「夜魂值」后：该角色获得1点「夜魂值」。
 */
export const [AbundantPhlogiston] = card(332042)
  .since("v5.3.0")
  .toCombatStatus(303238)
  .oneDuration()
  .once("consumeNightsoul")
  .do((c, e) => {
    c.gainNightsoul(e.character, 1);
  })
  .done();

/**
 * @id 332043
 * @name 小嵴锋龙！发现宝藏！
 * @description
 * 向双方牌组中放入2张燃素充盈，随后双方各抓2张牌。
 */
export const LittleTepetlisaurTreasureHunterAtLarge = card(332043)
  .since("v5.4.0")
  .costSame(1)
  .createPileCards(AbundantPhlogiston, 2, "random", "my")
  .createPileCards(AbundantPhlogiston, 2, "random", "opp")
  .drawCards(2, { who: "my" })
  .drawCards(2, { who: "opp" })
  .done();

/**
 * @id 332044
 * @name 以极限之名
 * @description
 * 交换双方手牌，然后手牌较少的一方抓牌直到手牌数等同于手牌多的一方。
 */
export const InTheNameOfTheExtreme = card(332044)
  .since("v5.5.0")
  .costSame(4)
  .do((c) => {
    c.swapPlayerHandCards();
    const oppHandsCount = c.oppPlayer.hands.length;
    const myHandsCount = c.player.hands.length;
    if (oppHandsCount < myHandsCount) {
      c.drawCards(myHandsCount - oppHandsCount, { who: "opp" });
    } else if (oppHandsCount > myHandsCount) {
      c.drawCards(oppHandsCount - myHandsCount, { who: "my" });
    }
  })
  .done();
