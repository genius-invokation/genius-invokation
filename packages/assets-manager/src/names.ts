import namesJson from "./names.json" with { type: "json" };

export function getNameSync(id: number): string | undefined {
  const name = (namesJson as Record<number, string>)[id];
  return name;
}

export function getAllNamesSync(): Record<number, string> {
  return namesJson as Record<number, string>;
}
