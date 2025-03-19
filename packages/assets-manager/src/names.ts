import namesJson from "./names.json" with { type: "json" };

export function getNameSync(id: number): string | undefined {
  const name = (namesJson as Record<string, string>)[id];
  return name;
}
