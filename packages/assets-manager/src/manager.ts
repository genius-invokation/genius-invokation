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
  PlayCost,
  SkillRawData,
} from "@gi-tcg/static-data";
import { blobToDataUrl } from "./data_url";
import { getAllNamesSync, getNameSync } from "./names";
import type { CustomData, CustomSkill } from "./custom_data";
import type {
  CardTag,
  CardType,
  CharacterTag,
  CommonSkillType,
  DiceRequirement,
  EntityType,
} from "@gi-tcg/core";
import { DiceType } from "@gi-tcg/typings";
import { getDeckData, getStaticDeckData, type DeckData } from "./deck_data";
import { DEFAULT_ASSETS_MANAGER } from "./index";

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
  customData: CustomData[];
}

export class AssetsManager {
  private readonly dataCacheSync = new Map<number, AnyData>();
  private readonly dataCache = new Map<number, Promise<AnyData>>();
  private readonly imageCacheSync = new Map<number, Blob>();
  private readonly imageCache = new Map<number, Promise<Blob>>();
  private readonly customDataNames = new Map<number, string>();
  private readonly customDataImageUrls = new Map<number, string>();
  private readonly options: AssetsManagerOption;

  constructor(options: Partial<AssetsManagerOption> = {}) {
    this.options = {
      apiEndpoint: DEFAULT_ASSET_API_ENDPOINT,
      customData: [],
      ...options,
    };
    for (const data of this.options.customData) {
      this.setupCustomData(data);
    }
  }

  private setupCustomData(data: CustomData) {
    const CHARACTER_TAG_MAP: Record<CharacterTag, string> = {
      cryo: "GCG_TAG_ELEMENT_CRYO",
      hydro: "GCG_TAG_ELEMENT_HYDRO",
      pyro: "GCG_TAG_ELEMENT_PYRO",
      electro: "GCG_TAG_ELEMENT_ELECTRO",
      anemo: "GCG_TAG_ELEMENT_ANEMO",
      geo: "GCG_TAG_ELEMENT_GEO",
      dendro: "GCG_TAG_ELEMENT_DENDRO",
      //
      bow: "GCG_TAG_WEAPON_BOW",
      claymore: "GCG_TAG_WEAPON_CLAYMORE",
      catalyst: "GCG_TAG_WEAPON_CATALYST",
      pole: "GCG_TAG_WEAPON_POLE",
      sword: "GCG_TAG_WEAPON_SWORD",
      otherWeapon: "GCG_TAG_WEAPON_NONE",
      //
      mondstadt: "GCG_TAG_NATION_MONDSTADT",
      liyue: "GCG_TAG_NATION_LIYUE",
      inazuma: "GCG_TAG_NATION_INAZUMA",
      sumeru: "GCG_TAG_NATION_SUMERU",
      fontaine: "GCG_TAG_NATION_FONTAINE",
      natlan: "GCG_TAG_NATION_NATLAN",
      // snezhnaya: "GCG_TAG_NATION_SNEZHNAYA",
      //
      hilichurl: "GCG_TAG_CAMP_HILICHURL",
      monster: "GCG_TAG_CAMP_MONSTER",
      fatui: "GCG_TAG_CAMP_FATUI",
      eremite: "GCG_TAG_CAMP_EREMITE",
      sacread: "GCG_TAG_CAMP_SACREAD",
      //
      pneuma: "GCG_TAG_ARKHE_PNEUMA",
      ousia: "GCG_TAG_ARKHE_OUSIA",
    };
    const SKILL_TYPE_MAP: Record<CommonSkillType | "passive", string> = {
      normal: "GCG_SKILL_TAG_A",
      elemental: "GCG_SKILL_TAG_E",
      burst: "GCG_SKILL_TAG_Q",
      technique: "GCG_SKILL_TAG_VEHICLE",
      passive: "GCG_SKILL_TAG_PASSIVE",
    };
    const CARD_TYPE_MAP: Record<CardType, string> = {
      equipment: "GCG_CARD_MODIFY",
      event: "GCG_CARD_EVENT",
      support: "GCG_CARD_ASSIST",
    };
    const CARD_TAG_MAP: Record<CardTag, string> = {
      weapon: "GCG_TAG_WEAPON",
      bow: "GCG_TAG_WEAPON_BOW",
      catalyst: "GCG_TAG_WEAPON_CATALYST",
      claymore: "GCG_TAG_WEAPON_CLAYMORE",
      pole: "GCG_TAG_WEAPON_POLE",
      sword: "GCG_TAG_WEAPON_SWORD",
      artifact: "GCG_TAG_ARTIFACT",
      talent: "GCG_TAG_TALENT",
      legend: "GCG_TAG_LEGEND",
      food: "GCG_TAG_FOOD",
      resonance: "GCG_TAG_RESONANCE",
      place: "GCG_TAG_PLACE",
      ally: "GCG_TAG_ALLY",
      item: "GCG_TAG_ITEM",
      technique: "GCG_TAG_VEHICLE",
      action: "GCG_TAG_SLOWLY",
      noTuning: "",
    };
    const ENTITY_TYPE_MAP: Record<EntityType, string> = {
      combatStatus: "GCG_CARD_ONSTAGE",
      status: "GCG_CARD_STATE",
      equipment: "GCG_CARD_MODIFY",
      summon: "GCG_CARD_SUMMON",
      support: "GCG_CARD_ASSIST",
    };
    const COST_TYPE_MAP: Record<DiceType, string> = {
      [DiceType.Void]: "GCG_COST_DICE_VOID",
      [DiceType.Cryo]: "GCG_COST_DICE_CRYO",
      [DiceType.Hydro]: "GCG_COST_DICE_HYDRO",
      [DiceType.Pyro]: "GCG_COST_DICE_PYRO",
      [DiceType.Electro]: "GCG_COST_DICE_ELECTRO",
      [DiceType.Anemo]: "GCG_COST_DICE_ANEMO",
      [DiceType.Geo]: "GCG_COST_DICE_GEO",
      [DiceType.Dendro]: "GCG_COST_DICE_DENDRO",
      [DiceType.Aligned]: "GCG_COST_DICE_ALIGNED",
      [DiceType.Energy]: "GCG_COST_ENERGY",
      [DiceType.Legend]: "GCG_COST_LEGEND",
    };
    const genCost = (cost: DiceRequirement, isLegend: boolean): PlayCost[] => {
      const result: PlayCost[] = [];
      for (const [type, count] of cost) {
        result.push({
          type: COST_TYPE_MAP[type],
          count,
        });
      }
      if (isLegend) {
        result.push({
          type: "GCG_COST_LEGEND",
          count: 1,
        });
      }
      return result;
    };
    const setupSkill = (input: CustomSkill[]): SkillRawData[] => {
      const skills: SkillRawData[] = [];
      for (const skill of input) {
        const data: SkillRawData = {
          id: skill.id,
          type: SKILL_TYPE_MAP[skill.type],
          name: skill.name,
          englishName: "",
          rawDescription: skill.rawDescription,
          description: "",
          playCost: genCost(skill.playCost, false),
          targetList: [],
        };
        this.dataCacheSync.set(skill.id, data);
        this.customDataNames.set(skill.id, skill.name);
        this.customDataImageUrls.set(skill.id, skill.skillIconUrl);
        skills.push(data);
      }
      return skills;
    };
    for (const ch of data.characters) {
      const data: CharacterRawData = {
        // @ts-expect-error
        category: "characters",
        id: ch.id,
        name: ch.name,
        englishName: "",
        hp: ch.hp,
        maxEnergy: ch.maxEnergy,
        tags: ch.tags.map((tag) => CHARACTER_TAG_MAP[tag]),
        cardFace: "",
        icon: "",
        obtainable: ch.obtainable,
        skills: setupSkill(ch.skills),
      };
      this.dataCacheSync.set(ch.id, data);
      this.customDataNames.set(ch.id, ch.name);
      this.customDataImageUrls.set(ch.id, ch.cardFaceUrl);
    }
    for (const ac of data.actionCards) {
      const data: ActionCardRawData = {
        // @ts-expect-error
        category: "action_cards",
        id: ac.id,
        type: CARD_TYPE_MAP[ac.type],
        name: ac.name,
        englishName: "",
        rawDescription: ac.rawDescription,
        description: "",
        cardFace: "",
        obtainable: ac.obtainable,
        tags: ac.tags.map((tag) => CARD_TAG_MAP[tag]),
        playCost: genCost(ac.playCost, false),
        targetList: [],
        relatedCharacterId: null,
        relatedCharacterTags: [],
      };
      this.dataCacheSync.set(ac.id, data);
      this.customDataNames.set(ac.id, ac.name);
      this.customDataImageUrls.set(ac.id, ac.cardFaceUrl);
    }
    for (const et of data.entities) {
      const data: EntityRawData = {
        // @ts-expect-error
        category: "entities",
        id: et.id,
        type: ENTITY_TYPE_MAP[et.type],
        name: et.name,
        englishName: "",
        tags: [],
        skills: setupSkill(et.skills),
        rawDescription: et.rawDescription,
        description: "",
        hidden: false,
      };
      this.dataCacheSync.set(et.id, data);
      this.customDataNames.set(et.id, et.name);
      this.customDataImageUrls.set(et.id, et.cardFaceOrBuffIconUrl);
    }
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
    const url =
      this.customDataImageUrls.get(id) ??
      `${this.options.apiEndpoint}/images/${id}${
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
    if (this.customDataImageUrls.has(id)) {
      return this.customDataImageUrls.get(id)!;
    }
    const blob = await this.getImage(id, options);
    return blobToDataUrl(blob);
  }

  getNameSync(id: number) {
    return this.customDataNames.get(id) ?? getNameSync(id);
  }

  async prepareForSync(options: PrepareForSyncOptions = {}): Promise<void> {
    if (this.preparedSyncData) {
      return this.preparedSyncData;
    }
    await this.prepareSyncData();
    if (options.includeImages) {
      if (this.preparedSyncImages) {
        return this.preparedSyncImages;
      }
      await this.prepareSyncImages(options.imageProgressCallback);
    }
  }

  private preparedSyncData: Promise<void> | undefined;
  private prepareSyncData() {
    return (this.preparedSyncData ??= (async () => {
      const dataUrl = `${this.options.apiEndpoint}/data`;
      const data = await fetch(dataUrl).then((r) => r.json());
      // Data
      for (const d of data) {
        if (!this.dataCacheSync.has(d.id)) {
          this.dataCacheSync.set(d.id, d);
        }
      }
    })());
  }

  private preparedSyncImages: Promise<void> | undefined;
  private prepareSyncImages(progressCallback?: (progress: Progress) => void) {
    return (this.preparedSyncImages ??= (async () => {
      const imageUrl = `${this.options.apiEndpoint}/images`;
      const images = await fetch(imageUrl).then((r) => r.json());
      const imageUrls = [
        ...Object.keys(images).map(
          (id) =>
            [Number(id), `${DEFAULT_ASSET_API_ENDPOINT}/images/${id}`] as const,
        ),
        ...this.customDataImageUrls.entries(),
      ];
      const total = imageUrls.length;
      let current = 0;
      const imagePromises = imageUrls.map(async ([id, url]) => {
        const response = await fetch(url);
        const blob = await response.blob();
        this.imageCacheSync.set(Number(id), blob);
        current++;
        progressCallback?.({ current, total });
      });
      await Promise.all(imagePromises);
    })());
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

  async getDeckData(): Promise<DeckData> {
    if (this === DEFAULT_ASSETS_MANAGER) {
      return getStaticDeckData();
    }
    await this.prepareForSync();
    const characters = this.dataCacheSync
      .values()
      .filter((data: any) => data.category === "characters")
      .toArray() as CharacterRawData[];
    const actionCards = this.dataCacheSync
      .values()
      .filter((data: any) => data.category === "action_cards")
      .toArray() as ActionCardRawData[];
    return getDeckData(characters, actionCards);
  }
}
