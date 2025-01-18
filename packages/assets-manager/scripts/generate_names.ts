import { characters, actionCards, entities } from "@gi-tcg/static-data";

const skills = characters.flatMap((character) => character.skills);

const result = Object.fromEntries(
  [...characters, ...skills, ...actionCards, ...entities].map((e) => [
    e.id,
    e.name,
  ]),
);

await Bun.write(
  `${import.meta.dirname}/../src/names.json`,
  JSON.stringify(result, null, 2),
);
