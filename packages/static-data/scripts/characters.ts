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

import { collateSkill, type SkillRawData } from "./skills";
import {
  getLanguage,
  sanitizeDescription,
  sanitizeName,
  propShareId,
  wandererNameTextMapHash,
  xcardview,
  xchar,
  xdeckcard,
} from "./utils";
import { getVersion } from "./version";

export interface CharacterRawData {
  id: number;
  obtainable: boolean;
  shareId?: number;
  sinceVersion?: string;
  name: string;
  englishName: string;
  tags: string[];
  storyTitle?: string;
  storyText?: string;
  skills: SkillRawData[];
  hp: number;
  maxEnergy: number;
  cardFace: string;
  icon: string;
}

// https://github.com/LPSim/frontend/blob/master/collector/splitter/split.py
const AVATAR_ICON_NAMES: Record<string, string> = {
  "ALbedo.png": "Albedo.png",
  "Amber.png": "Ambor.png",
  "BruteAxeElec.png": "BruteEleAxe.png",
  "BruteAxeFire.png": "BruteAxe.png",
  "EffigyIce.png": "Effigyice.png",
  "EffigyElectric.png": "Effigyelectric.png",
  "FatuusMageIce.png": "FatuusMageice.png",
  "HiliRangeElec.png": "HiliElectric.png",
  "InvokerDeaconFire.png": "DeaconFire.png",
  "KairagiElec.png": "KairagiEle.png",
  "SamuraiRonin01.png": "RoninWater.png",
  "SamuraiRonin02.png": "RoninFire.png",
  "SamuraiRonin03.png": "RoninEle.png",
  "SkirmisherIce.png": "Skirnisherfatice.png",
  "SkirmisherWater.png": "Skirnisherfatwater.png",
  "SkirmisherWind.png": "Skirnisherstrongwind.png",
  "SlimeElec.png": "SlimeEle.png",
  "UnuAnudattaGrass.png": "UnDeltaGrass.png",
  "EremiteOracle.png": "Muscleman.png",
  "GargoyleGround.png": "Formathr.png",
  "EremiteGlaive.png": "Eremiteice.png",
  "EremiteKatar.png": "Eremiterock.png",
  "EremitePushDagger.png": "Eremitewater.png",
};
const CARDFACE_TO_AVATAR_MAP = Object.fromEntries(
  Object.entries(AVATAR_ICON_NAMES).map(([k, v]) => [
    v.slice(0, -4),
    k.slice(0, -4),
  ]),
);

export async function collateCharacters(
  langCode: string,
): Promise<CharacterRawData[]> {
  const locale = getLanguage(langCode);
  const english = getLanguage("EN");
  const result: CharacterRawData[] = [];
  for (const obj of xchar) {
    if (obj.skillList.includes(80)) {
      continue;
    }
    if (obj.isRemoveAfterDie) {
      continue;
    }
    const obtainable = !!obj.isCanObtain;
    const deckcardObj = xdeckcard.find((e) => e.id === obj.id);

    let isWanderer = false;

    const id = obj.id;
    if (Math.floor(id / 1000) === 7) {
      // 自走棋角色，别闹
      continue;
    }

    if (locale[obj.nameTextMapHash].includes("ID(1)")) isWanderer = true;

    let nameTextMapHash = isWanderer
      ? wandererNameTextMapHash
      : obj.nameTextMapHash;
    const [name, englishName] = [locale, english].map((lc) =>
      sanitizeName(lc[nameTextMapHash]),
    );

    const shareId = deckcardObj?.[propShareId];
    const sinceVersion = getVersion(shareId);
    const storyTitle = deckcardObj
      ? locale[deckcardObj.storyTitleTextMapHash]
      : void 0;
    const storyText = deckcardObj
      ? sanitizeDescription(locale[deckcardObj.storyDescTextMapHash])
      : void 0;

    const hp = obj.hp;
    const maxEnergy = obj.maxEnergy;

    const tags: string[] = obj.tagList.filter((e: any) => e !== "GCG_TAG_NONE");
    const skills: SkillRawData[] = [];
    for (const skillId of obj.skillList) {
      const data = await collateSkill(langCode, skillId);
      if (data) {
        skills.push(data);
      }
      skills.push();
    }

    const cardPrefabName = xcardview.find(
      (e) => e.id === obj.id,
    )!.cardPrefabName;
    const cardFace = `UI_${cardPrefabName}`;
    const icon = cardFace.replace(
      /CardFace_Char_([a-zA-Z]+)_([a-zA-Z]+)$/,
      (match, p1, p2) => {
        return `Char_${p1}Icon_${CARDFACE_TO_AVATAR_MAP[p2] ?? p2}`;
      },
    );

    result.push({
      id,
      shareId,
      sinceVersion,
      obtainable,
      name,
      englishName,
      tags,
      storyTitle,
      storyText,
      skills,
      hp,
      maxEnergy,
      cardFace,
      icon,
    });
  }
  return result;
}
