// Copyright (C) 2024-2025 Guyutongxue
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { AnyState } from "@gi-tcg/core";
import { expect, MatcherResult } from "bun:test";

function toHaveVariable(
  actual: unknown,
  varName: string,
  expected: number,
): MatcherResult {
  if (!Array.isArray(actual)) {
    throw new TypeError(`We are expecting an array of states`);
  }
  if (actual.length !== 1) {
    return {
      pass: false,
      message: () => `Expected exactly 1 state, but got ${actual.length}`,
    };
  }
  const state: AnyState = actual[0];
  const variables = state.variables as Record<string, any>;
  if (variables[varName] !== expected) {
    return {
      pass: false,
      message: () =>
        `Expected ${varName} to be ${expected}, but got ${variables[varName]}`,
    };
  }
  return {
    pass: true,
    message: () => "",
  };
}

expect.extend({ toHaveVariable });

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toHaveVariable(varName: string, expected: number): void;
  }
}
