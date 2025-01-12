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

import { Accessor, createResource } from "solid-js";
import { GuestInfo, useGuestInfo } from "./guest";
import axios from "axios";

export interface UserInfo {
  type: "user";
  id: number;
  login: string;
  name?: string;
}

const NOT_LOGIN = {
  type: "notLogin",
  name: "",
  id: null,
} as const;

type NotLogin = typeof NOT_LOGIN;

type AuthStatus = UserInfo | GuestInfo | NotLogin;

export interface Auth {
  readonly status: Accessor<AuthStatus>;
  readonly loading: Accessor<boolean>;
  readonly error: Accessor<any>;
  readonly refresh: () => Promise<void>;
  readonly loginGuest: (name: string) => void;
  readonly setGuestId: (id: string) => void;
  readonly logout: () => Promise<void>;
}

const [user, { refetch: refetchUser }] = createResource<UserInfo | NotLogin>(
  () =>
    axios.get<UserInfo>("users/me").then(({ data }) =>
      data
        ? {
            ...data,
            type: "user",
            name: data.name ?? data.login,
          }
        : NOT_LOGIN,
    ),
);

export const useAuth = (): Auth => {
  const [guestInfo, setGuestInfo] = useGuestInfo();
  return {
    status: () => {
      return guestInfo() ?? (user.state === "ready" ? user() : NOT_LOGIN);
    },
    loading: () => guestInfo() === null && user.loading,
    error: () => (guestInfo() === null ? user.error : void 0),
    refresh: async () => {
      refetchUser();
    },
    loginGuest: async (name: string) => {
      setGuestInfo({
        type: "guest",
        name,
        id: null,
      });
    },
    setGuestId: (id: string) => {
      setGuestInfo(
        (oldInfo) =>
          oldInfo && {
            ...oldInfo,
            id,
          },
      );
    },
    logout: async () => {
      localStorage.removeItem("accessToken");
      await refetchUser();
      setGuestInfo(null);
    },
  };
};
