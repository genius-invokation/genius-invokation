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

import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import { Layout } from "../layouts/Layout";
import { copyToClipboard, PlayerInfo, roomCodeToId } from "../utils";
import {
  Show,
  createSignal,
  onMount,
  createEffect,
  onCleanup,
  createResource,
  Switch,
  Match,
  Component,
  createUniqueId,
} from "solid-js";
import axios, { AxiosError, AxiosResponse } from "axios";
import "@gi-tcg/web-ui-core/style.css";
import EventSourceStream from "@server-sent-stream/web";
import {
  PbPlayerStatus,
  type Notification,
  type RpcRequest,
} from "@gi-tcg/typings";
import {
  Client,
  createClient,
  PlayerIOWithCancellation,
} from "@gi-tcg/web-ui-core";
import { useMobile } from "../App";
import debounce from "debounce";
import { Dynamic } from "solid-js/web";
import { MobileChessboardLayout } from "../layouts/MobileChessboardLayout";

interface InitializedPayload {
  who: 0 | 1;
  config: any;
  myPlayerInfo: PlayerInfo;
  oppPlayerInfo: PlayerInfo;
}

interface RpcTimer {
  current: number;
  total: number;
}

interface ActionRequestPayload {
  id: number;
  timer: RpcTimer;
  request: RpcRequest;
}

const SSE_RECONNECT_TIMEOUT = 30 * 1000;

const createReconnectSse = <T,>(
  url: string,
  onPayload: (payload: T) => void,
  onError?: (e: Error) => void,
) => {
  let reconnectTimeout: Timer | null = null;
  let abortController: AbortController | null = null;

  const resetReconnectTimer = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
    reconnectTimeout = setTimeout(() => {
      console.warn("No data received, reconnecting...");
      abortController?.abort();
      connect();
    }, SSE_RECONNECT_TIMEOUT);
  };

  const connect = () => {
    abortController = new AbortController();
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
          try {
            onPayload(payload);
          } catch (e) {
            console.error("Error processing payload:", e);
          }
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
  const checkboxId = createUniqueId();
  const navigate = useNavigate();
  const code = params.code;
  const action = !!searchParams.action;
  const playerId = searchParams.player;
  const id = roomCodeToId(code);
  const [playerIo, setPlayerIo] = createSignal<PlayerIOWithCancellation>();
  const [initialized, setInitialized] = createSignal<InitializedPayload>();
  const [loading, setLoading] = createSignal(true);
  const [failed, setFailed] = createSignal<null | string>(null);
  const [chessboard, setChessboard] = createSignal<Component>();

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
        disableAction: !action,
      });
      setChessboard(() => Ui);
      setPlayerIo(io);
    }
  });

  const onActionRequested = async (payload: ActionRequestPayload) => {
    setCurrentMyTimer(payload.timer);
    currentRpcId.value = payload.id;
    playerIo()?.cancelRpc();
    await new Promise((r) => setTimeout(r, 100)); // wait for UI notifications?
    const response = await playerIo()
      ?.rpc(payload.request)
      .catch(() => void 0);
    if (!response) {
      return;
    }
    setCurrentMyTimer(null);
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
    await copyToClipboard(url.href);
    alert("观战链接已复制到剪贴板！");
  };

  const [currentMyTimer, setCurrentMyTimer] = createSignal<RpcTimer | null>(
    null,
  );
  const [currentOppTimer, setCurrentOppTimer] = createSignal<RpcTimer | null>(
    null,
  );
  const currentRpcId: { value: number | null } = { value: null };
  let countDownTimerIntervalId: number | null = null;
  const countDownTimer = () => {
    for (const [timer, setTimer] of [
      [currentMyTimer(), setCurrentMyTimer] as const,
      [currentOppTimer(), setCurrentOppTimer] as const,
    ]) {
      if (timer) {
        const current = timer.current - 1;
        setTimer({ ...timer, current });
        if (current <= 0) {
          playerIo()?.cancelRpc();
          setTimer(null);
        }
      }
    }
  };
  const setActionTimer = () => {
    countDownTimerIntervalId = window.setInterval(countDownTimer, 1000);
  };
  const cleanActionTimer = () => {
    if (countDownTimerIntervalId) {
      window.clearInterval(countDownTimerIntervalId);
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
          const notification: Notification = payload.data;
          playerIo()?.notify(notification);
          // 观战时，收到我方状态变更为非行动通知时，取消 rpc
          if (
            !action &&
            notification.mutation.find(
              (mut) =>
                mut.mutation?.$case === "playerStatusChange" &&
                mut.mutation.value.who === initialized()?.who &&
                mut.mutation.value.status === PbPlayerStatus.UNSPECIFIED,
            )
          ) {
            playerIo()?.cancelRpc();
            setCurrentMyTimer(null);
          }
          break;
        }
        case "oppRpc": {
          setCurrentOppTimer(payload.oppTimer ?? null);
          break;
        }
        case "rpc": {
          if (payload.id !== currentRpcId.value) {
            onActionRequested(payload);
          }
          break;
        }
        case "error": {
          alert(`发生致命错误：${payload.message}`);
          break;
        }
        default: {
          console.log("%c%s", "color: green", JSON.stringify(payload));
          break;
        }
      }
    },
    reportStreamError,
  );
  const downloadGameLog = async () => {
    try {
      const { data } = await axios.get(`rooms/${id}/gameLog`);
      const blob = new Blob([JSON.stringify(data)], {
        type: "application/json",
      });
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

  let chessboardContainer: HTMLDivElement | undefined;

  const mobile = useMobile();

  onMount(() => {
    fetchNotification();
    setActionTimer();
  });

  onCleanup(() => {
    setInitialized();
    setPlayerIo();
    cleanActionTimer();
  });

  return (
    <Dynamic
      component={mobile() && !!chessboard() ? MobileChessboardLayout : Layout}
    >
      <div
        class="data-[mobile]:p-0 data-[mobile]:h-100dvh data-[mobile]:overflow-clip container mx-auto flex flex-col group"
        bool:data-mobile={mobile() && chessboard()}
      >
        <div class="group-data-[mobile]:fixed top-0 right-0 z-100 group-data-[mobile]:translate-x-100% group-data-[mobile]-rotate-90 transform-origin-top-left flex group-data-[mobile]:flex-col flex-row group-data-[mobile]:items-start items-center has-[input:checked]:bg-white group-data-[mobile]:pl-[calc(var(--root-padding-top)+1rem)] group-data-[mobile]:p-4 rounded-br-2xl">
          <input hidden type="checkbox" class="peer" id={checkboxId} />
          <label
            for={checkboxId}
            class="hidden ml-4 mb-3 group-data-[mobile]:inline-flex btn btn-soft-primary peer-checked:btn-solid-primary text-primary peer-checked:text-white text-1.2rem h-8 w-8 p-0 items-center justify-center opacity-50 peer-checked:opacity-100"
          >
            <i class="i-mdi-info" />
          </label>
          <div class="flex-grow group-data-[mobile]:hidden group-data-[mobile]:peer-checked:flex flex flex-row group-data-[mobile]:flex-col flex-wrap items-center justify-between mb-3">
            <div class="flex flex-row flex-wrap gap-3 items-center">
              <h2 class="text-2xl font-bold flex-shrink-0">房间号：{code}</h2>
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
                  <div class="flex group-data-[mobile]:flex-col flex-row items-center">
                    <div>
                      <span>
                        {payload().myPlayerInfo.name}
                        {action ? "（您）" : "（观战中）"}
                      </span>
                      <span class="font-bold"> VS </span>
                      <span>{payload().oppPlayerInfo.name}</span>
                    </div>
                    <span class="group-data-[mobile]:hidden">，</span>
                    <span>您是{payload().who === 0 ? "先手" : "后手"}</span>
                  </div>
                )}
              </Show>
            </div>
          </div>
          <button
            class="hidden group-data-[mobile]:peer-checked:inline-flex btn btn-outline-blue"
            onClick={() => {
              navigate("/");
            }}
          >
            <i class="i-mdi-home" />
            回到首页
          </button>
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
          <div class="relative" ref={chessboardContainer}>
            <Dynamic<Client[1]>
              component={chessboard()}
              rotation={mobile() ? 90 : 0}
              autoHeight={!mobile()}
              class={`${mobile() ? "mobile-chessboard h-100dvh w-100dvw" : ""}`}
              timer={currentMyTimer() ?? currentOppTimer()}
            />
          </div>
        </Show>
      </div>
    </Dynamic>
  );
}
