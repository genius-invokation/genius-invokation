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

import { DEFAULT_ASSET_API_ENDPOINT } from "@gi-tcg/config";
import type {
  ActionCardRawData,
  CharacterRawData,
  EntityRawData,
  KeywordRawData,
  SkillRawData,
} from "@gi-tcg/static-data";
import { blobToDataUrl } from "./data_url";
import { KEYWORD_ID_OFFSET } from "./names";

export type AnyData =
  | ActionCardRawData
  | CharacterRawData
  | EntityRawData
  | KeywordRawData
  | SkillRawData;

export interface CommonOptions {
  assetsApiEndpoint?: string;
}

export interface GetDataOptions extends CommonOptions {}

const cache = new Map<string, Promise<any>>();

export async function getData(
  id: number,
  options: GetDataOptions = {},
): Promise<AnyData> {
  if (id >= KEYWORD_ID_OFFSET) {
    return getKeyword(id - KEYWORD_ID_OFFSET, options);
  }
  const url = `${
    options.assetsApiEndpoint ?? DEFAULT_ASSET_API_ENDPOINT
  }/data/${id}`;
  if (cache.has(url)) {
    return cache.get(url);
  }
  const promise = fetch(url).then((r) => r.json());
  cache.set(url, promise);
  return promise;
}

export async function getKeyword(
  id: number,
  options: GetDataOptions = {},
): Promise<AnyData> {
  const url = `${
    options.assetsApiEndpoint ?? DEFAULT_ASSET_API_ENDPOINT
  }/data/K${id}`;
  if (cache.has(url)) {
    return cache.get(url);
  }
  const promise = fetch(url).then((r) => r.json());
  cache.set(url, promise);
  return promise;
}

export interface GetImageOptions extends CommonOptions {
  thumbnail?: boolean;
}

export async function getImage(
  id: number,
  options: GetImageOptions = {},
): Promise<Blob> {
  const url = `${
    options.assetsApiEndpoint ?? DEFAULT_ASSET_API_ENDPOINT
  }/images/${id}${options.thumbnail ? "?thumb=1" : ""}`;
  if (cache.has(url)) {
    return cache.get(url);
  }
  const promise = fetch(url).then((r) => r.blob());
  cache.set(url, promise);
  return promise;
}

export async function getImageUrl(
  id: number,
  options: GetImageOptions = {},
): Promise<string> {
  const blob = await getImage(id, options);
  return blobToDataUrl(blob);
}
