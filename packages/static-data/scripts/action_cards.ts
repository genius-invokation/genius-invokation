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

import {
  CARD_TYPE,
  SKILL_ID,
  CHOOSE_TARGET_LIST,
  COST_LIST,
  COST_TYPE,
  COUNT,
  DESC_ON_TABLE_2_TEXT_MAP_HASH,
  DESC_ON_TABLE_TEXT_MAP_HASH,
  DESC_TEXT_MAP_HASH,
  ID,
  IS_CAN_OBTAIN,
  NAME_TEXT_MAP_HASH,
  RELATED_CHARACTER_ID,
  RELATED_CHARACTER_TAG_LIST,
  SHARE_ID,
  STORY_TITLE_TEXT_MAP_HASH,
  TAG_LIST,
  TARGET_CAMP,
  TARGET_HINT_TEXT_MAP_HASH,
  STORY_DESC_TEXT_MAP_HASH,
  CARD_PREFAB_NAME,
} from "./properties";
import type { ChooseTarget, PlayCost } from "./skills";
import {
  getDescriptionReplaced,
  getLanguage,
  sanitizeDescription,
  sanitizeName,
  xcardview,
  xdeckcard,
  xcard,
  xchoose,
} from "./utils";
import { getVersion } from "./version";

export interface ActionCardRawData {
  id: number;
  type: string;
  obtainable: boolean;
  shareId?: number;
  sinceVersion?: string;
  name: string;
  englishName: string;
  tags: string[];
  targetList: ChooseTarget[];
  relatedCharacterId: number | null;
  relatedCharacterTags: string[];
  storyTitle?: string;
  storyText?: string;
  rawDescription: string;
  description: string;
  rawPlayingDescription?: string;
  playingDescription?: string;
  playCost: PlayCost[];
  cardFace: string;
}

export function collateActionCards(langCode: string) {
  console.log("Collating action cards...");
  const locale = getLanguage(langCode);
  const english = getLanguage("EN");
  const result: ActionCardRawData[] = [];
  for (const obj of xcard) {
    if (
      !["GCG_CARD_EVENT", "GCG_CARD_MODIFY", "GCG_CARD_ASSIST"].includes(
        obj[CARD_TYPE],
      )
    ) {
      continue;
    }
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
    const obtainable = !!obj[IS_CAN_OBTAIN];
    const tags = obj[TAG_LIST].filter((e: string) => e !== "GCG_TAG_NONE");

    const deckcardObj = xdeckcard.find((e) => e[ID] === id);

    const shareId = deckcardObj?.[SHARE_ID];
    const sinceVersion = getVersion(shareId);
    const storyTitle = deckcardObj
      ? locale[deckcardObj[STORY_TITLE_TEXT_MAP_HASH]]
      : void 0;
    const storyText = deckcardObj
      ? sanitizeDescription(locale[deckcardObj[STORY_DESC_TEXT_MAP_HASH]])
      : void 0;

    const relatedCharacterId = deckcardObj?.[RELATED_CHARACTER_ID] || null;
    const relatedCharacterTags =
      deckcardObj?.[RELATED_CHARACTER_TAG_LIST]?.filter(
        (e: string) => e !== "GCG_TAG_NONE",
      ) ?? [];

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

    const playCost = obj[COST_LIST].filter((e: any) => e[COUNT]).map(
      (e: any) => ({
        type: e[COST_TYPE],
        count: e[COUNT],
      }),
    );

    const cardPrefabName = xcardview.find((e) => e[ID] === id)![
      CARD_PREFAB_NAME
    ];
    const cardFace = `UI_${cardPrefabName}`;

    const targetList: ChooseTarget[] = [];
    for (const target of obj[CHOOSE_TARGET_LIST] ?? []) {
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

    result.push({
      id,
      shareId,
      sinceVersion,
      obtainable,
      type,
      name,
      englishName,
      tags,
      targetList,
      relatedCharacterId,
      relatedCharacterTags,
      storyTitle,
      storyText,
      playCost,
      rawDescription,
      description,
      rawPlayingDescription,
      playingDescription,
      cardFace,
    });
  }
  return result;
}
