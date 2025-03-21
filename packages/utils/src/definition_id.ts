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

export type DefinitionIdStr = `${string}:${number}`

export function definitionIdStr(id: number, namespace: string): DefinitionIdStr {
  return `${namespace}:${id}`;
}

export function parseDefinitionIdStr(defId: DefinitionIdStr): [id: number, namespace: string] {
  const [modName, id] = defId.split(":");
  if (!id || isNaN(Number(id))) {
    throw new Error(`Invalid definition id: ${defId}`);
  }
  return [Number(id), modName];
}
