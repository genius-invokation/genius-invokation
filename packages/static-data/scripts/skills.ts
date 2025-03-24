// Copyright (C) 2024 theBowja, Guyutongxue
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

import { config } from "./config";
import { readJson } from "./json";
import fs from "node:fs";
import {
  getLanguage,
  sanitizeDescription,
  sanitizeName,
  xskill,
  getDescriptionReplaced,
  xchoose,
} from "./utils";
import { getSkillIcon } from "./skill_icon";
import {
  CARD_TYPE,
  SKILL_ID,
  CHOOSE_TARGET_LIST,
  COST_LIST,
  COST_TYPE,
  COUNT,
  DESC_TEXT_MAP_HASH,
  ID,
  NAME_TEXT_MAP_HASH,
  SKILL_ICON_HASH,
  SKILL_JSON,
  TAG_LIST,
  TARGET_CAMP,
  TARGET_HINT_TEXT_MAP_HASH,
  SKILL_TAG_LIST,
} from "./properties";

// Goes through binoutput to get data on tcg skill's damage and element
const tcgSkillKeyMap: Record<string, any> = {};
const fileList = fs.readdirSync(
  `${config.input}/BinOutput/GCG/Gcg_DeclaredValueSet`,
);

const PROPERTIES_KEY_MAP = {
  "-2060930438": "D__KEY__DAMAGE",
  "1428448537": "D__KEY__DAMAGE_2",
  "1428448538": "D__KEY__DAMAGE_3",
  "1428448540": "D__KEY__DAMAGE_5",
  "476224977": "D__KEY__ELEMENT",
} as Record<string, string>;

type ValueGrabber<T = any> = (obj: object) => T;

const numberGrabber: ValueGrabber<number> = (obj) =>
  Object.values(obj).find((val) => typeof val === "number")! as number;

const VALUE_GRABBER = {
  D__KEY__DAMAGE: numberGrabber,
  D__KEY__DAMAGE_2: numberGrabber,
  D__KEY__DAMAGE_3: numberGrabber,
  D__KEY__DAMAGE_5: numberGrabber,
  D__KEY__ELEMENT: (obj: object) =>
    Object.values(obj).find(
      (val) => typeof val === "string" && val.startsWith("GCG"),
    )! as string,
} as Record<string, ValueGrabber>;

for (const filename of fileList) {
  if (!filename.endsWith(".json")) continue;

  const fileObj = readJson(
    `${config.input}/BinOutput/GCG/Gcg_DeclaredValueSet/${filename}`,
  );

  try {
    const dataName = fileObj.name;
    if (`${dataName}.json` !== filename) {
      // continue;
    }
    const declaredValueMap = fileObj.declaredValueMap;

    tcgSkillKeyMap[dataName] = {};

    for (let [key, kobj] of Object.entries(declaredValueMap) as [
      string,
      any,
    ][]) {
      if (key in PROPERTIES_KEY_MAP) {
        let value = VALUE_GRABBER[PROPERTIES_KEY_MAP[key]](kobj);
        if (typeof value === "undefined") {
          if (PROPERTIES_KEY_MAP[key] === "D__KEY__ELEMENT") {
            // D__KEY__ELEMENT 可空（即物理伤害）
          } else if (/^Char_Skill_(7|8)/.test(dataName)) {
            // 自走棋角色技能
          } else {
            console.log(
              `loadTcgSkillKeyMap ${dataName}.json failed to extract ${PROPERTIES_KEY_MAP[key]}`,
            );
          }
          continue;
        }
        tcgSkillKeyMap[dataName][PROPERTIES_KEY_MAP[key]] = value;
      }
    }
  } catch (e) {
    // console.log(`In ${filename}`);
    // console.error(e);
    continue;
  }
}
console.log("loadTcgSkillKeyMap");

export interface PlayCost {
  type: string;
  count: number;
}

export interface SkillRawData {
  id: number;
  type: string;
  name: string;
  englishName: string;
  rawDescription: string;
  description: string;
  playCost: PlayCost[];
  targetList: ChooseTarget[];
  keyMap: Record<string, any>;
  icon?: string;
}

export interface ChooseTarget {
  id: number;
  type: string;
  camp: string;
  tags: string[];
  rawHintText: string;
  hintText: string;
}

export async function collateSkill(
  langCode: string,
  skillId: number,
): Promise<SkillRawData | null> {
  const locale = getLanguage(langCode);
  const english = getLanguage("EN");
  const skillObj = xskill.find((e) => e[SKILL_ID] === skillId)!;

  const id = skillId;
  const type = skillObj[SKILL_TAG_LIST][0];
  if (type === "GCG_TAG_NONE") {
    return null;
  }
  const [name, englishName] = [locale, english].map((lc) =>
    sanitizeName(lc[skillObj[NAME_TEXT_MAP_HASH]] ?? ""),
  );

  const rawDescription = locale[skillObj[DESC_TEXT_MAP_HASH]] ?? "";
  const keyMap = tcgSkillKeyMap[skillObj[SKILL_JSON]]; // TODO!!!!
  const descriptionReplaced = getDescriptionReplaced(
    rawDescription,
    locale,
    keyMap,
  );
  const description = sanitizeDescription(descriptionReplaced, true);

  const playCost = skillObj[COST_LIST].filter((e: any) => e[COUNT]).map(
    (e: any) => ({
      type: e[COST_TYPE],
      count: e[COUNT],
    }),
  );

  const iconHash = skillObj[SKILL_ICON_HASH];
  const icon = await getSkillIcon(id, iconHash);
  // const icon = iconHash;

  const targetList: ChooseTarget[] = [];
  for (const target of skillObj[CHOOSE_TARGET_LIST] ?? []) {
    const chooseObj = xchoose.find((c) => c[ID] === target);
    if (!chooseObj) {
      continue;
    }
    const rawHintText = locale[chooseObj[TARGET_HINT_TEXT_MAP_HASH]] ?? "";
    const hintText = sanitizeDescription(rawHintText, true);
    targetList.push({
      id: chooseObj[SKILL_ID],
      type: chooseObj[CARD_TYPE],
      camp: chooseObj[TARGET_CAMP],
      tags: chooseObj[TAG_LIST].filter((e: string) => e !== "GCG_TAG_NONE"),
      rawHintText,
      hintText,
    });
  }

  return {
    id,
    name,
    englishName,
    type,
    rawDescription,
    description,
    playCost,
    targetList,
    keyMap,
    icon,
  };
}
