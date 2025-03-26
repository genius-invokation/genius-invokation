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
import { getNameSync } from "./names";

export type AnyData =
  | ActionCardRawData
  | CharacterRawData
  | EntityRawData
  | KeywordRawData
  | SkillRawData;

export interface GetDataOptions {}

export interface GetImageOptions {
  thumbnail?: boolean;
}

export interface Progress {
  current: number;
  total: number;
}

export interface PrepareForSyncOptions {
  includeImages?: boolean;
  imageProgressCallback?: (progress: Progress) => void;
}

export interface AssetsManagerOption {
  apiEndpoint: string;
}

export class AssetsManager {
  private dataCacheSync = new Map<number, AnyData>();
  private dataCache = new Map<number, Promise<AnyData>>();
  private imageCacheSync = new Map<number, Blob>();
  private imageCache = new Map<number, Promise<Blob>>();
  private readonly options: AssetsManagerOption;

  constructor(options: Partial<AssetsManagerOption> = {}) {
    this.options = {
      apiEndpoint: DEFAULT_ASSET_API_ENDPOINT,
      ...options,
    };
  }

  async getData(id: number, options: GetDataOptions = {}): Promise<AnyData> {
    if (id < 0) {
      return this.getKeyword(-id, options);
    }
    if (this.dataCacheSync.has(id)) {
      return this.dataCacheSync.get(id)!;
    }
    if (this.dataCache.has(id)) {
      return this.dataCache.get(id)!;
    }
    const url = `${this.options.apiEndpoint}/data/${id}`;
    const promise = fetch(url)
      .then((r) => r.json())
      .then((data) => {
        this.dataCacheSync.set(id, data);
        return data;
      });
    this.dataCache.set(id, promise);
    return promise;
  }

  async getKeyword(id: number, options: GetDataOptions = {}): Promise<AnyData> {
    if (this.dataCacheSync.has(-id)) {
      return this.dataCacheSync.get(-id)!;
    }
    if (this.dataCache.has(-id)) {
      return this.dataCache.get(-id)!;
    }
    const url = `${this.options.apiEndpoint}/data/${-id}`;
    const promise = fetch(url)
      .then((r) => r.json())
      .then((data) => {
        this.dataCacheSync.set(-id, data);
        return data;
      });
    this.dataCache.set(-id, promise);
    return promise;
  }

  async getImage(id: number, options: GetImageOptions = {}): Promise<Blob> {
    if (this.imageCacheSync.has(id)) {
      return this.imageCacheSync.get(id)!;
    }
    if (this.imageCache.has(id)) {
      return this.imageCache.get(id)!;
    }
    const url = `${this.options.apiEndpoint}/images/${id}${
      options.thumbnail ? "?thumb=1" : ""
    }`;
    const promise = fetch(url)
      .then((r) => r.blob())
      .then((blob) => {
        this.imageCacheSync.set(id, blob);
        return blob;
      });
    this.imageCache.set(id, promise);
    return promise;
  }

  async getImageUrl(
    id: number,
    options: GetImageOptions = {},
  ): Promise<string> {
    const blob = await this.getImage(id, options);
    return blobToDataUrl(blob);
  }

  getNameSync(id: number) {
    return getNameSync(id);
  }

  private prepareSyncRequested = false;
  async prepareForSync(options: PrepareForSyncOptions = {}): Promise<void> {
    if (this.prepareSyncRequested) {
      return;
    }
    this.prepareSyncRequested = true;
    const { apiEndpoint } = this.options;
    const dataUrl = `${apiEndpoint}/data`;
    const imageUrl = `${apiEndpoint}/images`;
    const dataPromise = fetch(dataUrl).then((r) => r.json());
    const imagePromise = options.includeImages
      ? fetch(imageUrl).then((r) => r.json())
      : {};
    const [data, images] = (await Promise.all([dataPromise, imagePromise])) as [
      AnyData[],
      Record<string, string>,
    ];

    // Data
    for (const d of data) {
      if (!this.dataCacheSync.has(d.id)) {
        this.dataCacheSync.set(d.id, d);
      }
    }

    // Images
    const imageIds = Object.keys(images);
    const total = imageIds.length;
    let current = 0;
    const imagePromises = imageIds.map(async (id) => {
      const url = `${DEFAULT_ASSET_API_ENDPOINT}/images/${id}`;
      const response = await fetch(url);
      const blob = await response.blob();
      this.imageCacheSync.set(Number(id), blob);
      current++;
      options.imageProgressCallback?.({ current, total });
    });
    await Promise.all(imagePromises);
  }

  getDataSync(id: number): AnyData {
    const data = this.dataCacheSync.get(id);
    if (!data) {
      throw new Error(`Data not found for ID ${id}`);
    }
    return data;
  }

  getImageSync(id: number): Blob {
    const image = this.imageCacheSync.get(id);
    if (!image) {
      throw new Error(`Image not found for ID ${id}`);
    }
    return image;
  }

  getImageUrlSync(id: number): string {
    const image = this.getImageSync(id);
    return blobToDataUrl(image);
  }
}
