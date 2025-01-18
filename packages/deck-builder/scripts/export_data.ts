import { characters, actionCards } from "@gi-tcg/static-data";

const chs = characters.filter((ch) => typeof ch.shareId !== "undefined");
const acs = actionCards.filter((ac) => typeof ac.shareId !== "undefined");

const allTags = [...new Set([...chs, ...acs].flatMap((x) => x.tags))];

const allTypes = [...new Set([...acs.map((ac) => ac.type)])];
const allVersions = [
  ...new Set([...chs, ...acs].map((x) => x.sinceVersion!)),
].toSorted(Bun.semver.order);

const data = {
  T: allTags,
  Y: allTypes,
  v: allVersions,
  c: chs.map((ch) => ({
    i: ch.id,
    n: ch.name,
    t: ch.tags.map((t) => allTags.indexOf(t)),
    v: allVersions.indexOf(ch.sinceVersion!),
  })),
  a: acs.map((ac) => ({
    i: ac.id,
    y: allTypes.indexOf(ac.type),
    t: ac.tags.map((t) => allTags.indexOf(t)),
    v: allVersions.indexOf(ac.sinceVersion!),
    n: ac.name,
    rc: ac.relatedCharacterId ?? void 0,
    rt: (() => {
      const t = ac.relatedCharacterTags;
      if (t.length === 0) return void 0;
      else if (t.length !== 2 || t[0] !== t[1]) {
        throw new Error(`unsupported now`);
      } else {
        return allTags.indexOf(t[0]);
      }
    })(),
  })),
};

await Bun.write(
  `${import.meta.dirname}/../src/data.json`,
  JSON.stringify(data),
);
