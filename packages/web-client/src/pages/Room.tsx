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
  createResource,
  Switch,
  Match,
} from "solid-js";
import axios, { AxiosError, AxiosResponse } from "axios";
import "@gi-tcg/web-ui-core/style.css";
import EventSourceStream from "@server-sent-stream/web";
import type { RpcRequest } from "@gi-tcg/typings";
import { createClient, PlayerIOWithCancellation } from "@gi-tcg/web-ui-core";

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

const SSE_RECONNECT_TIMEOUT = 30 * 1000;

const createReconnectSse = <T,>(
  url: string,
  onPayload: (payload: T) => void,
  onError?: (e: Error) => void,
) => {
  let reconnectTimeout: Timer | null = null;
  const abortController = new AbortController();

  const resetReconnectTimer = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
    reconnectTimeout = setTimeout(() => {
      console.warn("No data received, reconnecting...");
      abortController.abort();
      connect();
    }, SSE_RECONNECT_TIMEOUT);
  };

  const connect = () => {
    axios
      .get(url, {
        headers: {
          Accept: "text/event-stream",
        },
        responseType: "stream",
        signal: abortController.signal,
        adapter: "fetch",
      })
      .then(async (response) => {
        console.log(`${url} CONNECTED`);
        const data: ReadableStream = response.data;
        const reader = data.pipeThrough(new EventSourceStream()).getReader();

        resetReconnectTimer(); // Start the timer after connection is established

        for (;;) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          resetReconnectTimer(); // Reset the timer on receiving data
          const payload = JSON.parse(value.data);
          onPayload(payload);
        }

        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }
      })
      .catch((error) => {
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }
        onError?.(error);
      });
  };

  return [connect];
};

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
          setLoading(false);
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
      const [io, Ui] = createClient(payload.who, {
        onGiveUp,
      });
      setChessboard(<Ui class="h-0" />);
      setPlayerIo(io);
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
  let actionTimerIntervalId: number | null = null;
  const setActionTimer = () => {
    actionTimerIntervalId = window.setInterval(() => {
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
  const cleanActionTimer = () => {
    if (actionTimerIntervalId) {
      window.clearInterval(actionTimerIntervalId);
    }
  };

  const [roomInfo] = createResource(() =>
    axios.get<{ status: string }>(`rooms/${id}`).then((res) => res.data),
  );

  const [fetchNotification] = createReconnectSse(
    `rooms/${id}/players/${playerId}/notification`,
    (payload: any) => {
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
          console.log("%c%s", "color: green", payload);
          break;
        }
      }
    },
    reportStreamError,
  );
  const [fetchAction] = createReconnectSse(
    `rooms/${id}/players/${playerId}/actionRequest`,
    (payload: any) => {
      switch (payload.type) {
        case "rpc": {
          if (payload.id !== currentRpcId.value) {
            onActionRequested(payload);
          }
          break;
        }
        default: {
          console.log("%c%s", "color: red", payload);
          break;
        }
      }
    },
    reportStreamError,
  );

  const downloadGameLog = async () => {
    try {
      const { data } = await axios.get(`rooms/${id}/gameLog`);
      const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gameLog.json`;
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    } catch (e) {
      if (e instanceof AxiosError) {
        alert(e.response?.data.message);
      }
      console.error(e);
    }
  };

  onMount(() => {
    fetchNotification();
    if (action) {
      fetchAction();
    }
    setActionTimer();
  });

  onCleanup(() => {
    setInitialized();
    setPlayerIo();
    cleanActionTimer();
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
          </div>
          <div>
            <Show when={initialized()}>
              {(payload) => (
                <>
                  <span>{payload().myPlayerInfo.name}（您）</span>
                  <span class="font-bold"> VS </span>
                  <span>{payload().oppPlayerInfo.name}</span>
                  <span>，您是{payload().who === 0 ? "先手" : "后手"}</span>
                </>
              )}
            </Show>
          </div>
        </div>
        <Switch>
          <Match when={loading() || roomInfo.loading}>
            <div class="mb-3 alert alert-outline-info">房间加载中……</div>
          </Match>
          <Match when={roomInfo.state === "ready" && roomInfo()}>
            {(info) => (
              <Switch>
                <Match when={!initialized() && info().status === "waiting"}>
                  <div class="mb-3 alert alert-outline-info">
                    等待对手加入房间……
                  </div>
                </Match>
                <Match when={info().status === "finished"}>
                  <div class="mb-3 alert alert-outline-info">
                    此房间的对局已结束。
                    <button class="btn btn-soft-info" onClick={downloadGameLog}>
                      下载日志
                    </button>
                  </div>
                </Match>
              </Switch>
            )}
          </Match>
          <Match when={failed()}>
            <div class="mb-3 alert alert-outline-error">
              加载房间失败！{failed()}
            </div>
          </Match>
        </Switch>
        <Show when={initialized()}>
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
      </div>
    </Layout>
  );
}
