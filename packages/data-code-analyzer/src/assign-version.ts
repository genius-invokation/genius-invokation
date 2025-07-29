import { CURRENT_VERSION, Version } from "@gi-tcg/core";
import entityDependency_ from "../dist/deps.json";
import { MOYU_S7_VERSIONS } from "./moyu-s7-version";
const entityDependency = new Map<number, number[]>(
  Object.entries(entityDependency_ as Record<number, number[]>).map(
    ([k, v]) => [Number(k), v] as const,
  ),
);

interface VersionAssignment {
  strong?: Version;
  weak?: Version;
  weakFromIds?: number[];
}

export const assignVersion = (
  baseVersion: Version,
  versions: Record<number, Version>,
): Record<number, Version> => {
  const result = new Map<number, VersionAssignment>();
  for (const [id] of entityDependency) {
    result.set(id, {
      strong: versions[id],
    });
  }
  const applyWeak = (id: number, version: Version, fromIds: number[]) => {
    const et = result.get(id);
    if (!et) {
      return;
    }
    if (et.strong) {
      return;
    }
    if (fromIds.includes(id)) {
      return;
    }
    if (!et.weak) {
      et.weak = version;
      et.weakFromIds = fromIds;
    } else if (et.weak !== version) {
      throw new Error(
        `Entity ${id} has conflicting weak versions: ${et.weak} (from ${et.weakFromIds}) vs ${version} (from ${fromIds})`,
      );
    }
    for (const subId of entityDependency.get(id) ?? []) {
      applyWeak(subId, version, [...fromIds, id]);
    }
  };
  for (const [id, version] of Object.entries(versions)) {
    applyWeak(Number(id), version, []);
  }
  return Object.fromEntries(
    result.entries().map(([id, { strong, weak }]) => {
      return [id, strong ?? weak ?? baseVersion];
    }),
  );
};

const assignResult = assignVersion(CURRENT_VERSION, MOYU_S7_VERSIONS);
// @ts-expect-error
assignResult["$base"] = CURRENT_VERSION;

await Bun.write(
  `${import.meta.dirname}/../dist/moyu-7s-versions.json`,
  JSON.stringify(assignResult, null, 2),
);
