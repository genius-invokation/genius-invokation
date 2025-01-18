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
import type { AnyData, CommonOptions } from "./fetch";
import { blobToDataUrl } from "./data_url";

const allData = new Map<number, AnyData>();
const allImages = new Map<number, Blob>();

export interface Progress {
  current: number;
  total: number;
}

export interface PrepareForSyncOptions extends CommonOptions {
  includeImages?: boolean;
  imageProgressCallback?: (progress: Progress) => void;
}

export async function prepareForSync(
  options: PrepareForSyncOptions = {},
): Promise<void> {
  const assetsApiEndpoint =
    options?.assetsApiEndpoint ?? DEFAULT_ASSET_API_ENDPOINT;
  const dataUrl = `${assetsApiEndpoint}/data`;
  const imageUrl = `${assetsApiEndpoint}/images`;
  const dataPromise = fetch(dataUrl).then((r) => r.json());
  const imagePromise = options.includeImages
    ? fetch(imageUrl).then((r) => r.json())
    : {};
  const [data, images] = (await Promise.all([dataPromise, imagePromise])) as [
    AnyData[],
    Record<string, string>,
  ];

  // Data
  allData.clear();
  for (const d of data) {
    allData.set(d.id, d);
  }

  // Images
  allImages.clear();
  const imageIds = Object.keys(images);
  const total = imageIds.length;
  let current = 0;
  const imagePromises = imageIds.map(async (id) => {
    const url = `${DEFAULT_ASSET_API_ENDPOINT}/images/${id}`;
    const response = await fetch(url);
    const blob = await response.blob();
    allImages.set(Number(id), blob);
    current++;
    options.imageProgressCallback?.({ current, total });
  });
  await Promise.all(imagePromises);
}

export function getDataSync(id: number): AnyData {
  const data = allData.get(id);
  if (!data) {
    throw new Error(`Data not found for ID ${id}`);
  }
  return data;
}

export function getImageSync(id: number): Blob {
  const image = allImages.get(id);
  if (!image) {
    throw new Error(`Image not found for ID ${id}`);
  }
  return image;
}

export function getImageUrlSync(id: number): string {
  const image = getImageSync(id);
  return blobToDataUrl(image);
}
