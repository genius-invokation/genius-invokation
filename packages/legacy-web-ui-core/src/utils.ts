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

import { createSignal, Accessor } from "solid-js";

export function createWaitNotify<T = unknown>(): [
  waiting: Accessor<boolean>,
  wait: () => Promise<T>,
  notify: (value: T) => void,
] {
  const [waiting, setWaiting] = createSignal(false);
  let resolve: (value: T) => void = () => {};
  const wait = () => {
    setWaiting(true);
    return new Promise<T>((r) => {
      resolve = r;
    });
  };
  const notify = (value: T) => {
    setWaiting(false);
    return resolve(value);
  };
  return [waiting, wait, notify];
}

export function groupBy<T, K>(list: T[], getKey: (item: T) => K): Map<K, T[]> {
  return list.reduce((result, item) => {
    const key = getKey(item);
    const collection = result.get(key);
    if (!collection) {
      result.set(key, [item]);
    } else {
      collection.push(item);
    }
    return result;
  }, new Map<K, T[]>());
}
