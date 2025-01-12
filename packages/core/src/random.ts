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

/**
 * This file contains a simple implementation of "minstd" Linear Congruential Generator.
 */

const A = 48271; // "minstd"
const C = 0;
const M = 2147483647; // 2^31 - 1

/**
 * Random integer in [0, 2147483647)
 */
export function randomSeed() {
  return Math.floor(Math.random() * M);
}

export function nextRandom(x: number) {
  return (A * x + C) % M;
}
