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
import { StrokedText } from "./StrokedText";
import { Image } from "./Image";
import { createEffect } from "solid-js";

interface ReactionRenderingData {
  elements: DamageType[];
  name: string;
  fgColor: string;
  bgColor: string;
}

export const REACTION_TEXT_MAP: Record<number, ReactionRenderingData> = {
  [Reaction.Melt]: {
    elements: [DamageType.Cryo, DamageType.Pyro],
    name: "融化",
    fgColor: "#ffcc66",
    bgColor: "#994b22",
  },
  [Reaction.Vaporize]: {
    elements: [DamageType.Hydro, DamageType.Pyro],
    name: "蒸发",
    fgColor: "#ffcc66",
    bgColor: "#994b22",
  },
  [Reaction.Overloaded]: {
    elements: [DamageType.Electro, DamageType.Pyro],
    name: "超载",
    fgColor: "#ff809b",
    bgColor: "#802d55",
  },
  [Reaction.Superconduct]: {
    elements: [DamageType.Cryo, DamageType.Electro],
    name: "超导",
    fgColor: "#b4b4ff",
    bgColor: "#5511ee",
  },
  [Reaction.ElectroCharged]: {
    elements: [DamageType.Electro, DamageType.Hydro],
    name: "感电",
    fgColor: "#e19bff",
    bgColor: "#7f2dee",
  },
  [Reaction.Frozen]: {
    elements: [DamageType.Cryo, DamageType.Hydro],
    name: "冻结",
    fgColor: "#99ffff",
    bgColor: "#1199ee",
  },
  [Reaction.SwirlCryo]: {
    elements: [DamageType.Cryo, DamageType.Anemo],
    name: "扩散",
    fgColor: "#66ffcc",
    bgColor: "#406d6d",
  },
  [Reaction.SwirlHydro]: {
    elements: [DamageType.Hydro, DamageType.Anemo],
    name: "扩散",
    fgColor: "#66ffcc",
    bgColor: "#406d6d",
  },
  [Reaction.SwirlPyro]: {
    elements: [DamageType.Pyro, DamageType.Anemo],
    name: "扩散",
    fgColor: "#66ffcc",
    bgColor: "#406d6d",
  },
  [Reaction.SwirlElectro]: {
    elements: [DamageType.Electro, DamageType.Anemo],
    name: "扩散",
    fgColor: "#66ffcc",
    bgColor: "#406d6d",
  },
  [Reaction.CrystallizeCryo]: {
    elements: [DamageType.Cryo, DamageType.Geo],
    name: "结晶",
    fgColor: "#ffd766",
    bgColor: "#664408",
  },
  [Reaction.CrystallizeHydro]: {
    elements: [DamageType.Hydro, DamageType.Geo],
    name: "结晶",
    fgColor: "#ffd766",
    bgColor: "#664408",
  },
  [Reaction.CrystallizePyro]: {
    elements: [DamageType.Pyro, DamageType.Geo],
    name: "结晶",
    fgColor: "#ffd766",
    bgColor: "#664408",
  },
  [Reaction.CrystallizeElectro]: {
    elements: [DamageType.Electro, DamageType.Geo],
    name: "结晶",
    fgColor: "#ffd766",
    bgColor: "#664408",
  },
  [Reaction.Burning]: {
    elements: [DamageType.Dendro, DamageType.Pyro],
    name: "燃烧",
    fgColor: "#ff9c00",
    bgColor: "#843e11",
  },
  [Reaction.Bloom]: {
    elements: [DamageType.Dendro, DamageType.Hydro],
    name: "绽放",
    fgColor: "#00ea55",
    bgColor: "#3b6208",
  },
  [Reaction.Quicken]: {
    elements: [DamageType.Dendro, DamageType.Electro],
    name: "原激化",
    fgColor: "#00ea55",
    bgColor: "#3b6208",
  },
};

export interface ReactionProps {
  info: ReactionInfo;
}

export function ReactionAnimation(props: ReactionProps) {
  const data = () => REACTION_TEXT_MAP[props.info.reactionType];
  const applyElement = () => props.info.incoming;
  const baseElement = () => data().elements.find((e)=> e !== applyElement())!;
  createEffect(()=>console.log(props.info));
  return (
    <div class="h-5 w-21 flex flex-row items-center justify-center relative">
      <div class="absolute top-0 left-8 w-5 h-5 reaction-base-animation" >
        <Image imageId={baseElement()} class="h-5 w-5" />
      </div>
      <div class="absolute top-0 left-8 w-5 h-5 reaction-apply-animation">
        <Image imageId={applyElement()} class="h-5 w-5" />
      </div>
      <div
        class="reaction-text-animation grid grid-cols-[max-content] grid-rows-[max-content] place-items-center"
        style={{
          "--fg-color": data().fgColor,
          "--bg-color": data().bgColor,
        }}
      >
        <div class="grid-area-[1/1] h-5 w-full reaction-text-shadow"/>
        <StrokedText
          class="text-3.5 font-bold text-[var(--fg-color)] grid-area-[1/1] mx-2"
          text={data().name}
          strokeColor="var(--bg-color)"
          strokeWidth={2.5}
        />          
      </div>
    </div>
  );
}
