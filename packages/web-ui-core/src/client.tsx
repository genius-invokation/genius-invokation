import {
  dispatchRpc,
  PbGameState,
  PbPlayerState,
  type RpcDispatcher,
} from "@gi-tcg/typings";
import { batch, createSignal, type ComponentProps, type JSX } from "solid-js";
import { Chessboard, type AnimatingCardInfo } from "./components/Chessboard";
import type { PlayerIO } from "@gi-tcg/core";
import { AsyncQueue } from "./async_queue";
import { parseMutations } from "./mutations";

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

const EMPTY_GAME_STATE: PbGameState = {
  currentTurn: 0,
  phase: 0 /* PbPhaseType.PHASE_INIT_HANDS */,
  roundNumber: 0,
  player: [EMPTY_PLAYER_DATA, EMPTY_PLAYER_DATA],
};

export interface ClientOption {
  onGiveUp?: () => void;
  rpc?: Partial<RpcDispatcher>;
  assetsApiEndpoint?: string;
}

export interface PlayerIOWithCancellation extends PlayerIO {
  cancelRpc: () => void;
}

export type Client = [
  io: PlayerIOWithCancellation,
  Chessboard: (props: ComponentProps<"div">) => JSX.Element,
];

export function createClient(who: 0 | 1): Client {
  const [state, setState] = createSignal<PbGameState>(EMPTY_GAME_STATE);
  const [previousState, setPreviousState] =
    createSignal<PbGameState>(EMPTY_GAME_STATE);
  const [animatingCards, setAnimatingCards] = createSignal<AnimatingCardInfo[]>(
    [],
  );
  const [animationResolver, setAnimationResolver] = createSignal<() => void>();

  const uiQueue = new AsyncQueue();
  let savedState: PbGameState | undefined = void 0;

  const io: PlayerIOWithCancellation = {
    cancelRpc: () => {
      throw new Error();
    },
    notify: ({ mutation, state }) => {
      uiQueue.push(async () => {
        if (!previousState) {
          savedState = state;
          return;
        }
        const { animatingCards } = parseMutations(mutation);
        // console.log(previousState, animatingCards, state);
        const { promise, resolve } = Promise.withResolvers<void>();
        batch(() => {
          setPreviousState(savedState!);
          setState(state!);
          setAnimatingCards(animatingCards);
          setAnimationResolver(() => resolve);
          savedState = state;
        });
        if (animatingCards.length > 0) {
          await promise;
        }
      });
    },
    rpc: () => {
      throw new Error();
    },
  };

  const Wrapper = (props: ComponentProps<"div">) => (
    <Chessboard
      who={1}
      state={state()}
      previousState={previousState()}
      animatingCards={animatingCards()}
      onAnimationFinish={animationResolver()}
      class="h-0"
      {...props}
    />
  );

  return [io, Wrapper];
}
