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

import type { ChooseTarget, PlayCost } from "./skills";
import {
  getDescriptionReplaced,
  getLanguage,
  sanitizeDescription,
  sanitizeName,
  xcardview,
  xdeckcard,
  xcard,
  propShareId,
  propPlayingDescription2,
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
  const locale = getLanguage(langCode);
  const english = getLanguage("EN");
  const result: ActionCardRawData[] = [];
  for (const obj of xcard) {
    if (
      !["GCG_CARD_EVENT", "GCG_CARD_MODIFY", "GCG_CARD_ASSIST"].includes(
        obj.cardType,
      )
    ) {
      continue;
    }
    if (!locale[obj.nameTextMapHash]) {
      continue;
    }

    const id = obj.id;
    if ([52, 53, 54, 17, 18].includes(Math.floor(id / 10000))) {
      // 热斗模式
      continue;
    }
    if (Math.floor(id / 10) === 13309) {
      // 骗骗花就算了吧
      continue;
    }
    const type = obj.cardType;
    const [name, englishName] = [locale, english].map((lc) =>
      sanitizeName(lc[obj.nameTextMapHash] ?? ""),
    );
    const obtainable = !!obj.isCanObtain;
    const tags = obj.tagList.filter((e: string) => e !== "GCG_TAG_NONE");

    const deckcardObj = xdeckcard.find((e) => e.id === obj.id);

    const shareId = deckcardObj?.[propShareId];
    const sinceVersion = getVersion(shareId);
    const storyTitle = deckcardObj
      ? locale[deckcardObj.storyTitleTextMapHash]
      : void 0;
    const storyText = deckcardObj
      ? sanitizeDescription(locale[deckcardObj.storyDescTextMapHash])
      : void 0;

    const relatedCharacterId = deckcardObj?.relatedCharacterId ?? null;
    const relatedCharacterTags =
      deckcardObj?.relatedCharacterTagList?.filter(
        (e: string) => e !== "GCG_TAG_NONE",
      ) ?? [];

    const rawDescription = locale[obj.descTextMapHash] ?? "";
    const descriptionReplaced = getDescriptionReplaced(rawDescription, locale);
    const description = sanitizeDescription(descriptionReplaced, true);

    const rawPlayingDescription: string | undefined =
      locale[obj.descOnTableTextMapHash] ??
      locale[obj[propPlayingDescription2]];
    let playingDescription: string | undefined = void 0;
    if (rawPlayingDescription) {
      const playingDescriptionReplaced = getDescriptionReplaced(
        rawPlayingDescription,
        locale,
      );
      playingDescription = sanitizeDescription(playingDescriptionReplaced);
    }

    const playCost = obj.costList
      .filter((e: any) => e.count)
      .map((e: any) => ({
        type: e.costType,
        count: e.count,
      }));

    const cardPrefabName = xcardview.find(
      (e) => e.id === obj.id,
    )!.cardPrefabName;
    const cardFace = `UI_${cardPrefabName}`;

    const targetList: ChooseTarget[] = [];
    for (const target of obj.chooseTargetList ?? []) {
      const chooseObj = xchoose.find((c) => c.id === target);
      if (!chooseObj) {
        continue;
      }
      const rawHintText = locale[chooseObj.targetHintTextMapHash] ?? "";
      const hintText = sanitizeDescription(rawHintText, true);
      targetList.push({
        id: chooseObj.id,
        type: chooseObj.cardType,
        camp: chooseObj.targetCamp,
        tags: chooseObj.tagList.filter((e: string) => e !== "GCG_TAG_NONE"),
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
