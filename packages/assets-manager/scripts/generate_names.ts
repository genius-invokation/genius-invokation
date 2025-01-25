import {
  characters,
  actionCards,
  entities,
  keywords,
} from "@gi-tcg/static-data";

const KEYWORD_ID_OFFSET = 60_000_000;

const result = Object.fromEntries([
  ...[...characters, ...actionCards, ...entities].flatMap((e) => [
    [e.id, e.name],
    ...("skills" in e ? e.skills.map((s) => [s.id, s.name]) : []),
  ]),
  ...keywords.map((e) => [e.id + KEYWORD_ID_OFFSET, e.name]),
]);

await Bun.write(
  `${import.meta.dirname}/../src/names.json`,
  JSON.stringify(result, null, 2),
);
