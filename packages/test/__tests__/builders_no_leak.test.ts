import getData from "@gi-tcg/data";
import { builderWeakRefs } from "@gi-tcg/core/builder";
import { test, expect } from "bun:test";

test("builders should be gc'd after initialize", () => {
  const data = getData();
  Bun.gc(true);
  expect(builderWeakRefs.size).toBeGreaterThan(0);
  expect(builderWeakRefs.values().some((ref) => ref.deref())).toBe(false);
  expect(data).toBeObject();
})

