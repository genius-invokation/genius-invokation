import type { ActionCardRawData, CharacterRawData } from "./data_types";

export interface DeckDataCharacterInfo {
  id: number;
  name: string;
  tags: string[];
  version: number;
}

export interface DeckDataActionCardInfo {
  id: number;
  type: string;
  tags: string[];
  version: number;
  name: string;
  relatedCharacterId: number | null;
  relatedCharacterTag: string | null;
}

export interface DeckData {
  allTags: string[];
  allTypes: string[];
  allVersions: string[];
  characters: Map<number, DeckDataCharacterInfo>;
  actionCards: Map<number, DeckDataActionCardInfo>;
}

export function getDeckData(
  characters: CharacterRawData[],
  actionCards: ActionCardRawData[],
): DeckData {
  const chs = characters.filter((ch) => ch.obtainable);
  const acs = actionCards.filter((ac) => ac.obtainable);

  const allTags = [...new Set([...chs, ...acs].flatMap((x) => x.tags))];

  const allTypes = [...new Set([...acs.map((ac) => ac.type)])];
  const allVersions = [
    ...new Set([...chs, ...acs].map((x) => x.sinceVersion ?? "v3.3.0")),
  ].toSorted();

  return {
    allTags,
    allTypes,
    allVersions,
    characters: new Map(
      chs.map((ch) => [
        ch.id,
        {
          id: ch.id,
          name: ch.name,
          tags: ch.tags,
          version: allVersions.indexOf(ch.sinceVersion!),
        },
      ]),
    ),
    actionCards: new Map(
      acs.map((ac) => [
        ac.id,
        {
          id: ac.id,
          type: ac.type,
          tags: ac.tags,
          version: allVersions.indexOf(ac.sinceVersion!),
          name: ac.name,
          relatedCharacterId: ac.relatedCharacterId,
          relatedCharacterTag: (() => {
            const t = ac.relatedCharacterTags;
            if (t.length === 0) return null;
            else if (t.length !== 2 || t[0] !== t[1]) {
              throw new Error(`unsupported now`);
            } else {
              return t[0]!;
            }
          })(),
        },
      ]),
    ),
  };
}
