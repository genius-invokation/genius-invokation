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

export * from "./dice";
export * from "./sharing";

export function flip(who: 0 | 1): 0 | 1 {
  return (1 - who) as 0 | 1;
}

export const PAIR_SYMBOL: unique symbol = Symbol("pair");

export function pair<T>(value: T): [T, T] {
  const ret: [T, T] = [value, value];
  Object.defineProperty(ret, PAIR_SYMBOL, { value: true });
  return ret;
}
