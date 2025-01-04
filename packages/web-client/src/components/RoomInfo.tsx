import { For, Show, createResource } from "solid-js";
import { A } from "@solidjs/router";
import { useUserContext } from "../App";
import { getPlayerAvatarUrl, roomIdToCode } from "../utils";
import type { PlayerInfo } from "../utils";

export interface RoomInfoProps {
  id: number;
  watchable: boolean;
  players: PlayerInfo[];
  onJoin?: (roomInfo: RoomInfoProps) => void;
}

export function RoomInfo(props: RoomInfoProps) {
  const { user } = useUserContext();
  const insideRoom = () => props.players.some((p) => p.id === user()?.id);
  const code = () => roomIdToCode(props.id);
  const url = (playerId: string | number) => {
    if (insideRoom()) {
      return `rooms/${code()}?player=${user()!.id}&action=1`;
    } else {
      return `rooms/${code()}?player=${playerId}`;
    }
  };
  const [avatarUrl0] = createResource(
    () => props.players,
    (players) => {
      return players[0] && getPlayerAvatarUrl(players[0]);
    },
  );
  const [avatarUrl1] = createResource(
    () => props.players,
    (players) => {
      return players[1] && getPlayerAvatarUrl(players[1]);
    },
  );
  return (
    <div class="w-90 bg-yellow-100 rounded-xl p-4 flex flex-col">
      <div class="flex flex-row items-center gap-2 mb-3">
        <h4 class="font-semibold">房间 {code()}</h4>
        <Show when={!props.watchable}>
          <span title="不可观战">&#8856;</span>
        </Show>
      </div>
      <div
        class="flex flex-row justify-between items-center group"
        data-disabled={!insideRoom() && !props.watchable}
      >
        <Show when={props.players.length > 0}>
          <A
            href={url(props.players[0].id)}
            class="flex flex-row items-center h-6 rounded-r-xl pr-2 bg-yellow-800 text-yellow-100 ml-2 hover:bg-yellow-700 transition-colors group-data-[disabled=true]:pointer-events-none"
          >
            <img
              src={avatarUrl0()}
              width="30"
              height="30"
              class="rounded-full b-yellow-800 b-1 translate-x--2"
            />
            {props.players[0].name}
          </A>
          <span class="text-xl font-bold">VS</span>
          <Show
            when={props.players.length > 1}
            fallback={
              <div class="flex flex-row items-center gap-2">
                <span class="text-yellow-600 italic">虚位以待</span>
                <Show when={!insideRoom()}>
                  <button
                    class="h-30px w-30px rounded-full bg-yellow-800 flex items-center justify-center text-lg text-yellow-100 font-bold select-none hover:bg-yellow-700 transition-colors"
                    onClick={() => props.onJoin?.(props)}
                  >
                    +
                  </button>
                </Show>
              </div>
            }
          >
            <A
              href={url(props.players[1].id)}
              class="flex flex-row items-center h-6 rounded-l-xl pl-2 bg-yellow-800 text-yellow-100 mr-2 hover:bg-yellow-700 transition-colors group-data-[disabled=true]:pointer-events-none"
            >
              {props.players[1].name}
              <img
                src={avatarUrl1()}
                width="30"
                height="30"
                class="rounded-full b-yellow-800 b-1 translate-x-2"
              />
            </A>
          </Show>
        </Show>
      </div>
    </div>
  );
}
