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

import { sanitizeDescription } from "../sanitize";
import { characters, entities, actionCards, keywords } from "../../src";

const allEntities = [...entities, ...actionCards];
const allSkills = [...entities, ...characters].flatMap((e) => e.skills);

const cachedKeyMap: Record<string, any> = {};

export function getDescriptionReplacedHakushin(
  description: string,
  keyMap: Record<string, any> = cachedKeyMap,
) {
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

    let value = keyMap[selectors[0]];
    if (typeof value === "undefined") {
      // Manually searching old entries
      if (selectors[0].startsWith("A")) {
        const id = Number(selectors[0].substring(1));
        value = characters.find((e) => e.id === id)?.name;
      } else if (selectors[0].startsWith("C")) {
        const id = Number(selectors[0].substring(1));
        value = allEntities.find((e) => e.id === id)?.name;
      } else if (selectors[0].startsWith("S")) {
        const id = Number(selectors[0].substring(1));
        value = allSkills.find((e) => e.id === id)?.name;
      } else if (selectors[0].startsWith("K")) {
        const id = Number(selectors[0].substring(1));
        value = keywords.find((e) => e.id === id)?.name;
      }
    }
    if (typeof value === "undefined") {
      console.log(`Tcg description has unhandled replacement ${selectors[0]}`);
    }
    if (typeof value === "object" && value !== null) {
      value = value.Name;
      if (keyMap !== cachedKeyMap) {
        cachedKeyMap[selectors[0]] = value;
      }
    }
    switch (value) {
      case "GCG_ELEMENT_PHYSIC":
        value = "物理伤害";
        break;
      case "GCG_ELEMENT_CRYO":
        value = "冰元素伤害";
        break;
      case "GCG_ELEMENT_HYDRO":
        value = "水元素伤害";
        break;
      case "GCG_ELEMENT_PYRO":
        value = "火元素伤害";
        break;
      case "GCG_ELEMENT_ELECTRO":
        value = "雷元素伤害";
        break;
      case "GCG_ELEMENT_ANEMO":
        value = "风元素伤害";
        break;
      case "GCG_ELEMENT_GEO":
        value = "岩元素伤害";
        break;
      case "GCG_ELEMENT_DENDRO":
        value = "草元素伤害";
        break;
    }
    value = `${value}`;
    replacementText = sanitizeDescription(value, true);

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

  return sanitizeDescription(description, true);
}
