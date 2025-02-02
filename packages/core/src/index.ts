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
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { version } from "../package.json"/*  with { type: "json" } */;
export { version as CORE_VERSION };
export {
  Game,
  type DeckConfig,
  type CreateInitialStateConfig,
} from "./game";
export { type Player, type PlayerConfig } from "./player";
export { type GameStateLogEntry, DetailLogType, type DetailLogEntry, serializeGameStateLog, deserializeGameStateLog } from "./log";
export type * from "./base/state";
export { type Mutation } from "./base/mutation";
export { executeQueryOnState } from "./query";
export { type Version, VERSIONS, CURRENT_VERSION } from "./base/version";
export { type PlayerIO, exposeState } from "./io";
export * from "./error";
export * from "@gi-tcg/typings";

import type { ExEntityType, HandleT, ExEntityState, ExTag } from "./builder/type";
export declare namespace BuilderTypes {
  export type { ExEntityType, HandleT, ExEntityState, ExTag };
}
