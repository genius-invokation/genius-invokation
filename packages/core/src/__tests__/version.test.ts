import { test, expect } from "bun:test";
import { type WithVersionInfo, getCorrectVersion } from "../base/version";
import "../utils";

test("find version", () => {
  const versions: (WithVersionInfo & { id: number })[] = [
    {
      id: 999,
      version: {
        predicate: "since",
        version: "v3.5.0",
      },
    },
    {
      id: 400,
      version: {
        predicate: "until",
        version: "v4.0.0",
      },
    },
    {
      id: 410,
      version: {
        predicate: "until",
        version: "v4.1.0",
      },
    },
  ];
  expect(getCorrectVersion(versions, "v3.3.0")).toBeUndefined();
  expect(getCorrectVersion(versions, "v3.5.0")?.id).toBe(400);
  expect(getCorrectVersion(versions, "v4.0.0")?.id).toBe(400);
  expect(getCorrectVersion(versions, "v4.1.0")?.id).toBe(410);
  expect(getCorrectVersion(versions, "v4.2.0")?.id).toBe(999);
});

test("sortedBy", () => {
  expect([3, 2, 1].toSortedBy((x) => x)).toEqual([1, 2, 3]);
  expect([3, 2, 1].toSortedBy((x) => -x)).toEqual([3, 2, 1]);
  expect(
    ["the", "quick", "brown", "fox"].toSortedBy((x) => [
      x.length,
      x.charCodeAt(0),
    ]),
  ).toEqual(["fox", "the", "brown", "quick"]);
});
