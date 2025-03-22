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

import { useParams, useSearchParams } from "@solidjs/router";
import { Layout } from "../layouts/Layout";
import { PlayerInfo, roomCodeToId } from "../utils";
import {
  Show,
  createSignal,
  onMount,
  JSX,
  createEffect,
  onCleanup,
} from "solid-js";
import axios, { AxiosError } from "axios";
import {
  PlayerIOWithCancellation,
  createPlayer,
} from "@gi-tcg/legacy-web-ui-core";
import "@gi-tcg/legacy-web-ui-core/style.css";
import "@gi-tcg/web-ui-core/style.css";
import EventSourceStream from "@server-sent-stream/web";
import { RpcMethod, RpcRequest } from "@gi-tcg/typings";
import { createClient } from "@gi-tcg/web-ui-core";
import { makePersisted } from "@solid-primitives/storage";

interface InitializedPayload {
  who: 0 | 1;
  config: any;
  myPlayerInfo: PlayerInfo;
  oppPlayerInfo: PlayerInfo;
}

interface ActionRequestPayload {
  id: number;
  timeout: number;
  request: RpcRequest;
}

export function Room() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const code = params.code;
  const action = !!searchParams.action;
  const playerId = searchParams.player;
  const id = roomCodeToId(code);
  const [playerIo, setPlayerIo] = createSignal<PlayerIOWithCancellation>();
  const [initialized, setInitialized] = createSignal<InitializedPayload>();
  const [loading, setLoading] = createSignal(true);
  const [failed, setFailed] = createSignal<null | string>(null);
  const [chessboard, setChessboard] = createSignal<JSX.Element>();

  const [isLegacyUi, setLegacyUi] = makePersisted(createSignal(true), {
    storage: sessionStorage,
  });

  const toggleLegacyUi = () => {
    setLegacyUi((prev) => !prev);
    window.location.reload();
  };

  const reportStreamError = async (e: Error) => {
    if (e instanceof AxiosError) {
      const data = e.response?.data as ReadableStream;
      if (data && "pipeThrough" in data) {
        const reader = data.pipeThrough(new TextDecoderStream()).getReader();
        const { value, done } = await reader.read();
        let message = `${value}`;
        try {
          message = JSON.parse(value ?? "{}").message;
        } catch {}
        if (initialized()) {
          alert(message);
        } else {
          setFailed(message);
        }
        console.error(value);
      }
    }
    console.error(e);
  };

  createEffect(() => {
    const payload = initialized();
    const onGiveUp = async () => {
      try {
        const { data } = await axios.post(
          `rooms/${id}/players/${playerId}/giveUp`,
        );
      } catch (e) {
        if (e instanceof AxiosError) {
          alert(e.response?.data.message);
        }
        console.error(e);
      }
    };
    if (payload) {
      if (isLegacyUi()) {
        const [io, Ui] = createPlayer(payload.who, {
          onGiveUp,
        });
        setChessboard(<Ui />);
        setPlayerIo(io);
      } else {
        const [io, Ui] = createClient(payload.who, {
          onGiveUp,
        });
        setChessboard(<Ui class="h-0" />);
        setPlayerIo(io);
      }
    }
  });

  const onActionRequested = async (payload: ActionRequestPayload) => {
    setCurrentTimer(payload.timeout);
    currentRpcId.value = payload.id;
    playerIo()?.cancelRpc();
    await new Promise((r) => setTimeout(r, 100)); // wait for UI notifications?
    const response = await playerIo()?.rpc(payload.request);
    if (!response) {
      return;
    }
    setCurrentTimer(null);
    try {
      const reply = axios.post(
        `rooms/${id}/players/${playerId}/actionResponse`,
        {
          id: payload.id,
          response,
        },
      );
      currentRpcId.value = null;
      await reply;
    } catch (e) {
      if (e instanceof AxiosError) {
        alert(e.response?.data.message);
      }
      console.error(e);
    }
  };

  const deleteRoom = async () => {
    if (!window.confirm(`确认删除房间吗？`)) {
      return;
    }
    try {
      const { data } = await axios.delete(`rooms/${id}`);
      history.back();
    } catch (e) {
      if (e instanceof AxiosError) {
        alert(e.response?.data.message);
      }
      console.error(e);
    }
  };

  const copyWatchLink = async () => {
    const url = new URL(location.href);
    url.searchParams.delete("action");
    await navigator.clipboard.writeText(url.href);
    alert("观战链接已复制到剪贴板！");
  };

  const [currentTimer, setCurrentTimer] = createSignal<number | null>(null);
  const currentRpcId: { value: number | null } = { value: null };
  let intervalId: number | null = null;
  const setTimer = () => {
    intervalId = window.setInterval(() => {
      const current = currentTimer();
      if (typeof current === "number") {
        setCurrentTimer(current - 1);
        if (current <= 0) {
          playerIo()?.cancelRpc();
          setCurrentTimer(null);
        }
      }
    }, 1000);
  };
  const cleanTimer = () => {
    if (intervalId) {
      window.clearInterval(intervalId);
    }
  };

  onMount(() => {
    axios
      .get(`rooms/${id}/players/${playerId}/notification`, {
        headers: {
          Accept: "text/event-stream",
        },
        responseType: "stream",
        adapter: "fetch",
      })
      .then(async (response) => {
        console.log("notification CONNECTED");
        const data: ReadableStream = response.data;
        const reader = data.pipeThrough(new EventSourceStream()).getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          const payload = JSON.parse(value.data);
          setLoading(false);
          switch (payload.type) {
            case "initialized": {
              setInitialized(payload);
              break;
            }
            case "notification": {
              playerIo()?.notify(payload.data);
              break;
            }
            default: {
              console.log("%c%s", "color: green", value.data);
              break;
            }
          }
        }
      })
      .catch(reportStreamError);
    if (action) {
      axios
        .get(`rooms/${id}/players/${playerId}/actionRequest`, {
          headers: {
            Accept: "text/event-stream",
          },
          responseType: "stream",
          adapter: "fetch",
        })
        .then(async (response) => {
          console.log("actionRequest CONNECTED");
          const data: ReadableStream = response.data;
          const reader = data.pipeThrough(new EventSourceStream()).getReader();
          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              break;
            }
            const payload = JSON.parse(value.data);
            switch (payload.type) {
              case "rpc": {
                if (payload.id !== currentRpcId.value) {
                  onActionRequested(payload);
                }
                break;
              }
              default: {
                console.log("%c%s", "color: red", value.data);
                break;
              }
            }
          }
        })
        .catch(reportStreamError);
    }
    setTimer();
  });

  onCleanup(() => {
    setInitialized();
    setPlayerIo();
    cleanTimer();
  });

  return (
    <Layout>
      <div class="container mx-auto flex flex-col">
        <div class="flex flex-row items-center justify-between mb-3">
          <div class="flex flex-row gap-3 items-center">
            <h2 class="text-2xl font-bold">房间号：{code}</h2>
            <Show when={!loading() && !failed() && !initialized()}>
              <button class="btn btn-outline-red" onClick={deleteRoom}>
                <i class="i-mdi-delete" />
              </button>
            </Show>
            <Show when={initialized()?.config?.watchable}>
              <button
                class="btn btn-outline-primary"
                title="复制观战链接"
                onClick={copyWatchLink}
              >
                <i class="i-mdi-link-variant" />
              </button>
            </Show>
            <button class="btn btn-link" onClick={toggleLegacyUi}>
              切换至{isLegacyUi() ? "新" : "旧"}版界面
            </button>
          </div>
          <div>
            <Show when={initialized()}>
              {(payload) => (
                <>
                  <span>{payload().myPlayerInfo.name}</span>
                  <span class="font-bold"> VS </span>
                  <span>{payload().oppPlayerInfo.name}</span>
                  <span>（您是：{payload().who === 0 ? "先手" : "后手"}）</span>
                </>
              )}
            </Show>
          </div>
        </div>
        <Show when={!failed()} fallback={<div>加载房间失败！{failed()}</div>}>
          <Show when={initialized()} fallback={<div>等待对手加入房间…</div>}>
            <div class="relative">
              <Show when={currentTimer()}>
                {(time) => (
                  <div class="absolute top-0 left-[50%] translate-x-[-50%] bg-black text-white opacity-80 p-2 rounded-lb rounded-rb z-29">
                    {Math.max(Math.floor(time() / 60), 0)
                      .toString()
                      .padStart(2, "0")}{" "}
                    :{" "}
                    {Math.max(time() % 60, 0)
                      .toString()
                      .padStart(2, "0")}
                  </div>
                )}
              </Show>
              {chessboard()}
            </div>
          </Show>
        </Show>
      </div>
    </Layout>
  );
}
