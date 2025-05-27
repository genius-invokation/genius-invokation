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

import "./index";
import { createSignal, onMount } from "solid-js";
import { render } from "solid-js/web";

import getData from "@gi-tcg/data";
import { type DetailLogEntry, Game, type DeckConfig } from "@gi-tcg/core";
import { createClient } from "./client";
import { AssetsManager } from "@gi-tcg/assets-manager";
import { DetailLogViewer } from "@gi-tcg/detail-log-viewer";

const deck0: DeckConfig = {
  characters: [1101, 1601, 1203],
  cards: [
    331602, 331202, 332042, 331802, 332006, 332042, 223041, 223041, 226031,
    226031, 312009, 312009, 312010, 312010, 313002, 313002, 321002, 321004,
    321017, 321017, 322008, 322012, 322012, 322025, 332004, 332004, 332006,
    332032, 332032, 332041, 332041,
  ],
  noShuffle: import.meta.env.DEV,
};
const deck1: DeckConfig = {
  characters: [2304, 1201, 1608],
  cards: [
    323008, 332003, 332040, 322008, 332037, 333006, 332004, 312023, 312023,
    332011, 321004, 321004, 321024, 321024, 322018, 322018, 331202, 331202,
    332004, 332004, 332006, 332006, 332025, 332031, 332032, 332032, 332040,
    332040, 333015, 333015,
  ],
  noShuffle: import.meta.env.DEV,
};

function App() {
  const assetsManager = new AssetsManager({
    apiEndpoint: `https://beta.assets.gi-tcg.guyutongxue.site/api/v2`,
  });
  const [io0, Chessboard0] = createClient(0, { assetsManager });
  const [io1, Chessboard1] = createClient(1, {
    assetsManager,
    disableDelicateUi: true,
  });

  const [logs, setLogs] = createSignal<DetailLogEntry[]>([]);

  onMount(() => {
    const state = Game.createInitialState({
      data: getData(),
      decks: [deck0, deck1],
      // initialHandsCount: 10,
    });

    const game = new Game(state);

    game.players[0].io = io0;
    game.players[1].io = io1;
    game.players[0].config.alwaysOmni = true;
    game.players[0].config.allowTuningAnyDice = true;
    game.onIoError = console.error;
    game.onPause = async () => setLogs([...game.detailLog]);
    game.start();
    // game.giveUp
    Reflect.set(window, "game", game);
  });

  return (
    <>
      <Chessboard0 />
      <Chessboard1 />
      <DetailLogViewer logs={logs()} />
    </>
  );
}

render(() => <App />, document.getElementById("root")!);
