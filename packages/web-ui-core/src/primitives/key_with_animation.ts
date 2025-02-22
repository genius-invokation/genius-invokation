// Copyright (C) 2025 Guyutongxue
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

/* eslint-disable solid/reactivity */

import {
  type Accessor,
  createMemo,
  createRoot,
  createSignal,
  type JSX,
  onCleanup,
  type Setter,
  untrack,
} from "solid-js";
import type { UiState } from "../ui_state";

function dispose(list: Iterable<{ dispose: VoidFunction }>) {
  for (const o of list) o.dispose();
}

type AnimatingElement = { id: number; uiState: UiState };
export type UpdateSignal = { force: boolean };

function keyArray<T extends AnimatingElement, U, K>(
  items: Accessor<readonly T[]>,
  keyFn: (item: T, index: number) => K,
  mapFn: (v: Accessor<T>, i: Accessor<number>) => U,
  updateSignal: Accessor<UpdateSignal>,
): Accessor<U[]> {
  type Save = {
    setItem: Setter<T>;
    setIndex?: Setter<number>;
    mapped: U;
    dispose: () => void;
  };

  const prev = new Map<K, Save>();
  onCleanup(() => dispose(prev.values()));

  return () => {
    const { force: isForceUpdate } = updateSignal();

    return untrack(() => {
      const list = items() || [];
      const result = new Array<U>(list.length);

      // fast path for new create
      if (!prev.size) {
        for (let i = 0; i < list.length; i++) {
          const item = list[i]!;
          const key = keyFn(item, i);
          addNewItem(result, item, i, key);
        }
        return result;
      }

      const prevKeys = new Set(prev.keys());

      for (let i = 0; i < list.length; i++) {
        const item = list[i]!;
        const key = keyFn(item, i);
        prevKeys.delete(key);
        const lookup = prev.get(key);

        if (lookup) {
          result[i] = lookup.mapped;
          lookup.setIndex?.(i);
          lookup.setItem((prev) => {
            if (!isForceUpdate && prev.uiState.isAnimating) {
              return prev;
            } else {
              return item;
            }
          });
        } else {
          addNewItem(result, item, i, key);
        }
      }

      for (const key of prevKeys) {
        prev.get(key)?.dispose();
        prev.delete(key);
      }

      return result;
    });
  };

  function addNewItem(list: U[], item: T, i: number, key: K): void {
    createRoot((dispose) => {
      const [getItem, setItem] = createSignal(item);
      const save = { setItem, dispose } as Save;
      if (mapFn.length > 1) {
        const [index, setIndex] = createSignal(i);
        save.setIndex = setIndex;
        save.mapped = mapFn(getItem, index);
      } else {
        save.mapped = (mapFn as any)(getItem);
      }
      prev.set(key, save);
      list[i] = save.mapped;
    });
  }
}

/**
 * 这里参照 `@solid-primitives/keyed` 库里的 `<Key>`，实现了手动触发更新的 `<KeyWithAnimation>`：
 * ```tsx
 * <KeyWithAnimation each={items} updateWhen={updateSignal}>
 *   {(value, item) => ...}
 * </KeyWithAnimation>
 * ```
 * 
 * 其中 `each` 需要传入满足
 * 
 * ```ts
 * interface AnimatingElement {
 *   id: number;
 *   uiState: { isAnimating: boolean };
 * }
 * ```
 * 
 * 的数据数组，`id` 为数据的键（将对应元素绑定到惟一 DOM 上更新），`isAnimating` 指定该元素是否处在动画中。
 * 
 * 整个数组的重渲染不由 `each` Signal 触发，而是由 `updateWhen` Signal 触发；当 `updateWhen` 更新的
 * `force` 指为 `false` 时，正在动画中的元素不会被重新渲染（即动画不会被非强制的更新打断）；惟有强制的更新才会更新动画状态的元素。
 * 
 * 使用时，当：
 * - `<Chessboard>` 中的 `data` 发生更新（即收到了新的 `notification`），设置 `each` 并触发一次强制更新；
 * - 对于 `<Chessboard>` 内部的 UI 布局更新（如视窗 resize、手牌展开与否），设置 `each` 并触发一次非强制的更新；
 * 此时未在动画中的元素会更新到新位置，而动画中的元素不会被打断也不会重新触发动画。
 * 
 * ```
 */
export function KeyWithAnimation<T extends AnimatingElement>(props: {
  each: readonly T[];
  updateWhen: UpdateSignal;
  children: (v: Accessor<T>, i: Accessor<number>) => JSX.Element;
}): JSX.Element {
  return createMemo(
    keyArray<T, JSX.Element, number>(
      () => props.each,
      (v: T) => v.id,
      props.children,
      () => props.updateWhen,
    ),
  ) as unknown as JSX.Element;
}
