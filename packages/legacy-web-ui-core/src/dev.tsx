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

/* @refresh reload */
// import "solid-devtools";
import { createSignal } from "solid-js";
import { render } from "solid-js/web";

import getData from "@gi-tcg/data";
import { DetailLogEntry, Game, DeckConfig } from "@gi-tcg/core";
import { DetailLogViewer } from "@gi-tcg/detail-log-viewer";
import { createPlayer } from "./index";
import { AssetsManager } from "@gi-tcg/assets-manager";

const deck0: DeckConfig = {
  characters: [1314, 1709, 1203],
  cards: [
    333016, 313006, 212141, 321025, 332042, 223041, 223041, 226031, 226031,
    312009, 312009, 312010, 312010, 313002, 313002, 321002, 321004, 321017,
    321017, 322008, 322012, 322012, 322025, 332004, 332004, 332006, 332032,
    332032, 332041, 332041, 333003, 333003, 333009, 333011,
  ],
  noShuffle: import.meta.env.DEV,
};
const deck1: DeckConfig = {
  characters: [1213, 1111, 1210],
  cards: [
    311105, 311105, 311110, 311110, 311205, 312023, 312023, 312031, 312031,
    321004, 321004, 321024, 321024, 322018, 322018, 330007, 331202, 331202,
    332004, 332004, 332006, 332006, 332025, 332031, 332032, 332032, 332040,
    332040, 333015, 333015,
  ],
  noShuffle: import.meta.env.DEV,
};

function App() {
  const assetsManager = new AssetsManager({
    apiEndpoint: "https://beta.assets.gi-tcg.guyutongxue.site/api/v2",
  });
  const [io0, Chessboard0] = createPlayer(0, { assetsManager });
  const [io1, Chessboard1] = createPlayer(1, { assetsManager });
  const [detailLog, setDetailLog] = createSignal<readonly DetailLogEntry[]>([]);

  const state = Game.createInitialState({
    data: getData(),
    decks: [deck0, deck1],
  });
  const game = new Game(state);
  (game.onPause = async () => {
    setDetailLog([...game.detailLog]);
  }),
    (game.players[0].io = io0);
  game.players[0].config.alwaysOmni = true;
  game.players[0].config.allowTuningAnyDice = true;
  game.players[1].io = io1;
  game.onIoError = console.error;
  game.start();
  Reflect.set(window, "game", game);

  return (
    <div class="min-w-180 flex flex-col gap-2">
      <Chessboard0 />
      <Chessboard1 />
      <DetailLogViewer logs={detailLog()} />
    </div>
  );
}

render(() => <App />, document.getElementById("root")!);
