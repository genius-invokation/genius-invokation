import { getDeckData } from "../src/deck_data";
import { characters, actionCards } from "@gi-tcg/static-data";

const mapReplacer = (key: string, value: any) => {
  if (value instanceof Map) {
    return Object.fromEntries(value.entries());
  }
  return value;
};

await Bun.write(
  `${import.meta.dirname}/../src/deck_data.json`,
  JSON.stringify(getDeckData(characters, actionCards), mapReplacer),
);
