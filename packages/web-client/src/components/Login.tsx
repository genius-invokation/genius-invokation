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

import { createSignal } from "solid-js";
import { GITHUB_AUTH_REDIRECT_URL } from "../config";
import { useAuth } from "../auth";

export function Login() {
  const CLIENT_ID = "Iv23liMGX6EkkrfUax8B";
  const REDIRECT_URL = encodeURIComponent(GITHUB_AUTH_REDIRECT_URL);
  const { loginGuest } = useAuth();

  const showGuestHint = () => {
    window.alert(`在游客模式下：
- 您的牌组将保存在本地，不会在云端同步；
- 您的对局记录将不会在任何地方保存。

如果您希望将对局中的 bug 反馈给开发者，那么强烈建议您使用 GitHub 登录以便我们在数据库中查询对局记录。`);
  };

  const [guestNameValid, setGuestNameValid] = createSignal(false);

  const guestLogin = async (e: SubmitEvent) => {
    e.preventDefault();
    const form = new FormData(e.target as HTMLFormElement);
    const name = form.get("guestName") as string;
    loginGuest(name);
  };

  return (
    <div class="w-80 flex flex-col items-stretch text-xl my-8 gap-10">
      <a
        href={`https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URL}`}
        class="flex flex-row gap-2 btn btn-solid-black h-2.8em"
      >
        <i class="block i-mdi-github" />
        <span>推荐使用 GitHub 登录</span>
      </a>
      <hr />
      <div class="flex flex-col gap-1">
        <p class="text-gray-500 text-sm">
          或者以{" "}
          <span class="text-blue-400 cursor-pointer" onClick={showGuestHint}>
            游客身份
          </span>{" "}
          继续……
        </p>
        <form class="flex flex-row items-stretch" onSubmit={guestLogin}>
          <input
            class="input input-solid rounded-r-0 b-r-0 h-2.2rem text-1rem"
            name="guestName"
            maxLength={64}
            placeholder="起一个响亮的名字吧！"
            pattern=".*[^\s].*"
            onInput={(e) => setGuestNameValid(e.target.checkValidity())}
            autofocus
            required
          />
          <button
            type="submit"
            class="flex-shrink-0 btn btn-solid rounded-l-0 h-2.2rem text-1rem"
            disabled={!guestNameValid()}
          >
            <span>确认</span>
          </button>
        </form>
      </div>
    </div>
  );
}
