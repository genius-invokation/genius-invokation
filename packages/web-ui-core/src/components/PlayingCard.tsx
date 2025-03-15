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
import { WithDelicateUi } from "../primitives/delicate_ui";

export interface PlayingCardProps extends PlayingCardInfo {
  opp: boolean;
}

export function PlayingCard(props: PlayingCardProps) {
  return (
    <div
      class="absolute top-15 data-[opp=false]:left-15 data-[opp=true]:right-15 z-100 shadow-xl w-42 h-72 rounded-6 animate-[playing-card_700ms_both]"
      data-opp={props.opp}
    >
      <WithDelicateUi
        assetId="UI_TeyvatCard_CardFrame_Common"
        fallback={
          <Image
            class="h-full w-full rounded-6 b-white b-6"
            imageId={props.data.definitionId}
          />
        }
      >
        {(frame) => (
          <>
            <Image
              class="absolute inset-0 h-full w-full"
              imageId={props.data.definitionId}
            />
            <div class="absolute inset-0 h-full w-full children-h-full children-w-full">
              {frame}
            </div>
          </>
        )}
      </WithDelicateUi>
    </div>
  );
}
