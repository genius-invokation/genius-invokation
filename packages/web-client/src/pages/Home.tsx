// Copyright (C) 2024 Guyutongxue
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

import {
  Show,
  createResource,
  Switch,
  Match,
  For,
  createSignal,
  onMount,
} from "solid-js";
import { useUserContext } from "../App";
import { Layout } from "../layouts/Layout";
import { A, useNavigate, useSearchParams } from "@solidjs/router";
import axios, { AxiosError } from "axios";
import { DeckBriefInfo } from "../components/DeckBriefInfo";
import { RoomDialog } from "../components/RoomDialog";
import { roomCodeToId } from "../utils";
import { RoomInfo } from "../components/RoomInfo";
import { useDecks } from "./Decks";
import { Login } from "../components/Login";
import { useGuestInfo } from "../guest";

export function Home() {
  const { user, refresh } = useUserContext();
  const guestInfo = useGuestInfo();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams<{ token: string }>();
  const [decks] = useDecks();

  const [roomCodeValid, setRoomCodeValid] = createSignal(false);
  let createRoomDialogEl!: HTMLDialogElement;
  let joinRoomDialogEl!: HTMLDialogElement;
  const [joiningRoomInfo, setJoiningRoomInfo] = createSignal<any>();

  const [currentRoom] = createResource(() =>
    axios.get("rooms/current").then((r) => r.data),
  );
  const [allRooms, { refetch }] = createResource(() =>
    axios.get("rooms").then((e) => e.data),
  );

  const createRoom = () => {
    if (!decks()?.count) {
      alert("请先创建一组牌组");
      navigate("/decks/new");
      return;
    }
    createRoomDialogEl.showModal();
  };
  const joinRoomBySubmitCode = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!decks()?.count) {
      alert("请先创建一组牌组");
      navigate("/decks/new");
      return;
    }
    const form = new FormData(e.target as HTMLFormElement);
    const roomCode = form.get("roomCode") as string;
    const roomId = roomCodeToId(roomCode);
    try {
      const { data } = await axios.get(`rooms/${roomId}`);
      setJoiningRoomInfo(data);
      joinRoomDialogEl.showModal();
    } catch (e) {
      if (e instanceof AxiosError) {
        alert(e.response?.data.message);
      }
      console.error(e);
      setJoiningRoomInfo();
    }
  };
  const joinRoomByInfo = (roomInfo: any) => {
    if (!decks()?.count) {
      alert("请先创建一组牌组");
      navigate("/decks/new");
      return;
    }
    setJoiningRoomInfo(roomInfo);
    joinRoomDialogEl.showModal();
  };

  onMount(async () => {
    if (searchParams.token) {
      localStorage.setItem("accessToken", searchParams.token);
      setSearchParams({});
      await refresh();
      navigate("/");
    }
  });

  return (
    <Layout>
      <div class="container mx-auto">
        <Switch>
          <Match when={user.loading}>
            <div class="text-gray-500">Loading now, please wait...</div>
          </Match>
          <Match when={user.error}>
            <div class="text-red-300">
              Failed to load user info, please contact admin
            </div>
          </Match>
          <Match when={user()}>
            {(user) => (
              <div class="flex flex-col">
                <div class="flex-shrink-0 mb-8">
                  <h2 class="text-3xl font-light">
                    {user().isGuest ? "游客 " : ""}
                    {user().name}，欢迎你！
                  </h2>
                </div>
                <div class="flex flex-row h-120 gap-8">
                  <div class="h-full w-60 flex flex-col items-start bottom-opacity-gradient">
                    <A
                      href="/decks"
                      class="text-xl font-bold text-blue-500 hover:underline mb-4"
                    >
                      我的牌组
                    </A>
                    <Switch>
                      <Match when={decks.loading}>
                        <div class="text-gray-500">牌组信息加载中…</div>
                      </Match>
                      <Match when={decks.error}>
                        <div class="text-gray-500">牌组信息加载失败</div>
                      </Match>
                      <Match when={decks()}>
                        {(decks) => (
                          <div class="flex flex-col gap-2">
                            <For
                              each={decks().data}
                              fallback={
                                <div class="text-gray-500">
                                  暂无牌组，
                                  <A href="/decks/new" class="text-blue-500">
                                    前往添加
                                  </A>
                                </div>
                              }
                            >
                              {(deckData) => <DeckBriefInfo {...deckData} />}
                            </For>
                          </div>
                        )}
                      </Match>
                    </Switch>
                  </div>
                  <div class="b-r-gray-200 b-1" />
                  <div class="flex-grow flex flex-col">
                    <h4 class="text-xl font-bold mb-5">开始游戏</h4>
                    <Show
                      when={!currentRoom()}
                      fallback={
                        <div class="mb-8">
                          <RoomInfo {...currentRoom()} />
                        </div>
                      }
                    >
                      <div class="flex flex-row gap-5 items-center mb-8">
                        <button
                          class="flex-shrink-0 w-35 btn btn-solid-green text-1em gap-0.5em"
                          onClick={createRoom}
                        >
                          创建房间…
                        </button>
                        或者
                        <form
                          class="flex-grow flex flex-row"
                          onSubmit={joinRoomBySubmitCode}
                        >
                          <input
                            class="input input-solid rounded-r-0 b-r-0"
                            name="roomCode"
                            placeholder="输入房间号"
                            inputmode="numeric"
                            pattern="\d{6}"
                            onInput={(e) =>
                              setRoomCodeValid(e.target.checkValidity())
                            }
                            autofocus
                            required
                          />
                          <button
                            type="submit"
                            class="flex-shrink-0 w-35 btn btn-solid text-1em gap-0.5em rounded-l-0"
                            disabled={!roomCodeValid()}
                          >
                            加入房间…
                          </button>
                        </form>
                      </div>
                    </Show>
                    <h4 class="text-xl font-bold mb-5">当前对局</h4>
                    <ul class="flex gap-2 flex-row flex-wrap">
                      <For
                        each={allRooms()}
                        fallback={<div class="text-gray-500">暂无对局</div>}
                      >
                        {(roomInfo) => (
                          <li>
                            <RoomInfo {...roomInfo} onJoin={joinRoomByInfo} />
                          </li>
                        )}
                      </For>
                    </ul>
                  </div>
                </div>
                <RoomDialog ref={createRoomDialogEl!} />
                <RoomDialog
                  ref={joinRoomDialogEl!}
                  joiningRoomInfo={joiningRoomInfo()}
                />
              </div>
            )}
          </Match>
          <Match when={true}>
            <div class="w-full flex justify-center">
              <Login />
            </div>
          </Match>
        </Switch>
      </div>
    </Layout>
  );
}
