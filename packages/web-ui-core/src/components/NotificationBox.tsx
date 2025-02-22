// Copyright (C) 2025 Guyutongxue
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
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { getNameSync } from "@gi-tcg/assets-manager";
import type { NotificationBoxInfo } from "./Chessboard";
import { Image } from "./Image";
import { createEffect, Show } from "solid-js";
import { PbSkillType } from "@gi-tcg/typings";

export interface NotificationBoxProps {
  opp: boolean;
  data: NotificationBoxInfo;
}

export function NotificationBox(props: NotificationBoxProps) {
  const typeText = (
    type: NotificationBoxInfo["skillType"],
  ): string | undefined => {
    switch (type) {
      case PbSkillType.NORMAL:
        return "普通攻击";
      case PbSkillType.ELEMENTAL:
        return "元素战技";
      case PbSkillType.BURST:
        return "元素爆发";
      case PbSkillType.CHARACTER_PASSIVE:
        return "被动技能";
    }
  };

  return (
    <div
      class="absolute top-5 z-100 data-[opp=false]:bg-yellow-7 data-[opp=true]:bg-blue-7 text-white flex flex-row gap-2 items-center p-3 rounded-xl shadow-lg h-20 min-w-60 data-[opp=false]:left-5 data-[opp=true]:right-5 animate-[notification-box_700ms_both]"
      data-opp={props.opp}
      style={{
        "--enter-offset": props.opp ? "2rem" : "-2rem",
      }}
    >
      <div>
        <Image
          imageId={props.data.characterDefinitionId}
          class="h-10 w-10 rounded-full"
        />
      </div>
      <div class="flex-col">
        <Show
          when={props.data.type === "switchActive"}
          fallback={
            <>
              <h5 class="font-bold">
                {getNameSync(
                  Math.floor(props.data.skillDefinitionId as number),
                )}
              </h5>
              <p>{typeText(props.data.skillType)}</p>
            </>
          }
        >
          <h5 class="font-bold">
            {props.opp ? "对方" : "我方"}切换出战角色：
            {getNameSync(props.data.characterDefinitionId)}
          </h5>
          <Show when={props.data.skillDefinitionId}>
            <p>{getNameSync(props.data.characterDefinitionId)}</p>
          </Show>
          <Show when={props.data.skillType === "overloaded"}>
            <p>超载</p>
          </Show>
        </Show>
      </div>
    </div>
  );
}
