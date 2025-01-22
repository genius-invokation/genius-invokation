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

import type { PlayCost } from "@gi-tcg/static-data";
import { For } from "solid-js";

export interface PlayCostProps {
  playCost: PlayCost[];
}

const COLOR_MAP: Record<string, string> = {
  GCG_COST_DICE_VOID: "#4a4a4a",
  GCG_COST_DICE_ELECTRO: "#b380ff",
  GCG_COST_DICE_PYRO: "#ff9955",
  GCG_COST_DICE_DENDRO: "#a5c83b",
  GCG_COST_DICE_CRYO: "#55ddff",
  GCG_COST_DICE_GEO: "#ffcc00",
  GCG_COST_DICE_HYDRO: "#3e99ff",
  GCG_COST_DICE_ANEMO: "#80ffe6",
  GCG_COST_DICE_OMNI: "#dcd4c2",
  GCG_COST_ENERGY: "#d0cc51",
  GCG_COST_LEGEND: "linear-gradient(135deg,#a855f7,#3b82f6)",
};

export function PlayCostList(props: PlayCostProps) {
  const glyph = (type: string) => {
    if (type === "GCG_COST_LEGEND") {
      return "\u25c6";
    } else if (type === "GCG_COST_ENERGY") {
      return "\u2726";
    } else {
      return "\u2b22";
    }
  };
  const textColor = (type: string) => {
    if (["GCG_COST_ENERGY", "GCG_COST_DICE_OMNI"].includes(type)) {
      return "black";
    } else {
      return "white";
    }
  };

  return (
    <div class="flex flex-row">
      <For each={props.playCost}>
        {(item) => (
          <div class="relative">
            <div
              class="line-height-none text-2xl"
              style={{ color: COLOR_MAP[item.type] }}
            >
              {glyph(item.type)}
            </div>
            <div
              class="line-height-none absolute left-50% top-50% translate-x--50% translate-y--50% text-xs"
              style={{ color: textColor(item.type) }}
            >
              {item.count}
            </div>
          </div>
        )}
      </For>
    </div>
  );
}
