// Copyright (C) 2025 Guyutongxue, CherryC9H13N
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

import { AspectRatioContainer } from "./AspectRatioContainer";

export interface ChessboardBackgroundProps {
  color?: string;
}

export function ChessboardBackground(props: ChessboardBackgroundProps) {
  return (
    <div class="absolute inset-0 flex items-center justify-center chessboard-bg-container">
      <AspectRatioContainer>
        <div class="absolute aspect-ratio-[16/9] w-full max-h-full top-50% translate-y--50% bg-#443322">
          {/* <WithDelicateUi assetId={"ChessboardBackground"} fallback={<></>}>
            {(image) => (
              <div class="absolute h-full w-full scale-108% transform-origin-c">
                <div class="children-h-full children-w-full">{image}</div>
              </div>
            )}
          </WithDelicateUi> */}
          <div
            class="absolute inset-10 rounded-15% brightness-120 b-5 b-#221100 shadow-[inset_0_0_16px_#000000]"
            style={{ "background-color": props.color ?? "#c0cac3" }}
          />
          <div class="absolute top-49.5% left-5% h-1% w-90% bg-black/5"/>
        </div>
      </AspectRatioContainer>
    </div>
  );
}
