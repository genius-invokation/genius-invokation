import { card, character, DamageType, DiceType, skill } from "@gi-tcg/core/builder";
import { DandelionBreeze, FavoniusBladework, GaleBlade } from "../characters/anemo/jean";
import { DivineMarksmanship, SkywardSonnet, WindsGrandOde } from "../characters/anemo/venti";
import { CelestialShower, FrostflakeArrow, LiutianArchery, TrailOfTheQilin } from "../characters/cryo/ganyu";
import { Breastplate, FavoniusBladeworkMaid, SweepingTime } from "../characters/geo/noelle";
import { DominusLapidis, DominusLapidisStrikingStone, PlanetBefall, RainOfStone } from "../characters/geo/zhongli";
import { KuragesOath, NereidsAscension, TheShapeOfWater } from "../characters/hydro/sangonomiya_kokomi";
import { DetailedDiagnosisThoroughTreatment01, DetailedDiagnosisThoroughTreatment02, DetailedDiagnosisThoroughTreatment03, MedicalInterventionOfPureIntention, ReboundHydrotherapy, SuperSaturatedSyringing, TargetedTreatment } from "../characters/hydro/sigewinne";
import { GuideToAfterlife, SecretSpearOfWangsheng, SpiritSoother } from "../characters/pyro/hu_tao";

/**
 * @id 331402
 * @name 元素共鸣：强能之雷
 * @description
 * 我方一名充能未满的角色获得1点充能。（出战角色优先）
 * （牌组包含至少2个雷元素角色，才能加入牌组）
 */
const ElementalResonanceHighVoltage = card(331402)
  .until("v5.4.0")
  .costElectro(1)
  .tags("resonance")
  .filter((c) => c.$(`my characters with energy < maxEnergy`))
  .gainEnergy(1, "my character with energy < maxEnergy limit 1")
  .done();

/**
 * @id 331502
 * @name 元素共鸣：迅捷之风
 * @description
 * 切换到目标角色，并生成1点万能元素。
 * （牌组包含至少2个风元素角色，才能加入牌组）
 */
const ElementalResonanceImpetuousWinds = card(331502)
  .until("v5.4.0")
  .costAnemo(1)
  .tags("resonance")
  .addTarget("my character")
  .switchActive("@targets.0")
  .generateDice(DiceType.Omni, 1)
  .done();

/**
 * @id 331602
 * @name 元素共鸣：坚定之岩
 * @description
 * 本回合中，我方角色下一次造成岩元素伤害后：如果我方存在提供「护盾」的出战状态，则为一个此类出战状态补充3点「护盾」。
 * （牌组包含至少2个岩元素角色，才能加入牌组）
 */
const [ElementalResonanceEnduringRock] = card(331602)
  .until("v5.4.0")
  .costGeo(1)
  .tags("resonance")
  .toCombatStatus(303162)
  .oneDuration()
  .once("skillDamage", (c, e) => e.type === DamageType.Geo)
  .do((c) => {
    c.$("my combat statuses with tag (shield) limit 1")?.addVariable("shield", 3);
  })
  .done();

/**
 * @id 331702
 * @name 元素共鸣：蔓生之草
 * @description
 * 本回合中，我方下一次引发元素反应时，造成的伤害+2。
 * 使我方场上的燃烧烈焰、草原核和激化领域「可用次数」+1。
 * （牌组包含至少2个草元素角色，才能加入牌组）
 */
const [ElementalResonanceSprawlingGreenery] = card(331702)
  .until("v5.4.0")
  .costDendro(1)
  .tags("resonance")
  .do((c) => {
    c.$("my summon with definition id 115")?.addVariable("usage", 1);
    c.$("my combat statuses with definition id 116")?.addVariable("usage", 1);
    c.$("my combat statuses with definition id 117")?.addVariable("usage", 1);
  })
  .toCombatStatus(303172)
  .since("v3.3.0") // 由于 v5.4.0 删去生效中状态，手动将其标记为“主”版本
  .oneDuration()
  .once("increaseDamage", (c, e) => e.getReaction())
  .increaseDamage(2)
  .done();

// 以下为 10血->12血

const Jean = character(1502)
  .until("v5.4.0")
  .tags("anemo", "sword", "mondstadt")
  .health(10)
  .energy(2)
  .skills(FavoniusBladework, GaleBlade, DandelionBreeze)
  .done();

const Venti = character(1503)
  .until("v5.4.0")
  .tags("anemo", "bow", "mondstadt")
  .health(10)
  .energy(2)
  .skills(DivineMarksmanship, SkywardSonnet, WindsGrandOde)
  .done();

const Ganyu = character(1101)
  .until("v5.4.0")
  .tags("cryo", "bow", "liyue")
  .health(10)
  .energy(3)
  .skills(LiutianArchery, TrailOfTheQilin, FrostflakeArrow, CelestialShower)
  .done();

const Noelle = character(1602)
  .until("v5.4.0")
  .tags("geo", "claymore", "mondstadt")
  .health(10)
  .energy(2)
  .skills(FavoniusBladeworkMaid, Breastplate, SweepingTime)
  .done();

const Zhongli = character(1603)
  .until("v5.4.0")
  .tags("geo", "pole", "liyue")
  .health(10)
  .energy(3)
  .skills(RainOfStone, DominusLapidis, DominusLapidisStrikingStone, PlanetBefall)
  .done();

const SangonomiyaKokomi = character(1205)
  .until("v5.4.0")
  .tags("hydro", "catalyst", "inazuma")
  .health(10)
  .energy(2)
  .skills(TheShapeOfWater, KuragesOath, NereidsAscension)
  .done();

const Sigewinne = character(1213)
  .until("v5.4.0")
  .tags("hydro", "bow", "fontaine", "pneuma")
  .health(10)
  .energy(2)
  .skills(TargetedTreatment, ReboundHydrotherapy, SuperSaturatedSyringing, DetailedDiagnosisThoroughTreatment01, MedicalInterventionOfPureIntention, 
    DetailedDiagnosisThoroughTreatment02, DetailedDiagnosisThoroughTreatment03)
  .done();

const HuTao = character(1307)
  .until("v5.4.0")
  .tags("pyro", "pole", "liyue")
  .health(10)
  .energy(3)
  .skills(SecretSpearOfWangsheng, GuideToAfterlife, SpiritSoother)
  .done();
