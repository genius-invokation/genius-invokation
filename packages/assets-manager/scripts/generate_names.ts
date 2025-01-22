import {
  characters,
  actionCards,
  entities,
  keywords,
} from "@gi-tcg/static-data";

const skills = characters.flatMap((character) => character.skills);

const KEYWORD_ID_OFFSET = 60_000_000;

const result = Object.fromEntries([
  ...[...characters, ...skills, ...actionCards, ...entities].map((e) => [
    e.id,
    e.name,
  ]),
  ...keywords.map((e) => [e.id + KEYWORD_ID_OFFSET, e.name]),
]);

await Bun.write(
  `${import.meta.dirname}/../src/names.json`,
  JSON.stringify(result, null, 2),
);
