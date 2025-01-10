import getData from "@gi-tcg/data";
import { internal } from "@gi-tcg/core/builder";
import { test, expect } from "bun:test";

const { builderWeakRefs } = internal;

test("builders should be gc'd after initialize", () => {
  const data = getData();
  Bun.gc(true);
  expect(builderWeakRefs.size).toBeGreaterThan(0);
  expect(builderWeakRefs.values().some((ref) => ref.deref())).toBe(false);
  expect(data).toBeObject();
})

