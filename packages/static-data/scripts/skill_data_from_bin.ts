import { Glob } from "bun";
import { existsSync } from "node:fs";
import { stringify } from "smol-toml";

export const BIN_OUTPUT_GCG_BASE = `${process.env.GENSHIN_DATA}/BinOutput/GCG_DeclaredValueSet`;

if (!existsSync(BIN_OUTPUT_GCG_BASE)) {
  throw new Error(`BinOutput folder not exists`);
}

const PROP_SKILL_JSON = "JJJHHOACMPJ";
const PROP_DECLARED_VALUES = "EJOONJGDBOM";
const PROP_VALUE = "KDNFKACINCP";
const PROP_ELEMENT_TYPE = "ANPAMFKKFAL";

const KNOWN_VARS = {
  "476224977": "D__KEY__ELEMENT",
  "2234036858": "D__KEY__DAMAGE",
  "1428448537": "D__KEY__DAMAGE_2",
  "1428448538": "D__KEY__DAMAGE_3",
  "1428448539": "D__KEY__DAMAGE_4",
  "1428448540": "D__KEY__DAMAGE_5",
} as Record<string, string>;

const result: Record<string, Record<string, any>> = {};

for await (const filename of new Glob("*.json").scan(BIN_OUTPUT_GCG_BASE)) {
  try {
    const content = await Bun.file(`${BIN_OUTPUT_GCG_BASE}/${filename}`).json();
    if (!content[PROP_SKILL_JSON] || !content[PROP_DECLARED_VALUES]) {
      continue;
    }
    const skillJson = content[PROP_SKILL_JSON];
    const declaredValues = content[PROP_DECLARED_VALUES];
    const valueResult: Record<string, any> = {};
    for (const [key, value] of Object.entries<any>(declaredValues)) {
      if (!(key in KNOWN_VARS)) {
        continue;
      }
      let v: any;
      if (KNOWN_VARS[key] === "D__KEY__ELEMENT") {
        v = value[PROP_ELEMENT_TYPE] ?? "GCG_ELEMENT_PHYSIC";
      } else {
        v = value[PROP_VALUE];
      }
      if (v === undefined) {
        continue;
      }
      valueResult[KNOWN_VARS[key]] = v;
    }
    result[skillJson] = valueResult;
  } catch {
    continue;
  }
}

await Bun.write(`${import.meta.dirname}/skill_data.toml`, stringify(result) + '\n');
