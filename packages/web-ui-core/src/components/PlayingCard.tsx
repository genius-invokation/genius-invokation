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

import { Image } from "./Image";
import type { PlayingCardInfo } from "./Chessboard";
import CardFrameNormal from "../svg/CardFrameNormal.svg?fb";

export interface PlayingCardProps extends PlayingCardInfo {
  opp: boolean;
}

export function PlayingCard(props: PlayingCardProps) {
  return (
    <div
      class="absolute top-50% -translate-y-42.5 data-[opp=false]:left-30 data-[opp=true]:right-30 z-100 shadow-xl w-35 h-60 rounded-6 animate-[playing-card_700ms_both]"
      data-opp={props.opp}
    >
      <div class="absolute inset-0.5 bg-#bdaa8a rounded-3" />
      <Image
        class="absolute inset-0 h-full w-full p-1px"
        imageId={props.data.definitionId}
        fallback="card"
      />
      <CardFrameNormal class="absolute inset-0 h-full w-full pointer-events-none" />
    </div>
  );
}
