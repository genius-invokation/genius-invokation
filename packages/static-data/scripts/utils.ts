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

export type ExcelData = Record<string, any>[];

export function getExcel(filename: string): ExcelData {
  return readJson(`${config.input}/ExcelBinOutput/${filename}.json`);
}

export type Locale = Record<number, string>;

function getTextMap(langCode: string): Locale {
  return readJson(`${config.input}/TextMap/TextMap${langCode}.json`);
}

export function getLanguage(langCode: string): Locale {
  return getTextMap(langCode.toUpperCase());
}

export function getPropNameWithMatch(
  excel: ExcelData,
  idKey: string,
  idVal: any,
  propVal: any,
): string {
  const tmp = excel.find((e) => e[idKey] === idVal);
  if (!tmp) throw new Error(`getPropNameWithMatch: Did not find value for key`);
  return Object.entries(tmp).find(
    (e) => e[1] === propVal || e[1][0] === propVal,
  )![0];
}
export function sanitizeName(str: string) {
  str = str.split("|s")[0];
  if (str.includes("{NON_BREAK_SPACE}")) {
    if (str[0] !== "#")
      console.log(`${str} REMOVING NON_BREAK_SPACE BUT IT DOESNT START WITH #`);
    str = str.replaceAll("{NON_BREAK_SPACE}", "").substring(1);
  }
  return str;
}

export const xcard = getExcel("GCGCardExcelConfigData");
export const xchar = getExcel("GCGCharExcelConfigData");
export const xskill = getExcel("GCGSkillExcelConfigData");
export const xelement = getExcel("GCGElementExcelConfigData");
export const xkeyword = getExcel("GCGKeywordExcelConfigData");
export const xavatar = getExcel("AvatarExcelConfigData");
export const xdeckcard = getExcel("GCGDeckCardExcelConfigData");
export const xcardview = getExcel("GCGCardViewExcelConfigData");
export const xchoose = getExcel("GCGChooseExcelConfigData");

export const wandererNameTextMapHash = xavatar.find(
  (ele) => ele.id === 10000075,
)!.nameTextMapHash;

// GCGDeckCardExcelConfigData
export const propShareId = getPropNameWithMatch(xdeckcard, "id", 1101, 1);

// GCGCardExcelConfigData
export const propPlayingDescription2 = getPropNameWithMatch(
  xcard,
  "id",
  330005,
  3076893924,
);

interface ReplacementDictionary {
  baseElement?: string;
  baseDamage?: number;
}

export function getDescriptionReplaced(
  description: string,
  locale: Locale,
  keyMap: Record<string, any> = {},
) {
  const propKeywordId = getPropNameWithMatch(
    xelement,
    "type",
    "GCG_ELEMENT_CRYO",
    101,
  );

  let ind = description.indexOf("$[");
  while (ind !== -1) {
    const strToReplace = description.substring(
      ind,
      description.indexOf("]", ind) + 1,
    );
    let replacementText = strToReplace;

    const selectors = strToReplace
      .substring(2, strToReplace.length - 1)
      .split("|");
    if (selectors.length > 2)
      console.warn(`Tcg description ${strToReplace} has extra pipes`);
    let selector: string | undefined = selectors[1];
    if (selector === "nc") selector = undefined;

    switch (description[ind + 2]) {
      case "D": // D__KEY__DAMAGE or D__KEY__ELEMENT
        switch (description[ind + 10]) {
          case "D": // DAMAGE
            replacementText = String(keyMap[selectors[0]]);

            break;

          case "E": // ELEMENT
            const element = keyMap.D__KEY__ELEMENT;
            const keywordId = xelement.find((e) => e.type === element)![
              propKeywordId
            ];
            const elementTextMapHash = xkeyword.find(
              (e) => e.id === keywordId,
            )!.titleTextMapHash;
            replacementText = locale[elementTextMapHash];
            break;

          default:
            console.log(
              `Tcg description has unhandled replacement letter ${
                description[ind + 2]
              }`,
            );
            break;
        }
        break;

      // case 'I':
      // 	 break;

      case "C": // GCGCard
        const cardId = parseInt(
          description.substring(ind + 3, description.indexOf("]", ind)),
          10,
        );
        const cardObj = xcard.find((e) => e.id === cardId)!;
        const cardName = locale[cardObj.nameTextMapHash];

        replacementText = cardName;
        break;

      case "K": // GCGKeyword
        const keywordId = parseInt(
          description.substring(ind + 3, description.indexOf("]", ind)),
          10,
        );
        const keywordObj = xkeyword.find((e) => e.id === keywordId)!;
        const keywordName = locale[keywordObj.titleTextMapHash];

        replacementText = keywordName;
        break;

      case "A": // GCGChar
        const charId = parseInt(
          description.substring(ind + 3, description.indexOf("]", ind)),
          10,
        );
        const charObj = xchar.find((e) => e.id === charId)!;
        const charName = locale[charObj.nameTextMapHash];

        replacementText = charName;
        break;

      case "S": // GCGSkill
        const skillId = parseInt(
          description.substring(ind + 3, description.indexOf("]", ind)),
          10,
        );
        const skillObj = xskill.find((e) => e.id === skillId)!;

        if (skillObj === undefined) {
          console.log(`No skillObj found to replace in description:`);
          console.log("  " + description);
        } else {
          const skillName = locale[skillObj.nameTextMapHash];

          replacementText = skillName;
        }
        break;

      // case 'S':
      // 	break;

      default:
        console.log(
          `Tcg description has unhandled replacement letter ${
            description[ind + 2]
          }`,
        );
        break;
    }

    // console.log('===========');
    // console.log(description);
    // console.log(selector);
    // console.log(replacementText);

    const splitText = replacementText.split("|");
    if (selector && splitText.find((s) => s.startsWith(selector))) {
      replacementText = splitText
        .find((s) => s.startsWith(selector))!
        .split(":")[1];
    } else {
      replacementText = splitText[0];
    }

    description = description.replaceAll(strToReplace, replacementText);

    ind = description.indexOf("$[", ind + 1);
  }

  // if (description.indexOf('$') !== -1) console.log(`Tcg description has unreplaced text for:\n  ${description} `);
  // Replace {PLURAL#1|pt.|pts.}
  ind = description.indexOf("{PLURAL");
  while (ind !== -1) {
    const strToReplace = description.substring(
      ind,
      description.indexOf("}", ind) + 1,
    );
    let replacementText = strToReplace;

    const values = strToReplace
      .substring(1, strToReplace.length - 1)
      .split("|");
    const number = parseInt(values[0].split("#")[1], 10);
    if (number === 1) replacementText = values[1];
    else if (number > 1) replacementText = values[2];
    else
      console.log(
        `Tcg plural has unhandled value ${number} for ${strToReplace}`,
      );

    description = description.replaceAll(strToReplace, replacementText);

    ind = description.indexOf("{PLURAL", ind + 1);
  }

  return description;
}

export * from "./sanitize";
