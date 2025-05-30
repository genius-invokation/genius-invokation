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

import { useNavigate, useParams } from "@solidjs/router";
import { createResource, Switch, Match } from "solid-js";
import { Layout } from "../layouts/Layout";
import axios, { AxiosError } from "axios";
import { UserInfo } from "../components/UserInfo";
import { useAuth } from "../auth";

export function User() {
  const params = useParams();
  const { status: mine } = useAuth();
  const userId = Number(params.id);
  const [userInfo, { refetch }] = createResource(() =>
    axios.get(`users/${userId}`).then((res) => res.data),
  );
  return (
    <Layout>
      <Switch>
        <Match when={userInfo.loading}>正在加载中...</Match>
        <Match when={userInfo.error}>
          加载失败：{" "}
          {userInfo.error instanceof AxiosError
            ? userInfo.error.response?.data.message
            : userInfo.error}
        </Match>
        <Match when={userInfo()}>
          <div class="w-full flex flex-row justify-center">
            <UserInfo
              {...userInfo()}
              editable={userInfo()?.id === mine()?.id}
              onUpdate={refetch}
            />
          </div>
        </Match>
      </Switch>
    </Layout>
  );
}
