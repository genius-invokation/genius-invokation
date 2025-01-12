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

import { IS_BETA } from "@gi-tcg/config";
import { Show } from "solid-js";
import dayjs from "dayjs";
import localize from "dayjs/plugin/localizedFormat";
import "dayjs/locale/zh-cn";
import { useVersionContext } from "../App";

dayjs.extend(localize).locale("zh-cn");

export function Footer() {
  const { versionInfo } = useVersionContext();
  return (
    <footer class="flex flex-row gap-4 p-4 text-sm text-gray-500">
      <div>© 2024 Guyutongxue</div>
      <div>
        <a
          class="text-blue-400"
          href="https://github.com/genius-invokation/genius-invokation"
          target="_blank"
        >
          GitHub
        </a>
      </div>
      <div>
        许可{" "}
        <a
          class="text-blue-400"
          href="https://www.gnu.org/licenses/agpl-3.0.html"
          target="_blank"
        >
          AGPL-3.0-or-later
        </a>
      </div>
      <Show when={versionInfo()}>
        <div>
          游戏版本{" "}
          {IS_BETA ? (
            <span class="text-red-300">最新测试版</span>
          ) : (
            versionInfo().currentGameVersion
          )}
        </div>
        <div>
          模拟器版本 {versionInfo().coreVersion} (
          <a
            title={versionInfo().revision.message}
            class="text-blue-400"
            href={`https://github.com/genius-invokation/genius-invokation/commit/${
              versionInfo().revision.hash
            }`}
            target="_blank"
          >
            {dayjs(versionInfo().revision.date).format("ll HH:mm:ss")}
          </a>
          )
        </div>
      </Show>
    </footer>
  );
}
