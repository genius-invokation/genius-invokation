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
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import type { PbSkillInfo } from "@gi-tcg/typings";
import { Image } from "./Image";
import { DiceCost } from "./DiceCost";
import { usePlayerContext } from "./Chessboard";
import { CardDescription } from "./CardDescription";

export interface SkillButtonProps {
  data: PbSkillInfo;
}

export function SkillButton(props: SkillButtonProps) {
  const { allClickable, onClick, allCosts } = usePlayerContext();
  const clickable = () => allClickable.includes(props.data.definitionId);
  const realCost = () => allCosts[props.data.definitionId];
  return (
    <div class="flex flex-col items-center group">
      <div class="relative">
        <button
          type="button"
          class="w-10 h-10 rounded-999 bg-yellow-800 p-1 b-none disabled:opacity-50 hover:bg-yellow-700 active:bg-yellow-900 transition-all disabled:bg-yellow-700 flex items-center justify-center disabled:cursor-not-allowed"
          disabled={!clickable()}
          onClick={() => clickable() && onClick(props.data.definitionId)}
        >
          <Image imageId={props.data.definitionId} class="max-w-full" />
        </button>
        <div class="absolute top-0 right-0 translate-y-[-100%] invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all pb-2 z-30">
          <CardDescription definitionId={props.data.definitionId} />
        </div>
      </div>
      <DiceCost
        class="flex flex-row"
        cost={props.data.definitionCost}
        realCost={realCost()}
      />
    </div>
  );
}
