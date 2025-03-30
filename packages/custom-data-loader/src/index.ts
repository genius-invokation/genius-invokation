import { GameData, Version } from "@gi-tcg/core";
import type { CustomData } from "@gi-tcg/assets-manager";

import getOfficialData from "@gi-tcg/data";
import { BuilderContext } from "./builder_context";

export { getOfficialData };

export class CustomDataLoader {
  private version?: Version;
  private nextId = 10_000_000;
  private customGameData: GameData[] = [];

  constructor() {}

  setVersion(version: Version): this {
    this.version = version;
    return this;
  }

  loadMod(...sources: string[]): this {
    for (const src of sources) {
      const fn = new Function("BuilderContext", src);
      const ctx = new BuilderContext(() => this.nextId++);
      const param = ctx.beginRegistration();
      fn(param);
      console.log(ctx.endRegistration());
    }
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
setInterval(() => {
  const loader = new CustomDataLoader();
  loader.loadMod(`
const { card, DamageType } = BuilderContext;

const MyCard = card("掀翻牌桌")
  .description("大人时代变了！")
  .damage(DamageType.Piercing, 10, "all opp character")
  .done();
`);
});
