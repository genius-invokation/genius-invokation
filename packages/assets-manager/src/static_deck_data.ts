import staticDeckData from "./deck_data.json" with { type: "json" };

export function getStaticDeckData(): DeckData {
  return {
    allTags: staticDeckData.allTags,
    allTypes: staticDeckData.allTypes,
    allVersions: staticDeckData.allVersions,
    characters: new Map(
      Object.entries(staticDeckData.characters).map(([id, ch]) => [
        Number(id),
        ch,
      ]),
    ),
    actionCards: new Map(
      Object.entries(staticDeckData.actionCards).map(([id, ac]) => [
        Number(id),
        ac,
      ]),
    ),
  };
}
