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

import { Show } from "solid-js";
import { UserInfo as UserInfoT } from "../App";
import { getAvatarUrl } from "../utils";
import { A } from "@solidjs/router";

export interface UserInfoProps extends UserInfoT {}

export function UserInfo(props: UserInfoProps) {
  const avatarUrl = () => getAvatarUrl(props.id);
  return (
    <div class="flex flex-row container gap-4">
      <div class="flex flex-col w-45">
        <div class="rounded-full w-40 h-40 b-solid b-1 b-gray-200 flex items-center justify-center mb-3">
          <Show when={avatarUrl()}>
            <img src={avatarUrl()} class="w-36 h-36 [clip-path:circle()]" />
          </Show>
        </div>
      </div>
      <div class="flex-grow flex flex-col items-start">
        <div class="flex items-end gap-2 mb-5">
          <h2 class="text-2xl font-bold">用户信息</h2>
          <span class="text-gray-4 text-sm font-300">ID: {props.id}</span>
        </div>
        <dl class="flex flex-row gap-4 items-center mb-2">
          <dt class="font-bold">昵称</dt>
          <dd class="flex flex-row gap-4 items-center h-8">{props.name}</dd>
        </dl>
        <hr class="h-1 w-full text-gray-4 my-4" />
        <A class="btn btn-ghost" href="/decks">
          我的牌组…
        </A>
      </div>
    </div>
  );
}
