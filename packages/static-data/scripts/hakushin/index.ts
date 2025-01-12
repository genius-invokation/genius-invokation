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
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import {
  entities as originalOldEntities,
  characters as originalOldCharacters,
  actionCards as originalOldActionCards,
  type CharacterRawData,
  type ActionCardRawData,
  type PlayCost,
  type SkillRawData,
  type EntityRawData,
} from "../../src";
import { IS_BETA, BETA_VERSION } from "@gi-tcg/config";
import { getDescriptionReplacedHakushin } from "./utils";

// Must run in BETA mode
if (!IS_BETA) {
  throw new Error("This script must run in BETA mode.");
}

const oldCharacters = originalOldCharacters.filter(
  (c) => c.sinceVersion !== BETA_VERSION,
);
const oldActionCards = originalOldActionCards.filter(
  (c) => c.sinceVersion !== BETA_VERSION,
);
const oldEntities = originalOldEntities.filter(
  (c) => c.type !== "GCG_CARD_UNKNOWN",
);

console.log("Fetching data...");

const cardsAndChars = (await fetch(
  `https://api.hakush.in/gi/data/gcg.json`,
).then((r) => r.json())) as Record<string, any>;

const keywords = (await fetch(
  `https://api.hakush.in/gi/data/zh/gcg/keyword.json`,
).then((r) => r.json())) as Record<string, any>;
const entities = (await fetch(
  `https://api.hakush.in/gi/data/zh/gcg/card.json`,
).then((r) => r.json())) as Record<string, any>;
const entitiesEn = (await fetch(
  `https://api.hakush.in/gi/data/en/gcg/card.json`,
).then((r) => r.json())) as Record<string, any>;
const skills = (await fetch(
  `https://api.hakush.in/gi/data/zh/gcg/skill.json`,
).then((r) => r.json())) as Record<string, any>;
const skillsEn = (await fetch(
  `https://api.hakush.in/gi/data/en/gcg/skill.json`,
).then((r) => r.json())) as Record<string, any>;

let maxShareId = [...oldCharacters, ...oldActionCards]
  .map((e) => e.shareId)
  .filter((e) => typeof e === "number")
  .reduce((a, b) => Math.max(a, b), 0);

const TAG_ZH_NAME_TO_ORIGINAL_MAP: Record<string, string> = {
  唯一: "GCG_TAG_UNIQUE",
  战斗行动: "GCG_TAG_SLOWLY",
  无法行动: "GCG_TAG_FORBIDDEN_ATTACK",
  免疫冻结: "GCG_TAG_IMMUNE_FREEZING",
  免疫控制: "GCG_TAG_IMMUNE_CONTROL",
  普通攻击视为下落攻击: "GCG_TAG_FALL_ATTACK",
  蒙德: "GCG_TAG_NATION_MONDSTADT",
  璃月: "GCG_TAG_NATION_LIYUE",
  稻妻: "GCG_TAG_NATION_INAZUMA",
  须弥: "GCG_TAG_NATION_SUMERU",
  枫丹: "GCG_TAG_NATION_FONTAINE",
  纳塔: "GCG_TAG_NATION_NATLAN",
  至冬: "GCG_TAG_NATION_SNEZHNAYA",
  坎瑞亚: "GCG_TAG_NATION_KHAENRIAH",
  愚人众: "GCG_TAG_CAMP_FATUI",
  丘丘人: "GCG_TAG_CAMP_HILICHURL",
  魔物: "GCG_TAG_CAMP_MONSTER",
  海乱鬼: "GCG_TAG_CAMP_KAIRAGI",
  镀金旅团: "GCG_TAG_CAMP_EREMITE",
  圣骸兽: "GCG_TAG_CAMP_SACREAD",
  其他武器: "GCG_TAG_WEAPON_NONE",
  法器: "GCG_TAG_WEAPON_CATALYST",
  弓: "GCG_TAG_WEAPON_BOW",
  双手剑: "GCG_TAG_WEAPON_CLAYMORE",
  长柄武器: "GCG_TAG_WEAPON_POLE",
  单手剑: "GCG_TAG_WEAPON_SWORD",
  无元素类型: "GCG_TAG_ELEMENT_NONE",
  冰元素: "GCG_TAG_ELEMENT_CRYO",
  水元素: "GCG_TAG_ELEMENT_HYDRO",
  火元素: "GCG_TAG_ELEMENT_PYRO",
  雷元素: "GCG_TAG_ELEMENT_ELECTRO",
  风元素: "GCG_TAG_ELEMENT_ANEMO",
  岩元素: "GCG_TAG_ELEMENT_GEO",
  草元素: "GCG_TAG_ELEMENT_DENDRO",
  武器: "GCG_TAG_WEAPON",
  圣遗物: "GCG_TAG_ARTIFACT",
  天赋: "GCG_TAG_TALENT",
  护盾: "GCG_TAG_SHEILD",
  特技: "GCG_TAG_VEHICLE",
  场地: "GCG_TAG_PLACE",
  伙伴: "GCG_TAG_ALLY",
  道具: "GCG_TAG_ITEM",
  元素共鸣: "GCG_TAG_RESONANCE",
  料理: "GCG_TAG_FOOD",
  秘传: "GCG_TAG_LEGEND",
  草元素产物: "GCG_TAG_DENDRO_PRODUCE",
  "始基力：荒性": "GCG_TAG_ARKHE_PNEUMA",
  "始基力：芒性": "GCG_TAG_ARKHE_OUSIA",
};

const adjustCost = (costArr: any[]): PlayCost[] => {
  return costArr
    .filter((obj) => "costType" in obj)
    .map(({ costType, count }) => {
      return {
        type:
          costType === "GCG_COST_DICE_PAIMON" ? "GCG_COST_DICE_SAME" : costType,
        count,
      };
    });
};

const globalReplacementMap = Object.fromEntries([
  ...Object.entries(entities).map(([k, v]) => [`C${k}`, v]),
  ...Object.entries(skills).map(([k, v]) => [`S${k}`, v]),
  ...Object.entries(keywords).map(([k, v]) => [`K${k}`, v]),
  ...Object.entries(cardsAndChars)
    .filter(([k, v]) => v.type === "Character")
    .map(([k, v]) => [`A${k}`, v.CHS]),
]);

const collateSkill = (id: string | number, rawJson: any): SkillRawData => {
  const keyMap: Record<string, any> = {};

  const replacementMap: Record<string, any> = { ...globalReplacementMap };
  const addReplacement = (rawJson: any) => {
    if (typeof rawJson === "object" && rawJson !== null && "Child" in rawJson) {
      for (const [key, node] of Object.entries(rawJson.Child)) {
        if (key.startsWith("D__")) {
          replacementMap[key] = node;
        }
        replacementMap[key] = node;
        addReplacement(node);
      }
    }
  };
  addReplacement(rawJson);

  return {
    id: Number(id),
    type: rawJson.Tag ?? "GCG_SKILL_TAG_VEHICLE", // 大概只有特技不会提供 Tag
    name: rawJson.Name,
    englishName: skillsEn[id].Name,
    rawDescription: rawJson.Desc,
    description: getDescriptionReplacedHakushin(rawJson.Desc, replacementMap),
    playCost: adjustCost(
      Object.entries(rawJson.Cost ?? {}).map(([costType, count]) => ({
        costType,
        count,
      })),
    ),
    targetList: [], // no idea
    keyMap,
  };
};

const collateCharacter = async (
  id: number,
  englishName: string,
  shareId: number,
): Promise<CharacterRawData> => {
  const rawJson = (await fetch(
    `https://api.hakush.in/gi/data/zh/gcg/${id}.json`,
  ).then((r) => r.json())) as any;

  const cardFace: string = rawJson.Icon;
  const icon = cardFace.replace(
    /CardFace_Char_([a-zA-Z]+)_([a-zA-Z]+)$/,
    (match, p1, p2) => {
      return `Char_${p1}Icon_${p2}`;
    },
  );
  const tags = rawJson.Tag.map(
    (tag: string) => TAG_ZH_NAME_TO_ORIGINAL_MAP[tag],
  );

  return {
    id,
    shareId,
    obtainable: true,
    sinceVersion: BETA_VERSION,
    name: rawJson.Name,
    englishName,
    tags,
    skills: Object.entries(rawJson.Talent).map(([k, v]) => collateSkill(k, v)),
    hp: rawJson.Hp,
    maxEnergy: rawJson.Cost,
    cardFace,
    icon,
  };
};

const collateActionCard = async (
  id: number,
  englishName: string,
  shareId: number,
): Promise<ActionCardRawData> => {
  const rawJson = (await fetch(
    `https://api.hakush.in/gi/data/zh/gcg/${id}.json`,
  ).then((r) => r.json())) as any;

  const tags = rawJson.Tag.map(
    (tag: string) => TAG_ZH_NAME_TO_ORIGINAL_MAP[tag],
  );
  const cardFace: string = rawJson.Icon;

  const replacementMap: Record<string, any> = { ...globalReplacementMap };
  const addReplacement = (rawJson: any) => {
    if (typeof rawJson === "object" && rawJson !== null && "Child" in rawJson) {
      for (const [key, node] of Object.entries(rawJson.Child)) {
        if (key.startsWith("D__")) {
          replacementMap[key] = node;
        }
        replacementMap[key] = node;
        addReplacement(node);
      }
    }
  };
  addReplacement(rawJson.Talent);

  let type = "GCG_CARD_EVENT";
  if (cardFace.includes("Modify")) {
    type = "GCG_CARD_MODIFY";
  } else if (cardFace.includes("Assist")) {
    type = "GCG_CARD_ASSIST";
  }

  let relatedCharacterId: number | null = null;
  if (Math.floor(id / 100_000) === 2) {
    relatedCharacterId = Math.floor((id % 100_000) / 10);
  }

  return {
    id,
    shareId,
    obtainable: true,
    type,
    sinceVersion: BETA_VERSION,
    name: rawJson.Name,
    englishName,
    tags,
    cardFace,
    rawDescription: rawJson.Talent.Desc,
    description: getDescriptionReplacedHakushin(
      rawJson.Talent.Desc,
      replacementMap,
    ),
    playCost: adjustCost(rawJson.Cost),
    relatedCharacterId,
    relatedCharacterTags: [],
    targetList: [], // no idea
  };
};

const collateEntity = (
  id: number,
  name: string,
  desc: string,
): EntityRawData => {
  let entitySkills: SkillRawData[] = [];
  if (desc.includes("K58")) {
    entitySkills = Object.entries(skills)
      .filter(([skillId]) => Math.floor(Number(skillId) / 10) === id)
      .map(([skillId, { Name, Desc }]) =>
        collateSkill(skillId, { Name, Desc }),
      );
  }
  return {
    id,
    type: "GCG_CARD_UNKNOWN", // no idea
    name,
    englishName: entitiesEn[id].Name,
    rawDescription: desc,
    description: getDescriptionReplacedHakushin(desc, globalReplacementMap),
    skills: entitySkills,
    // NO IDEAS !!!
    tags: [],
    hidden: false,
  };
};

const newCharacters: CharacterRawData[] = [];
const newActionCards: ActionCardRawData[] = [];
const newEntities: EntityRawData[] = [];

console.log("Collating character and action cards...");
for (const [idStr, { type, EN: title }] of Object.entries(cardsAndChars)) {
  const id = Number(idStr);
  if (type === "Character") {
    const exists = oldCharacters.find((c) => c.id === id);
    if (!exists) {
      newCharacters.push(await collateCharacter(id, title, ++maxShareId));
    }
  } else if (type === "Action") {
    const exists = oldActionCards.find((c) => c.id === id);
    if (!exists) {
      newActionCards.push(await collateActionCard(id, title, ++maxShareId));
    }
  } else {
    // unreachable
    console.error("UNREACHABLE");
    console.error({ id, type, title });
    continue;
  }
}

const eventCards = [...oldActionCards, ...newActionCards].filter(
  (c) => c.type === "GCG_CARD_EVENT",
);

console.log("Collating entities:");
for (const [idStr, { Name, Desc }] of Object.entries(entities)) {
  const id = Number(idStr);
  if ([50, 51, 52, 53, 54, 17, 18].includes(Math.floor(id / 10000))) {
    // 热斗模式
    continue;
  }
  if (id < 110000 && Name === "" && Desc === "") {
    // WTF is this just skip them!
    continue;
  }
  const exists = [...oldEntities, ...eventCards].find(
    (e) => e.id === Number(id),
  );
  if (!exists) {
    newEntities.push(collateEntity(id, Name, Desc));
  }
}

await Bun.write(
  `${import.meta.dirname}/../../src/data/characters.json`,
  JSON.stringify([...oldCharacters, ...newCharacters], void 0, 2),
);
await Bun.write(
  `${import.meta.dirname}/../../src/data/action_cards.json`,
  JSON.stringify([...oldActionCards, ...newActionCards], void 0, 2),
);
await Bun.write(
  `${import.meta.dirname}/../../src/data/entities.json`,
  JSON.stringify([...oldEntities, ...newEntities], void 0, 2),
);

console.log("done");
