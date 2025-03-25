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
  NAME_TEXT_MAP_HASH,
  SKILL_ICON_HASH,
  SKILL_JSON,
  TAG_LIST,
  TARGET_CAMP,
  TARGET_HINT_TEXT_MAP_HASH,
  SKILL_TAG_LIST,
} from "./properties";
import tcgSkillKeyMap from "./skill_data.toml";

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
  keyMap?: Record<string, any>;
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
  const keyMap = tcgSkillKeyMap[skillObj[SKILL_JSON]];
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
  if (!keyMap && description.includes("D__")) {
    console.log(`This might be a new skill that missing keyMap: ${skillObj[SKILL_JSON]} (${name}), please check!!`);
  }
  // const icon = iconHash;

  const targetList: ChooseTarget[] = [];
  for (const target of skillObj[CHOOSE_TARGET_LIST] ?? []) {
    const chooseObj = xchoose.find((c) => c[SKILL_ID] === target);
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
