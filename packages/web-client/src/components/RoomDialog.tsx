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

import {
  createSignal,
  Show,
  For,
  createEffect,
  JSX,
  splitProps,
} from "solid-js";
import axios, { AxiosError } from "axios";
import { ToggleSwitch } from "./ToggleSwitch";
import { DeckInfoProps } from "./DeckBriefInfo";
import { roomIdToCode } from "../utils";
import { useNavigate } from "@solidjs/router";
import { useAuth } from "../auth";
import { useVersionContext } from "../App";
import { DEFAULT_ASSET_API_ENDPOINT } from "@gi-tcg/config";
import { useGuestDecks, useGuestInfo } from "../guest";

function SelectableDeckInfo(
  props: DeckInfoProps & Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "id">,
) {
  const [deckInfo, inputProps] = splitProps(props, [
    "characters",
    "name",
    "id",
  ]);
  return (
    <label class="relative group cursor-pointer">
      <input
        type="radio"
        class="w-0 h-0 opacity-0 peer"
        name="createRoomDeck"
        {...inputProps}
      />
      <div class="pl-10 pr-4 flex flex-row">
        <div class="flex flex-row items-center gap-1">
          <For each={deckInfo.characters}>
            {(id) => (
              <img
                class="h-12 w-12 b-2 b-yellow-100 rounded-full"
                src={`${DEFAULT_ASSET_API_ENDPOINT}/images/character_icons/${id}`}
              />
            )}
          </For>
        </div>
      </div>
      <div class="pl-8 pb-1 text-yellow-800 peer-checked:text-yellow-100 transition-colors">
        {deckInfo.name}
      </div>
      <div class="absolute bottom-7 left-0 hidden peer-checked:flex text-6 line-height-6 w-8 h-8  items-center justify-center text-red bg-white b-yellow-800 b-2 rounded-full">
        &#10003;
      </div>
      <div class="absolute bottom-0 left-4 right-1 h-12 bg-white border-yellow-800 b-1 group-hover:bg-yellow-100 group-[_]:peer-checked:bg-yellow-800 rounded-lg z--1 transition-colors" />
    </label>
  );
}

export interface RoomDialogProps {
  ref: HTMLDialogElement;
  joiningRoomInfo?: {
    id: number;
    config: TimeConfig & { [k: string]: any };
  };
}

interface TimeConfig {
  name: string;
  initTotalActionTime: number;
  rerollTime: number;
  roundTotalActionTime: number;
  actionTime: number;
}

const TIME_CONFIGS: TimeConfig[] = [
  {
    name: "最小",
    initTotalActionTime: 0,
    rerollTime: 25,
    roundTotalActionTime: 0,
    actionTime: 25,
  },
  {
    name: "标准",
    initTotalActionTime: 45,
    rerollTime: 40,
    roundTotalActionTime: 60,
    actionTime: 25,
  },
  {
    name: "超长",
    initTotalActionTime: 0,
    rerollTime: 300,
    roundTotalActionTime: 0,
    actionTime: 300,
  },
];

export function RoomDialog(props: RoomDialogProps) {
  const { status } = useAuth();
  const [guestInfo, setGuestInfo] = useGuestInfo();
  const [guestDecks] = useGuestDecks();
  const navigate = useNavigate();
  const editable = () => !props.joiningRoomInfo;
  let dialogEl: HTMLDialogElement;
  const closeDialog = () => {
    dialogEl.close();
  };
  const { versionInfo } = useVersionContext();
  const [version, setVersion] = createSignal(-1);
  const [timeConfig, setTimeConfig] = createSignal(TIME_CONFIGS[1]);
  const [isPublic, setIsPublic] = createSignal(true);
  const [watchable, setWatchable] = createSignal(true);
  const [allowGuest, setAllowGuest] = createSignal(true);
  const [availableDecks, setAvailableDecks] = createSignal<DeckInfoProps[]>([]);
  const [loadingDecks, setLoadingDecks] = createSignal(true);
  const [selectedDeck, setSelectedDeck] = createSignal<number | null>(null);
  const [entering, setEntering] = createSignal(false);

  createEffect(() => {
    const versions = versionInfo()?.supportedGameVersions ?? [];
    if (props.joiningRoomInfo?.config.gameVersion) {
      const ver = versions.indexOf(props.joiningRoomInfo.config.gameVersion);
      setVersion(ver);
    } else {
      setVersion(versions.length - 1);
    }
  });

  const updateAvailableDecks = async (version: number) => {
    setLoadingDecks(true);
    const { type } = status();
    try {
      if (type === "user") {
        const { data } = await axios.get(`decks?requiredVersion=${version}`);
        setAvailableDecks(data.data);
      } else if (type === "guest") {
        setAvailableDecks(
          guestDecks().filter((deck) => deck.requiredVersion <= version),
        );
      }
    } catch (e) {
      setAvailableDecks([]);
      if (e instanceof AxiosError) {
        alert(e.response?.data.message);
      }
      console.error(e);
    }
    const currentSelectedDeckId = selectedDeck();
    if (!availableDecks().some((deck) => deck.id === currentSelectedDeckId)) {
      setSelectedDeck(null);
    }
    setLoadingDecks(false);
  };

  createEffect(() => {
    const ver = version();
    if (ver >= 0) {
      updateAvailableDecks(ver);
    }
  });

  const enterRoom = async () => {
    setEntering(true);
    const { type, name, id } = status();
    try {
      let roomId = props.joiningRoomInfo?.id;
      let playerId = id ?? null;
      let response;
      if (typeof roomId === "undefined") {
        const payload: any = {
          gameVersion: version(),
          ...timeConfig(),
          private: !isPublic(),
          watchable: watchable(),
          allowGuest: allowGuest(),
        };
        if (type === "guest") {
          payload.name = name;
          payload.deck = guestDecks().find(
            (deck) => deck.id === selectedDeck(),
          );
        } else if (type === "user") {
          payload.hostDeckId = selectedDeck();
        }
        const { data } = await axios.post("rooms", payload);
        response = data;
        roomId = response.room.id as number;
      } else {
        let payload;
        if (type === "guest") {
          payload = {
            deck: guestDecks().find((deck) => deck.id === selectedDeck()),
            name,
          };
        } else if (type === "user") {
          payload = {
            deckId: selectedDeck(),
          };
        }
        const { data } = await axios.post(`rooms/${roomId}/players`, payload);
        response = data;
      }
      if (response.accessToken) {
        localStorage.setItem("accessToken", response.accessToken);
      }
      if (response.playerId) {
        playerId = response.playerId;
        setGuestInfo((info) => info && { ...info, id: response.playerId });
      }
      const roomCode = roomIdToCode(roomId);
      navigate(`/rooms/${roomCode}?player=${playerId}&action=1`);
    } catch (e) {
      if (e instanceof AxiosError) {
        alert(e.response?.data.message);
      } else if (e instanceof Error) {
        alert(e.message);
      }
      console.error(e);
    } finally {
      setEntering(false);
    }
  };

  return (
    <dialog
      ref={(el) => (dialogEl = el) && (props.ref as any)?.(el)}
      class="h-[calc(100vh-6rem)] max-h-180 rounded-xl shadow-xl p-6"
    >
      <div class="flex flex-col h-full w-full gap-5">
        <h3 class="flex-shrink-0 text-xl font-bold">房间配置</h3>
        <div
          class="flex-grow min-h-0 flex flex-row gap-4 data-[disabled=true]:cursor-not-allowed"
          data-disabled={!editable()}
        >
          <div
            class="flex flex-col w-80 data-[editable=true]:w-130"
            data-editable={editable()}
          >
            <Show when={versionInfo()}>
              <div class="mb-3 flex flex-row gap-4 items-center">
                <h4 class="text-lg">游戏版本</h4>
                <select
                  class="disabled:pointer-events-none"
                  value={version()}
                  onChange={(e) => setVersion(Number(e.target.value))}
                  disabled={!editable()}
                >
                  <For each={versionInfo()?.supportedGameVersions ?? []}>
                    {(version, idx) => <option value={idx()}>{version}</option>}
                  </For>
                </select>
              </div>
              <h4 class="text-lg mb-3">思考时间</h4>
              <div
                class="flex flex-row gap-2 mb-3 data-[disabled=true]:pointer-events-none"
                data-disabled={!editable()}
              >
                <For
                  each={
                    props.joiningRoomInfo
                      ? [props.joiningRoomInfo.config]
                      : TIME_CONFIGS
                  }
                >
                  {(config) => (
                    <div
                      class="b-1 b-gray-400 rounded-lg p-12px group data-[active=true]:b-slate-500 data-[active=true]:b-2 data-[active=true]:p-11px cursor-pointer data-[active=true]:cursor-default select-none transition-colors"
                      data-active={
                        !!props.joiningRoomInfo || config === timeConfig()
                      }
                      onClick={() => setTimeConfig(config)}
                    >
                      <h5 class="font-bold text-gray-400 group-data-[active=true]:text-black transition-colors mb-2">
                        {config.name}
                      </h5>
                      <ul class="pl-5 list-disc text-gray-400 text-sm group-data-[active=true]:text-slate-500 transition-colors">
                        <li>初始化总时间：{config.initTotalActionTime}s</li>
                        <li>每重投时间：{config.rerollTime}s</li>
                        <li>每回合总时间：{config.roundTotalActionTime}s</li>
                        <li>每行动时间：{config.actionTime}s</li>
                      </ul>
                    </div>
                  )}
                </For>
              </div>
              <div class="mb-3 flex flex-row gap-4 items-center">
                <h4 class="text-lg">公开房间</h4>
                <ToggleSwitch
                  checked={
                    props.joiningRoomInfo
                      ? !props.joiningRoomInfo.config.private
                      : isPublic()
                  }
                  onChange={(e) => setIsPublic(e.target.checked)}
                  disabled={!editable()}
                />
              </div>
              <div class="mb-3 flex flex-row gap-4 items-center">
                <h4 class="text-lg">允许观战</h4>
                <ToggleSwitch
                  checked={
                    props.joiningRoomInfo?.config.watchable ?? watchable()
                  }
                  onChange={(e) => setWatchable(e.target.checked)}
                  disabled={!editable()}
                />
              </div>
              <Show when={editable() && !guestInfo()}>
                <div class="mb-3 flex flex-row gap-4 items-center">
                  <h4 class="text-lg">允许游客加入</h4>
                  <ToggleSwitch
                    checked={allowGuest()}
                    onChange={(e) => setAllowGuest(e.target.checked)}
                  />
                </div>
              </Show>
              <Show when={editable() ? allowGuest() : guestInfo()}>
                <div class="mb-3 alert alert-border-warning">
                  <p class="alert-description break-all">
                    有游客参与的对局记录将不会保存。如果您希望将对局中遇到的问题反馈给开发者，建议您
                    {editable() && !guestInfo()
                      ? "关闭“允许游客加入”"
                      : "使用 GitHub 登录"}
                    。
                  </p>
                </div>
              </Show>
            </Show>
          </div>
          <div class="b-r-gray-200 b-1" />
          <div class="flex flex-col min-w-52 relative">
            <h4 class="text-lg mb-3">选择出战牌组</h4>
            <ul class="flex-grow-1 flex flex-col min-h-0 overflow-auto">
              <For
                each={availableDecks()}
                fallback={<li class="text-gray-500">暂无该版本可用牌组</li>}
              >
                {(deck) => (
                  <li>
                    <SelectableDeckInfo
                      {...deck}
                      checked={selectedDeck() === deck.id}
                      onChange={(e) =>
                        e.target.checked && setSelectedDeck(deck.id)
                      }
                    />
                  </li>
                )}
              </For>
            </ul>
            <div
              class="absolute inset-0 opacity-0 bg-white text-gray-500 pointer-events-none data-[loading=true]:opacity-80 transition flex items-center justify-center"
              data-loading={loadingDecks()}
            >
              加载中…
            </div>
          </div>
        </div>
        <div class="flex-shrink-0 flex flex-row justify-end gap-4">
          <button
            class="btn btn-ghost-red"
            onClick={closeDialog}
          >
            取消
          </button>
          <button
            class="btn btn-solid-green"
            onClick={enterRoom}
            disabled={selectedDeck() === null || entering()}
          >
            {selectedDeck() === null
              ? "请先选择牌组"
              : entering()
                ? "正在加入房间…"
                : editable()
                  ? "创建房间"
                  : "加入房间"}
          </button>
        </div>
      </div>
      <button
        class="absolute right-4 top-4 h-5 w-5 text-black bg-transparent"
        onClick={closeDialog}
      >
        <i class="inline-block h-full w-full i-mdi-window-close" />
      </button>
    </dialog>
  );
}
