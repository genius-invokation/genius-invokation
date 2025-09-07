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
import Background from "../svg/ChessboardBackground.svg?fb";
import { CHESSBOARD_COLORS } from "./FunctionButtonGroup";

export interface ChessboardBackgroundProps {
  colorIndex: number;
}

export function ChessboardBackground(props: ChessboardBackgroundProps) {
  return (
    <div class="absolute inset-0 flex items-center justify-center chessboard-bg-container">
      <AspectRatioContainer>
        <div class="absolute aspect-ratio-[16/9] w-full max-h-full top-50% translate-y--50% bg-#443322">
          <Background class="absolute h-full w-full scale-108% transform-origin-c" />
          <div
            class="h-full w-full"
            style={{ "background-color": CHESSBOARD_COLORS[props.colorIndex] }}
          />
        </div>
      </AspectRatioContainer>
    </div>
  );
}
