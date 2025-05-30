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

import "@gi-tcg/utils/reset.css";
import "virtual:uno.css";
import "./style.css";

// export {
//   createPlayer,
//   EMPTY_GAME_STATE,
//   type WebUiOption,
//   StandaloneChessboard,
//   type StandaloneChessboardProps,
//   type PlayerIOWithCancellation,
// } from "./Chessboard.tsx";
export {
  StandaloneChessboard,
  type StandaloneChessboardProps,
} from "./standalone.tsx";
export {
  EMPTY_GAME_STATE,
  createClient,
  type ClientOption,
  type PlayerIOWithCancellation,
  type Client,
  type ClientChessboardProps,
} from "./client.tsx";
