// Copyright (C) 2024 Guyutongxue
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

import { createResource } from "solid-js";
import { usePlayerContext } from "./Chessboard";

const cache = new Map<string, Promise<string>>();
export function cached(url: string) {
  if (cache.has(url)) {
    return cache.get(url)!;
  } else {
    const result = fetch(url)
      .then((res) => (res.ok ? res.blob() : Promise.reject(res)))
      .then((blob) => URL.createObjectURL(blob));
    cache.set(url, result);
    return result;
  }
}

const dataStore = new Map<number, any>();

export function createAssetsData(definitionId: () => number) {
  const { assetApiEndpoint } = usePlayerContext();
  return createResource(definitionId, async (definitionId) => {
    if (dataStore.has(definitionId)) {
      return dataStore.get(definitionId);
    }
    const data = fetch(`${assetApiEndpoint()}/data/${definitionId}`).then((r) =>
      r.json(),
    );
    dataStore.set(definitionId, data);
    return data;
  });
}
