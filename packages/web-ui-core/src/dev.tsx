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
import { batch, createSignal, onMount, Show, untrack } from "solid-js";
import { render } from "solid-js/web";

import type { PbGameState, PbPlayerState } from "@gi-tcg/typings";
import getData from "@gi-tcg/data";
import { type DetailLogEntry, Game, type DeckConfig } from "@gi-tcg/core";
import { createPlayer } from "@gi-tcg/webui";
import { Chessboard, type AnimatingCardInfo } from "./components/Chessboard";
import { parseMutations } from "./mutations";
import { AsyncQueue } from "./async_queue";

const deck0: DeckConfig = {
  characters: [1214, 1403, 1203],
  cards: [
    333016, 313006, 212141, 321025, 332042, 223041, 223041, 226031, 226031,
    312009, 312009, 312010, 312010, 313002, 313002, 321002, 321004, 321017,
    321017, 322008, 322012, 322012, 322025, 332004, 332004, 332006, 332032,
    332032, 332041, 332041,
  ],
  noShuffle: import.meta.env.DEV,
};
const deck1: DeckConfig = {
  characters: [1213, 1111, 1608],
  cards: [
    116081, 116081, 332031, 311105, 330007, 311110, 311205, 312023, 312023,
    312031, 312031, 321004, 321004, 321024, 321024, 322018, 322018, 331202,
    331202, 332004, 332004, 332006, 332006, 332025, 332031, 332032, 332032,
    332040, 332040, 333015, 333015,
  ],
  noShuffle: import.meta.env.DEV,
};

const EMPTY_PLAYER_DATA: PbPlayerState = {
  activeCharacterId: 0,
  dice: [],
  pileCard: [],
  handCard: [],
  character: [],
  combatStatus: [],
  summon: [],
  support: [],
  initiativeSkill: [],
  declaredEnd: false,
  legendUsed: false,
};

export const EMPTY_GAME_STATE: PbGameState = {
  currentTurn: 0,
  phase: 0 /* PbPhaseType.PHASE_INIT_HANDS */,
  roundNumber: 0,
  player: [EMPTY_PLAYER_DATA, EMPTY_PLAYER_DATA],
};

function App() {
  let cb0!: HTMLDivElement;
  let cb1!: HTMLDivElement;

  const [p1State, setP1State] = createSignal<PbGameState>(EMPTY_GAME_STATE);
  const [p1PreviousState, setP1PreviousState] =
    createSignal<PbGameState>(EMPTY_GAME_STATE);
  const [p1AnimatingCards, setP1AnimatingCards] = createSignal<
    AnimatingCardInfo[]
  >([]);
  const [p1AnimationResolver, setP1AnimationResolver] =
    createSignal<() => void>();

  onMount(() => {
    const state = Game.createInitialState({
      data: getData(),
      decks: [deck0, deck1],
      // initialHandsCount: 10,
    });
    const io0 = createPlayer(cb0, 0);
    const io1 = createPlayer(cb1, 1);

    const game = new Game(state);

    game.players[0].io = io0;

    const uiQueue = new AsyncQueue();
    let previousState: PbGameState | undefined = void 0;
    game.players[1].io = {
      ...io1,
      notify: async ({ mutation, state }) => {
        io1.notify({ mutation, state });
        uiQueue.push(async () => {
          if (!previousState) {
            previousState = state;
            return;
          }
          const { animatingCards } = parseMutations(mutation);
          // console.log(previousState, animatingCards, state);
          const { promise, resolve } = Promise.withResolvers<void>();
          batch(() => {
            setP1PreviousState(previousState!);
            setP1State(state!);
            setP1AnimatingCards(animatingCards);
            setP1AnimationResolver(() => resolve);
            previousState = state;
          });
          if (animatingCards.length > 0) {
            await promise;
          }
        });
      },
    };
    game.players[0].config.alwaysOmni = true;
    game.players[0].config.allowTuningAnyDice = true;
    game.onIoError = console.error;
    game.start();
    Reflect.set(window, "game", game);
  });

  return (
    <div class="min-w-180 flex flex-col gap-2">
      <details>
        <div ref={cb0} />
        <div ref={cb1} />
      </details>
      <Chessboard
        who={1}
        state={p1State()}
        previousState={p1PreviousState()}
        animatingCards={p1AnimatingCards()}
        onAnimationFinish={p1AnimationResolver()}
        class="h-0"
      />
    </div>
  );
}

render(() => <App />, document.getElementById("root")!);
