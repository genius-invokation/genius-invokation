// Copyright (C) 2024-2025 Guyutongxue
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import { test, expect } from "bun:test";
import { Game } from "../game";
import { Character } from "../builder/context/character";
import {
  CharacterDefinition,
  EntityDefinition,
  SkillDefinition,
  CardDefinition,
} from "../base/index";
import { EventArg } from "../base/skill";
import {
  getActiveCharacterIndex,
  findReplaceAction,
  isSkillDisabled,
} from "../utils";

const mockCharacterDef = (skills: SkillDefinition[]): CharacterDefinition => ({
  __definition: "characters",
  id: 1,
  skills,
  tags: [],
  type: "character",
  varConfigs: {} as any,
  version: {
    from: "official",
    value: {
      predicate: "until",
      version: "v3.3.0",
    },
  },
  associatedNightsoulsBlessing: null,
  specialEnergy: null,
});

const mockEntityDef = (
  skills: SkillDefinition[],
  tags: string[] = []
): EntityDefinition => ({
  __definition: "entities",
  type: "status",
  id: 101,
  tags,
  skills,
  varConfigs: {},
  version: {
    from: "official",
    value: {
      predicate: "until",
      version: "v3.3.0",
    },
  },
});

const mockGameState = (
  characterSkills: SkillDefinition[],
  entitySkills: SkillDefinition[],
  entityTags: string[] = []
) => {
  const charDef = mockCharacterDef(characterSkills);
  const entityDef = mockEntityDef(entitySkills, entityTags);
  return {
    phase: "action",
    currentTurn: 0,
    players: [
      {
        characters: [
          {
            id: 1,
            definition: charDef,
            entities: [
              {
                id: 101,
                definition: entityDef,
                variables: {},
              },
            ],
            variables: {
              health: 10,
              energy: 0,
              maxHealth: 10,
              maxEnergy: 2,
              aura: 0,
              alive: 1,
            },
          },
        ],
        activeCharacterId: 1,
      },
    ],
  } as any;
};

test("isSkillDisabled should return true when disableSkill tag is present", () => {
  const state = mockGameState(
    [],
    [],
    ["disableSkill"]
  );
  const activeChar =
    state.players[0].characters[
      getActiveCharacterIndex(state.players[0])
    ];
  expect(isSkillDisabled(activeChar)).toBe(true);
});

test("findReplaceAction should return the correct skill", () => {
  const replaceActionSkill: SkillDefinition = {
    triggerOn: "replaceAction",
    action: () => [{} as any, {} as any],
    filter: (state, skillInfo, arg) => {
      const area = getEntityArea(state, skillInfo.caller.id);
      if (area.type !== "characters") {
        return false;
      }
      const char = new Character(state, area.characterId);
      return char.isActive() && !char.isSkillDisabled();
    },
    id: 10101,
    ownerType: "entity",
    type: "skill",
    usagePerRoundVariableName: null,
    initiativeSkillConfig: null,
  };
  const state = mockGameState([], [replaceActionSkill]);
  const skillInfo = findReplaceAction(state, new EventArg(state));
  expect(skillInfo).not.toBeNull();
  expect(skillInfo?.definition.id).toBe(10101);
});
