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

import { DamageType, Reaction } from "@gi-tcg/typings";
import type { ReactionInfo } from "./Chessboard";
import { createEffect, createMemo } from "solid-js";
import { StrokedText } from "./StrokedText";
import { Image } from "./Image";

interface ReactionRenderingData {
  element: DamageType[];
  name: string;
  fgColor: string;
  bgColor: string;
}

export const REACTION_TEXT_MAP: Record<number, ReactionRenderingData> = {
  [Reaction.Melt]: {
    element: [DamageType.Cryo, DamageType.Pyro],
    name: "融化",
    fgColor: "#ffcc66",
    bgColor: "#994b22",
  },
  [Reaction.Vaporize]: {
    element: [DamageType.Hydro, DamageType.Pyro],
    name: "蒸发",
    fgColor: "#ffcc66",
    bgColor: "#994b22",
  },
  [Reaction.Overloaded]: {
    element: [DamageType.Electro, DamageType.Pyro],
    name: "超载",
    fgColor: "#ff809b",
    bgColor: "#802d55",
  },
  [Reaction.Superconduct]: {
    element: [DamageType.Cryo, DamageType.Electro],
    name: "超导",
    fgColor: "#b4b4ff",
    bgColor: "#5511ee",
  },
  [Reaction.ElectroCharged]: {
    element: [DamageType.Electro, DamageType.Hydro],
    name: "感电",
    fgColor: "#e19bff",
    bgColor: "#7f2dee",
  },
  [Reaction.Frozen]: {
    element: [DamageType.Cryo, DamageType.Hydro],
    name: "冻结",
    fgColor: "#99ffff",
    bgColor: "#1199ee",
  },
  [Reaction.SwirlCryo]: {
    element: [DamageType.Cryo, DamageType.Anemo],
    name: "扩散",
    fgColor: "#66ffcc",
    bgColor: "#406d6d",
  },
  [Reaction.SwirlHydro]: {
    element: [DamageType.Hydro, DamageType.Anemo],
    name: "扩散",
    fgColor: "#66ffcc",
    bgColor: "#406d6d",
  },
  [Reaction.SwirlPyro]: {
    element: [DamageType.Pyro, DamageType.Anemo],
    name: "扩散",
    fgColor: "#66ffcc",
    bgColor: "#406d6d",
  },
  [Reaction.SwirlElectro]: {
    element: [DamageType.Electro, DamageType.Anemo],
    name: "扩散",
    fgColor: "#66ffcc",
    bgColor: "#406d6d",
  },
  [Reaction.CrystallizeCryo]: {
    element: [DamageType.Cryo, DamageType.Geo],
    name: "结晶",
    fgColor: "#ffd766",
    bgColor: "#664408",
  },
  [Reaction.CrystallizeHydro]: {
    element: [DamageType.Hydro, DamageType.Geo],
    name: "结晶",
    fgColor: "#ffd766",
    bgColor: "#664408",
  },
  [Reaction.CrystallizePyro]: {
    element: [DamageType.Pyro, DamageType.Geo],
    name: "结晶",
    fgColor: "#ffd766",
    bgColor: "#664408",
  },
  [Reaction.CrystallizeElectro]: {
    element: [DamageType.Electro, DamageType.Geo],
    name: "结晶",
    fgColor: "#ffd766",
    bgColor: "#664408",
  },
  [Reaction.Burning]: {
    element: [DamageType.Dendro, DamageType.Pyro],
    name: "燃烧",
    fgColor: "#ff9c00",
    bgColor: "#843e11",
  },
  [Reaction.Bloom]: {
    element: [DamageType.Dendro, DamageType.Hydro],
    name: "绽放",
    fgColor: "#00ea55",
    bgColor: "#3b6208",
  },
  [Reaction.Quicken]: {
    element: [DamageType.Dendro, DamageType.Electro],
    name: "原激化",
    fgColor: "#00ea55",
    bgColor: "#3b6208",
  },
};

export interface ReactionAnimationProps {
  info: ReactionInfo;
  shown: boolean;
}

export function ReactionAnimation(props: ReactionAnimationProps) {
  const reactionElement = createMemo(() => REACTION_TEXT_MAP[props.info.reactionType]);
  const applyElement = createMemo(() => props.info.incoming);
  const baseElement = createMemo(() => reactionElement().element.find((e)=> e !== applyElement()));
  return (
    <div class="h-5 w-21 flex flex-row items-center relative">
      <div
        class="absolute top-0 left-8 w-5 h-5 invisible reaction-base-animation opacity-0"
        bool:data-shown={props.shown}
      >
        <Image imageId={baseElement()!} class="h-5 w-5" />
      </div>
      <div
        class="absolute top-0 left-8 w-5 h-5 invisible reaction-apply-animation opacity-0"
        bool:data-shown={props.shown}
      >
        <Image imageId={applyElement()} class="h-5 w-5" />
      </div>
      <div
        class="absolute h-5 w-21 invisible reaction-text-animation opacity-100 scale-100 flex flex-row items-center justify-center"
        bool:data-shown={props.shown}
        style={{
          "--fg-color": reactionElement().fgColor,
          "--bg-color": reactionElement().bgColor,
        }}
      >
        <StrokedText
          class="text-3.5 font-bold text-[var(--fg-color)]"
          text={reactionElement().name}
          strokeColor="var(--bg-color)"
          strokeWidth={2.5}
        />
      </div>
    </div>
  );
}
