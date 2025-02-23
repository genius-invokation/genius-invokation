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

import type { DiceType } from "@gi-tcg/typings";
import { Index, Match, Show, Switch } from "solid-js";
import { Dice } from "./Dice";

export type DicePanelState = "hidden" | "wrapped" | "visible";

export interface DicePanelProps {
  dice: DiceType[];
  disabledDiceTypes: DiceType[];
  selectedDice: boolean[];
  onSelectDice: (selectedDice: boolean[]) => void;
  state: DicePanelState;
  onStateChange: (state: DicePanelState) => void;
}

export function DicePanel(props: DicePanelProps) {
  const toggleDice = (dice: DiceType, index: number) => {
    if (props.disabledDiceTypes.includes(dice)) {
      return;
    }
    const rawSelectedDice = props.selectedDice;
    const selectedDice = Array.from(props.dice, (_, i) => !!rawSelectedDice[i]);
    selectedDice[index] = !selectedDice[index];
    props.onSelectDice(selectedDice);
  };
  const toggleState = () => {
    if (props.state === "visible") {
      props.onStateChange("wrapped");
    } else {
      props.onStateChange("visible");
    }
  };
  return (
    <>
      <div
        class="absolute right--36 data-[state=visible]:right-0 data-[state=wrapped]:right--22 top-0 bottom-0 pr-4 gap-2 w-36 h-full flex flex-row items-center bg-yellow-700 transition-right"
        data-state={props.state}
      >
        <div
          class="text-yellow-500 h-60 flex items-center select-none cursor-pointer"
          onClick={toggleState}
        >
          {props.state === "visible" ? "\u276F" : "\u276E"}
        </div>
        <div class="flex-grow h-full flex items-center justify-center">
          <Show when={props.state === "visible"}>
            <ul class="grid grid-cols-2 gap-x-1 gap-y-2">
              <Index each={props.dice}>
                {(dice, index) => (
                  <li
                    class="data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed"
                    bool:data-disabled={props.disabledDiceTypes.includes(
                      dice(),
                    )}
                    onClick={() => toggleDice(dice(), index)}
                  >
                    <Dice
                      type={dice()}
                      size={50}
                      selected={props.selectedDice[index]}
                    />
                  </li>
                )}
              </Index>
            </ul>
          </Show>
        </div>
      </div>
      <div
        class="absolute right-0 top-0 bottom-0 opacity-0 pointer-events-none data-[shown]:opacity-100 data-[shown]:pointer-events-auto transition-opacity"
        bool:data-shown={props.state !== "visible"}
      >
        <div class="m-2 flex flex-col select-none gap-2 items-center">
          <div class="h-8 w-8 flex items-center justify-center rounded-full bg-yellow-100 b-yellow-800 b-1 text-yellow-800">
            {props.dice.length}
          </div>
          <ul class="flex flex-col gap-2 items-center">
            <Index each={props.dice}>
              {(dice, index) => (
                <li
                  onClick={() =>
                    props.state === "wrapped" && toggleDice(dice(), index)
                  }
                >
                  <Dice
                    type={dice()}
                    selected={
                      props.state === "wrapped" && props.selectedDice[index]
                    }
                  />
                </li>
              )}
            </Index>
          </ul>
        </div>
      </div>
    </>
  );
}
