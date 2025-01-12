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

import { For, Match, Switch, createResource, Accessor } from "solid-js";
import { Layout } from "../layouts/Layout";
import axios from "axios";
import { A } from "@solidjs/router";
import { DeckBriefInfo } from "../components/DeckBriefInfo";
import { Deck } from "@gi-tcg/utils";
import { useGuestDecks } from "../guest";
import { useAuth } from "../auth";

export interface DeckInfo extends Deck {
  id: number;
  name: string;
  code: string;
  requiredVersion: number;
}

interface DecksResponse {
  count: number;
  data: DeckInfo[];
}

export interface UseDecksResult {
  readonly decks: Accessor<DecksResponse>;
  readonly loading: Accessor<boolean>;
  readonly error: Accessor<any>;
  readonly refetch: () => void;
}

export function useDecks(): UseDecksResult {
  const { status } = useAuth();
  const EMPTY = { count: 0, data: [] };
  const [userDecks, { refetch }] = createResource(
    () => axios.get<DecksResponse>("decks").then((res) => res.data),
    {
      initialValue: EMPTY,
    },
  );
  const [guestDecks] = useGuestDecks();
  return {
    decks: () => {
      const { type } = status();
      if (type === "guest") {
        const data = guestDecks();
        return {
          data,
          count: data.length,
        };
      } else if (type === "user" && userDecks.state === "ready") {
        return userDecks();
      } else {
        return EMPTY;
      }
    },
    loading: () => status().type === "user" && userDecks.loading,
    error: () => status().type === "user" ? userDecks.error : void 0,
    refetch,
  };
}

export function Decks() {
  const { decks, loading, error, refetch } = useDecks();
  return (
    <Layout>
      <div class="container mx-auto">
        <div class="flex flex-row gap-4 items-center mb-5">
          <h2 class="text-2xl font-bold">我的牌组</h2>
          <A class="btn btn-outline-green" href="/decks/new">
            <i class="i-mdi-plus" /> 添加
          </A>
        </div>
        <Switch>
          <Match when={loading()}>正在加载中...</Match>
          <Match when={error()}>加载失败：{error()?.message ?? String(error())}</Match>
          <Match when={true}>
            <ul class="flex flex-row flex-wrap gap-3">
              <For
                each={decks().data}
                fallback={
                  <li class="p-4 text-gray-5">暂无牌组，可点击 + 添加</li>
                }
              >
                {(deckData) => (
                  <DeckBriefInfo
                    editable
                    onDelete={() => refetch()}
                    {...deckData}
                  />
                )}
              </For>
            </ul>
          </Match>
        </Switch>
      </div>
    </Layout>
  );
}
