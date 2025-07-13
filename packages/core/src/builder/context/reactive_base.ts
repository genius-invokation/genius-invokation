// Copyright (C) 2025 Guyutongxue
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
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import type { StateKind } from "../../base/state";

export const ReactiveStateSymbol: unique symbol = Symbol("ReactiveState");
export type ReactiveStateSymbol = typeof ReactiveStateSymbol;

export const RawStateSymbol: unique symbol = Symbol("RawState");
export type RawStateSymbol = typeof RawStateSymbol;

export abstract class ReactiveStateBase {
  abstract get [ReactiveStateSymbol](): StateKind;
  cast<K extends StateKind>(): this & {
    readonly [ReactiveStateSymbol]: K;
  } {
    return this as any;
  }
  declare [RawStateSymbol]: unknown;
}
