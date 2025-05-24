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

const VOID_DICE_TYPE = 0; // 假设 DiceType.Void 为 0
const OMNI_DICE_TYPE: typeof DiceType.Omni = 8;
const ALIGNED_COST_KEY: typeof DiceType.Aligned = 8; // 用于需求 Map 中同色费用需求的键
const ENERGY_DICE_TYPE = 9; // 假设 DiceType.Energy 为 9

// 保留优先级：值越小，保留优先级越高（最后花费）
const KP_OMNI = 0;
const KP_ACTIVE_CHAR = 1;
const KP_OTHER_CHAR = 2;
const KP_REGULAR_ELEMENT = 3; // 对于非队伍、非万能的元素骰子 (类型 1-7)
const KP_FALLBACK = 4;       // 其他骰子类型的备用优先级

function getKeepPriority(
  diceType: DiceType,
  activeCharacterElement: DiceType | undefined,
  otherPartyMemberElements: readonly DiceType[] = [],
): number {
  if (diceType === OMNI_DICE_TYPE) return KP_OMNI;
  if (activeCharacterElement && diceType === activeCharacterElement) return KP_ACTIVE_CHAR;
  if (otherPartyMemberElements.includes(diceType)) return KP_OTHER_CHAR;

  // 标准元素骰子 (火元素到草元素，类型 1-7)
  if (diceType >= 1 && diceType <= 7) {
    return KP_REGULAR_ELEMENT;
  }
  
  return KP_FALLBACK; // 对于 VOID_DICE_TYPE 本身（如果被评估到）或其他未处理的类型
}

interface IndexedDie {
  type: DiceType;
  originalIndex: number;
  keepPriority: number;
}

interface InternalDieState extends IndexedDie {
  available: boolean;
}

/**
 * "智能"选骰算法（不检查能量），优先保留重要骰子。
 * @param required 卡牌或技能需要的骰子类型
 * @param dice 当前持有的骰子
 * @param activeCharacterElement 我方出战角色的骰子颜色 (elemental type 1-7)
 * @param otherPartyMemberElements 我方其他角色的骰子颜色 (elemental types 1-7)
 * @returns 布尔数组，被选择的骰子的下标对应元素设置为 `true`；如果无法选择则返回全 `false`。
 */
export function chooseDice(
  required: ReadonlyDiceRequirement,
  dice: readonly DiceType[],
  activeCharacterElement?: DiceType,
  otherPartyMemberElements?: readonly DiceType[],
): boolean[] {
  const FAIL_RESULT = Array<boolean>(dice.length).fill(false);
  const result = [...FAIL_RESULT];

  const initialDiceCounts = new Map<DiceType, number>();
  for (const d of dice) {
    initialDiceCounts.set(d, (initialDiceCounts.get(d) || 0) + 1);
  }

  const allIndexedDice: readonly IndexedDie[] = dice.map((d, i) => ({
    type: d,
    originalIndex: i,
    keepPriority: getKeepPriority(d, activeCharacterElement, otherPartyMemberElements),
  }));

  // 用于对待花费骰子进行排序的辅助函数
  // 排序依据：1. 保留优先级 (降序) 2. 该类型骰子数量 (升序) 3. 原始索引 (升序)
  const createSpendSorter = (countsMap: ReadonlyMap<DiceType, number>) => (a: IndexedDie, b: IndexedDie) => {
    if (a.keepPriority !== b.keepPriority) {
      return b.keepPriority - a.keepPriority; // 花费保留优先级最高的（保留价值最低的）
    }
    const countA = countsMap.get(a.type) || 0;
    const countB = countsMap.get(b.type) || 0;
    if (countA !== countB) {
      return countA - countB; // 从骰子数量较少的类型中花费
    }
    return a.originalIndex - b.originalIndex;
  };

  // 处理同色费用
  if (required.has(ALIGNED_COST_KEY)) {
    const requiredCount = required.get(ALIGNED_COST_KEY)!;
    if (requiredCount === 0) return result; 

    let bestSolutionIndices: number[] | null = null;
    let maxSpendScore = -Infinity; 

    const uniqueElementsInHand = [...new Set(dice.filter(d => d >= 1 && d <= 7 && d !== OMNI_DICE_TYPE))];
    const alignedSorter = createSpendSorter(initialDiceCounts); 

    for (const mainElement of uniqueElementsInHand) {
      const potentialDiceForThisSet = [...allIndexedDice]
        .filter(d => d.type === mainElement || d.type === OMNI_DICE_TYPE)
        .sort(alignedSorter); 

      if (potentialDiceForThisSet.length >= requiredCount) {
        const currentSelectionToSpend = potentialDiceForThisSet.slice(0, requiredCount);
        
        const typesInSelection = new Set(currentSelectionToSpend.map(d => d.type));
        let isValidAlignedSet = false;
        if (typesInSelection.size === 1 && typesInSelection.has(mainElement)) {
          isValidAlignedSet = true;
        } else if (typesInSelection.size === 2 && typesInSelection.has(mainElement) && typesInSelection.has(OMNI_DICE_TYPE)) {
          isValidAlignedSet = true;
        }

        if (isValidAlignedSet) {
            const currentSpendScore = currentSelectionToSpend.reduce((sum, d) => sum + d.keepPriority, 0);
            if (currentSpendScore > maxSpendScore) {
                maxSpendScore = currentSpendScore;
                bestSolutionIndices = currentSelectionToSpend.map(d => d.originalIndex);
            }
        }
      }
    }

    const omniDicePotential = [...allIndexedDice]
      .filter(d => d.type === OMNI_DICE_TYPE)
      .sort(alignedSorter); 
      
    if (omniDicePotential.length >= requiredCount) {
      const currentSelectionToSpend = omniDicePotential.slice(0, requiredCount);
      const currentSpendScore = currentSelectionToSpend.reduce((sum, d) => sum + d.keepPriority, 0); 
      if (currentSpendScore > maxSpendScore) { 
        maxSpendScore = currentSpendScore; 
        bestSolutionIndices = currentSelectionToSpend.map(d => d.originalIndex);
      }
    }
    
    if (bestSolutionIndices) {
      for (const index of bestSolutionIndices) {
        result[index] = true;
      }
      return result;
    }
    return FAIL_RESULT;
  }

  // 处理非同色费用
  const diceState: InternalDieState[] = allIndexedDice.map(d => ({ ...d, available: true }));

  const requiredArray = required
    .entries()
    .toArray()
    .flatMap(([k, v]) => Array.from({ length: v }, () => k as DiceType));

  for (const r of requiredArray) {
    if (r === ENERGY_DICE_TYPE) continue;

    let dieToSpend: InternalDieState | undefined;
    const availableDiceForThisTurn = diceState.filter(d => d.available);
    if (availableDiceForThisTurn.length === 0 && r !== VOID_DICE_TYPE && !required.has(VOID_DICE_TYPE)) {
        return FAIL_RESULT;
    }

    const currentAvailableCounts = new Map<DiceType, number>();
    availableDiceForThisTurn.forEach(d => {
      currentAvailableCounts.set(d.type, (currentAvailableCounts.get(d.type) || 0) + 1);
    });
    const nonAlignedSorter = createSpendSorter(currentAvailableCounts);

    if (r === VOID_DICE_TYPE) {
      const sortedAvailable = [...availableDiceForThisTurn].sort(nonAlignedSorter);
      dieToSpend = sortedAvailable[0];
    } else if (r === OMNI_DICE_TYPE) { 
      const candidates = [...availableDiceForThisTurn]
        .filter(d => d.type === OMNI_DICE_TYPE)
        .sort(nonAlignedSorter); 
      dieToSpend = candidates[0];
    } else { 
      const specificMatches = [...availableDiceForThisTurn]
        .filter(d => d.type === r)
        .sort(nonAlignedSorter); 
      
      const omniMatches = [...availableDiceForThisTurn]
        .filter(d => d.type === OMNI_DICE_TYPE)
        .sort(nonAlignedSorter); 

      if (specificMatches.length > 0) {
        dieToSpend = specificMatches[0];
      } else if (omniMatches.length > 0) {
        dieToSpend = omniMatches[0];
      }
    }

    if (dieToSpend) {
      result[dieToSpend.originalIndex] = true;
      const dieInState = diceState.find(d => d.originalIndex === dieToSpend!.originalIndex);
      if (dieInState) {
        dieInState.available = false;
      }
    } else {
      return FAIL_RESULT; 
    }
  }
  return result;
}

/**
 * "智能"选骰算法（不检查能量），优先保留重要骰子。
 * @param required 卡牌或技能需要的骰子类型
 * @param dice 当前持有的骰子
 * @param activeCharacterElement 我方出战角色的骰子颜色
 * @param otherPartyMemberElements 我方其他角色的骰子颜色
 * @returns 被选中的骰子
 */
export function chooseDiceValue(
  required: ReadonlyDiceRequirement,
  dice: readonly DiceType[],
  activeCharacterElement?: DiceType,
  otherPartyMemberElements?: readonly DiceType[],
): DiceType[] {
  const resultIndices = chooseDice(required, dice, activeCharacterElement, otherPartyMemberElements);
  return dice.filter((_, i) => resultIndices[i]);
}

// 为原始 checkDice 函数文本使用的常量别名
const VOID = VOID_DICE_TYPE;
const OMNI = OMNI_DICE_TYPE;
const ALIGNED = ALIGNED_COST_KEY;
const ENERGY = ENERGY_DICE_TYPE;

/**
 * 检查骰子是否符合要求（不检查能量）
 * @param required 卡牌或技能需要的骰子类型
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
