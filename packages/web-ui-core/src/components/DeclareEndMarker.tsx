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

import type { PbPhaseType } from "@gi-tcg/typings";
import { Button } from "./Button";
import { WithDelicateUi } from "../primitives/delicate_ui";

export interface DeclareEndMarkerProps {
  class?: string;
  markerClickable: boolean;
  showButton: boolean;
  opp: boolean;
  roundNumber: number;
  phase: PbPhaseType;
  onClick: (e: MouseEvent) => void;
}

export function DeclareEndMarker(props: DeclareEndMarkerProps) {
  const onClick = (e: MouseEvent) => {
    e.stopPropagation();
    props.onClick(e);
  };
  return (
    <div
      class={`flex flex-row items-center pointer-events-none select-none gap-3 ${
        props.class ?? ""
      }`}
    >
      <WithDelicateUi
        assetId={[
          "UI_Gcg_Round_Button_01",
          "UI_Gcg_Round_Button_02",
          "UI_Gcg_Round_Button_03",
          "UI_Gcg_Round_Button_04",
        ]}
        dataUri
        fallback={
          <div
            class="pointer-events-auto h-16 w-16 rounded-full data-[opp=true]:bg-blue-300 data-[opp=false]:bg-yellow-300 b-white b-3 flex flex-col items-center justify-center cursor-not-allowed data-[clickable]:cursor-pointer data-[clickable]:hover:bg-yellow-400 transition-colors"
            data-opp={props.opp}
            onClick={onClick}
            bool:data-clickable={props.markerClickable}
          >
            T{props.roundNumber}
          </div>
        }
      >
        {(opp, normal, hover, active) => (
          <div
            class="relative h-24 w-20 flex items-center justify-center declare-end-marker-img"
            style={{
              "--img-url": `url("${
                props.opp ? opp : props.showButton ? hover : normal
              }")`,
              "--img-hover-url": `url("${props.opp ? opp : hover}")`,
              "--img-active-url": `url("${props.opp ? opp : active}")`,
            }}
          >
            <button
              class="block pointer-events-auto h-12 w-12 rounded-full declare-end-marker-img-button data-[opp=true]:color-white"
              data-opp={props.opp}
              onClick={onClick}
              bool:data-clickable={props.markerClickable}
            >
              T{props.roundNumber}
            </button>
          </div>
        )}
      </WithDelicateUi>
      <div
        class="opacity-0 data-[shown]:pointer-events-auto data-[shown]:opacity-100 transition-opacity"
        bool:data-shown={props.showButton}
      >
        <Button onClick={onClick}>宣布结束</Button>
      </div>
    </div>
  );
}
