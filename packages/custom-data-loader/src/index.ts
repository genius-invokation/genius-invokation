import { GameData, Version } from "@gi-tcg/core";
import {
  beginRegistration,
  endRegistration,
  card as cardInner,
  character as characterInner,
  combatStatus as combatStatusInner,
  extension as extensionInner,
  skill as skillInner,
  status as statusInner,
  summon as summonInner,
} from "@gi-tcg/core/builder";
import type { CustomData } from "@gi-tcg/assets-manager";

import getOfficialData from "@gi-tcg/data";

export { getOfficialData };

export class CustomDataLoader {
  private version?: Version;
  private customGameData: GameData[] = [];

  constructor() {}
  
  setVersion(version: Version): this {
    this.version = version;
    return this;
  }

  loadMod(...sources: string[]): this {
    return this;
  }
  
  getData(): GameData {
    const data = getOfficialData(this.version);

    return data;
  }

  getCustomData(): CustomData[] {
    throw "unimplemented";
  }
}
