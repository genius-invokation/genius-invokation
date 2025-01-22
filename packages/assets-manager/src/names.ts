import namesJson from "./names.json" with { type: "json" };

export const KEYWORD_ID_OFFSET = 60_000_000;

export function getNameSync(id: number): string | undefined {
  const name = (namesJson as Record<string, string>)[id];
  return name;
}
