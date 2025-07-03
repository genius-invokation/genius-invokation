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

import type { ReactionInfo } from "./Chessboard";
import { REACTION_TEXT_MAP } from "./HistoryViewer";
import { Image } from "./Image";

export interface ReactionProps {
  info: ReactionInfo;
}

export function Reaction(props: ReactionProps) {
  const renderingData = () => {
    const data = REACTION_TEXT_MAP[props.info.reactionType];
    const reactionElements = data.elements;
    const applyElement = props.info.incoming;
    const baseElement = reactionElements.find((e) => e !== applyElement)!;
    return {
      name: data.name,
      baseElement,
      applyElement,
    };
  };
  return (
    <div class="h-5.1 grid grid-cols-1 grid-rows-1">
      <div class="grid-area-[1/1] flex flex-row items-center flex-shrink-0 reaction-elements">
        <Image class="reaction-base" imageId={renderingData().baseElement} />
        <Image class="reaction-apply" imageId={renderingData().applyElement} />
      </div>
      <div class="grid-area-[1/1] text-center reaction-name">
        {renderingData().name}
      </div>
    </div>
  );
}
