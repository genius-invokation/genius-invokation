import {
  characters,
  actionCards,
  entities,
  keywords,
} from "@gi-tcg/static-data";


const result = Object.fromEntries([
  ...[...characters, ...actionCards, ...entities].flatMap((e) => [
    [e.id, e.name],
    ...("skills" in e ? e.skills.map((s) => [s.id, s.name]) : []),
  ]),
  ...keywords.map((e) => [-e.id, e.name]),
]);

await Bun.write(
  `${import.meta.dirname}/../src/names.json`,
  JSON.stringify(result, null, 2),
);
