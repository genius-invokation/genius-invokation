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

import { readJson } from "./json";
import {
  BUFF_ICON_HASH,
  CARD_PREFAB_NAME,
  CARD_TYPE,
  DESC_ON_TABLE_2_TEXT_MAP_HASH,
  DESC_ON_TABLE_TEXT_MAP_HASH,
  DESC_TEXT_MAP_HASH,
  HINT_TYPE,
  ID,
  IS_HIDDEN,
  NAME_TEXT_MAP_HASH,
  SKILL_LIST,
  STATE_BUFF_TYPE,
  TAG_LIST,
  TOKEN_TO_SHOW,
} from "./properties";
import { collateSkill, type SkillRawData } from "./skills";
import {
  getExcel,
  getLanguage,
  sanitizeDescription,
  getDescriptionReplaced,
  sanitizeName,
  xcardview,
  xcard,
} from "./utils";

export interface EntityRawData {
  id: number;
  type: string;
  name: string;
  englishName: string;
  tags: string[];
  skills: SkillRawData[];
  rawDescription: string;
  description: string;
  rawPlayingDescription?: string;
  playingDescription?: string;

  hidden: boolean;
  buffType?: string;
  hintType?: string;
  shownToken?: string;

  /** summons only */
  cardFace?: string;

  /** status / combat status only */
  buffIcon?: string;
  buffIconHash?: string;
}

function getBuffIconFileName(iconHash?: number | bigint): string | undefined {
  const data = readJson(`${import.meta.dirname}/mappings/buff_icons.json`);
  return iconHash ? data[String(iconHash)] : void 0;
}

export async function collateEntities(langCode: string) {
  console.log("Collating entities...");
  const locale = getLanguage(langCode);
  const english = getLanguage("EN");
  const result: EntityRawData[] = [];
  for (const obj of xcard) {
    if (
      ![
        "GCG_CARD_STATE", // 状态
        "GCG_CARD_MODIFY", // 装备
        "GCG_CARD_ONSTAGE", // 出战状态
        "GCG_CARD_SUMMON", // 召唤物
        "GCG_CARD_ASSIST", // 支援牌
      ].includes(obj[CARD_TYPE])
    ) {
      // GCG_CARD_EVENT
      // console.log(obj.cardType);
      continue;
    }
    const hidden = !!obj[IS_HIDDEN];

    if (!locale[obj[NAME_TEXT_MAP_HASH]]) {
      continue;
    }

    const id = obj[ID];
    if ([40, 42].includes(Math.floor(id / 10000))) {
      // PvE & 热斗大概是
      continue;
    }
    if ([50, 51, 52, 53, 54, 55, 17, 18].includes(Math.floor(id / 10000))) {
      // 热斗模式
      continue;
    }
    if (133085 <= id && id <= 133099) {
      // 骗骗花就算了吧
      continue;
    }
    const type = obj[CARD_TYPE];
    const [name, englishName] = [locale, english].map((lc) =>
      sanitizeName(lc[obj[NAME_TEXT_MAP_HASH]] ?? ""),
    );
    if (name === "") {
      continue;
    }

    const tags = obj[TAG_LIST].filter((e: any) => e !== "GCG_TAG_NONE");
    const skills: SkillRawData[] = [];
    // 当这是一张特技装备时，查找特技的技能定义
    if (tags.includes("GCG_TAG_VEHICLE")) {
      for (const skillId of obj[SKILL_LIST]) {
        const data = await collateSkill(langCode, skillId);
        if (data) {
          skills.push(data);
        }
      }
    }

    const rawDescription = locale[obj[DESC_TEXT_MAP_HASH]] ?? "";
    const descriptionReplaced = getDescriptionReplaced(rawDescription, locale);
    const description = sanitizeDescription(descriptionReplaced, true);

    const rawPlayingDescription: string | undefined =
      locale[obj[DESC_ON_TABLE_TEXT_MAP_HASH]] ??
      locale[obj[DESC_ON_TABLE_2_TEXT_MAP_HASH]];
    let playingDescription: string | undefined = void 0;
    if (rawPlayingDescription) {
      const playingDescriptionReplaced = getDescriptionReplaced(
        rawPlayingDescription,
        locale,
      );
      playingDescription = sanitizeDescription(playingDescriptionReplaced);
    }

    const buffType =
      obj[STATE_BUFF_TYPE] === "GCG_STATE_BUFF_NONE"
        ? void 0
        : obj[STATE_BUFF_TYPE];
    const hintType =
      obj[HINT_TYPE] === "GCG_HINT_INVALID" ? void 0 : obj[HINT_TYPE];
    const shownToken =
      obj[TOKEN_TO_SHOW] === "GCG_TOKEN_NONE" ? void 0 : obj[TOKEN_TO_SHOW];
    const buffIcon = getBuffIconFileName(obj[BUFF_ICON_HASH]);
    if (obj[BUFF_ICON_HASH] && !buffIcon) {
      console.warn(
        `Entity ${id} ${name}'s icon (${obj[BUFF_ICON_HASH]}) file name is missing now`,
      );
    }
    const buffIconHash = obj[BUFF_ICON_HASH]
      ? String(obj[BUFF_ICON_HASH])
      : void 0;

    const data: EntityRawData = {
      id,
      type,
      name,
      englishName,
      tags,
      skills,
      rawDescription,
      description,
      rawPlayingDescription,
      playingDescription,
      buffType,
      hintType,
      shownToken,
      hidden,
      buffIcon,
      buffIconHash,
    };

    if (type === "GCG_CARD_SUMMON") {
      const cardPrefabName = xcardview.find((e) => e[ID] === id)![
        CARD_PREFAB_NAME
      ];
      data.cardFace = `UI_${cardPrefabName}`;
    }
    result.push(data);
  }
  return result;
}
