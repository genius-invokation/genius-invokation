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

// INTERNAL exports
// 为其他包提供一些内部接口，如 @gi-tcg/test, @gi-tcg/data-vscode-ext

export { builderWeakRefs } from "./registry";
export { CardBuilder } from "./card";
export {
  TriggeredSkillBuilder,
  InitiativeSkillBuilder,
  TechniqueBuilder,
} from "./skill";
export { EntityBuilder } from "./entity";
export { CharacterBuilder } from "./character";
export { ExtensionBuilder } from "./extension";
export { SkillContext } from "./context/skill";
export { EVENT_MAP } from "../base/skill";
