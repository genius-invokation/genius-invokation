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

import type { DiceType, ReadonlyDiceRequirement } from "@gi-tcg/typings";

const VOID = 0;
const OMNI: typeof DiceType.Omni = 8;
const ALIGNED: typeof DiceType.Aligned = 8;
const ENERGY = 9;

/**
 * "智能"选骰算法（不检查能量）
 * @param required 卡牌或技能需要的骰子类型
 * @param dice 当前持有的骰子
 * @returns 布尔数组，被选择的骰子的下标对应元素设置为 `true`；如果无法选择则返回全 `false`。
 */
export function chooseDice(
  required: ReadonlyDiceRequirement,
  dice: readonly DiceType[],
): boolean[] {
  const OMNI_COUNT = dice.filter((d) => d === OMNI).length;
  const FAIL_RESULT = Array<boolean>(dice.length).fill(false);
  const result = [...FAIL_RESULT];
  // 需要同色骰子
  if (required.has(ALIGNED)) {
    const requiredCount = required.get(ALIGNED)!;
    // 杂色骰子+万能骰子，凑够同色
    for (let i = dice.length - 1; i >= 0; i--) {
      if (dice[i] === OMNI) continue;
      const thisCount = dice.filter((d) => d === dice[i]).length;
      if (thisCount + OMNI_COUNT < requiredCount) continue;
      for (
        let j = dice.length - 1, count = 0;
        count < requiredCount && j >= 0;
        j--
      ) {
        if (dice[j] === OMNI || dice[j] === dice[i]) {
          result[j] = true;
          count++;
        }
      }
      return result;
    }
    // ……或者只用万能骰子凑
    if (OMNI_COUNT >= requiredCount) {
      for (let i = dice.length - 1, count = 0; count < requiredCount; i--) {
        if (dice[i] === OMNI) {
          result[i] = true;
          count++;
        }
      }
      return result;
    }
    return FAIL_RESULT;
  }
  const requiredArray = required
    .entries()
    .toArray()
    .flatMap(([k, v]) => Array.from({ length: v }, () => k));
  // 无色或者杂色
  next: for (const r of requiredArray) {
    if (r === ENERGY) continue;
    if (r === VOID) {
      // 无色：任何骰子都可以
      for (let j = dice.length - 1; j >= 0; j--) {
        if (!result[j]) {
          result[j] = true;
          continue next;
        }
      }
    } else {
      // 对应颜色或者万能骰子
      for (let j = 0; j < dice.length; j++) {
        if (!result[j] && dice[j] === r) {
          result[j] = true;
          continue next;
        }
      }
      for (let j = 0; j < dice.length; j++) {
        if (!result[j] && dice[j] === OMNI) {
          result[j] = true;
          continue next;
        }
      }
    }
    return FAIL_RESULT;
  }
  return result;
}

/**
 * "智能"选骰算法（不检查能量）
 * @param required 卡牌或技能需要的骰子类型
 * @param dice 当前持有的骰子
 * @returns 被选中的骰子
 */
export function chooseDiceValue(
  required: ReadonlyDiceRequirement,
  dice: readonly DiceType[],
): DiceType[] {
  const result = chooseDice(required, dice);
  return dice.filter((_, i) => result[i]);
}

/**
 * 检查骰子是否符合要求（不检查能量）
 * @param required 卡牌或技能需要的骰子类型
 * @param dice 当前持有的骰子
 * @param chosen 已选择的骰子
 * @returns 是否符合要求
 */
export function checkDice(
  required: ReadonlyDiceRequirement,
  chosen: readonly DiceType[],
): boolean {
  // 如果需要同色骰子
  if (required.has(ALIGNED)) {
    const requiredCount = required.get(ALIGNED)!;
    // 检查个数
    if (requiredCount !== chosen.length) return false;
    const chosenMap = new Set<DiceType>(chosen);
    // 完全同色，或者只有杂色+万能两种骰子
    return (
      (chosenMap.size === 0 && requiredCount === 0) ||
      chosenMap.size === 1 ||
      (chosenMap.size === 2 && chosenMap.has(OMNI))
    );
  }
  const requiredArray = required
    .entries()
    .flatMap(([k, v]) => Array.from({ length: v }, () => k))
    .toArray();
  // 否则逐个检查杂色/无色
  const chosen2 = [...chosen];
  let voidCount = 0;
  for (const r of requiredArray) {
    if (r === ENERGY) continue;
    // 记录无色的个数，最后检查剩余个数是否一致
    if (r === VOID) {
      voidCount++;
      continue;
    }
    // 杂色：找到一个删一个
    const index = chosen2.indexOf(r);
    if (index === -1) {
      const omniIndex = chosen2.indexOf(OMNI);
      if (omniIndex === -1) return false;
      chosen2.splice(omniIndex, 1);
      continue;
    }
    chosen2.splice(index, 1);
  }
  return chosen2.length === voidCount;
}
