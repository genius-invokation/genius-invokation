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
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

const MAPPING_FILE = `${import.meta.dirname}/mappings/skill_icons.json`;

const doFetch = async (id: number | string) => {
  const url = `https://gi.yatta.moe/api/v2/en/gcg/${id}`;
  const body = await fetch(url, {
    proxy: process.env.https_proxy,
  }).then((r) => r.json() as Promise<any>);
  if (!body.ok) {
    console.error(`Failed to fetch ${url}`);
    return;
  }
  return body;
}

export async function getSkillIcon(skillId: number | string, iconHash?: number | bigint): Promise<string | undefined> {
  skillId = String(skillId);
  if (typeof iconHash === "undefined") {
    return;
  }
  const mapping = await Bun.file(MAPPING_FILE).json();
  if (Reflect.has(mapping, String(iconHash))) {
    return mapping[String(iconHash)];
  }
  console.log(`Skill id ${skillId} has unknown icon hash ${iconHash}, find it on Project Amber...`);

  let skillObj = null;
  if (skillId.length === 5) {
    // 角色技能
    const chId = skillId.slice(0, 4)
    const body = await doFetch(chId);
    if (!body) {
      return;
    }
    skillObj = body.data.talent[skillId];
    if (!skillObj) {
      console.error(`We do not found skill ${skillId} on character ${chId}`);
      return;
    }
  } else if (skillId.length === 7) {
    // 特技
    if (skillId.startsWith('3')) {
      // 单独的特技装备牌
      const cardId = skillId.slice(0, 6);
      const body = await doFetch(cardId);
      if (!body) {
        return;
      }
      skillObj = body.data.dictionary[`S${skillId}`];
    } else if (skillId.startsWith('1')) {
      // 角色衍生装备牌
      const chId = skillId.slice(1, 5);
      const body = await doFetch(chId);
      if (!body) {
        return;
      }
      skillObj = body.data.dictionary[`S${skillId}`];
    } else {
      console.error(`${skillId} is not a recognizable id, for now.`);
      return;
    }
  } else {
    console.error(`${skillId} is not a recognizable id, for now.`);
    return;
  }
  if (!skillObj?.icon) {
    console.error(`No icon provided for ${skillId}`);
    return;
  }

  mapping[String(iconHash)] = skillObj.icon;
  await Bun.write(MAPPING_FILE, JSON.stringify(mapping, null, 2));

  return skillObj.icon;
}
