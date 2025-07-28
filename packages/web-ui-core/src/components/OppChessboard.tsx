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

import { createMemo, For, Index, Show, splitProps } from "solid-js";
import type { ChessboardProps } from "./Chessboard";
import { Dice } from "./Dice";
import { DicePanel } from "./DicePanel";
import type { DiceType } from "@gi-tcg/typings";
import { Key } from "@solid-primitives/keyed";
import { Card, CardFace } from "./Card";
import { DiceCostAsync } from "./SelectCardView";
import { useUiContext } from "../hooks/context";

export function OppChessboard(props: ChessboardProps) {
  const { assetsManager } = useUiContext();
  const [localProps, elProps] = splitProps(props, [
    "who",
    "rotation",
    "autoHeight",
    "timer",
    "myPlayerInfo",
    "oppPlayerInfo",
    "gameEndExtra",
    "data",
    "actionState",
    "history",
    "viewType",
    "selectCardCandidates",
    "doingRpc",
    "onStepActionState",
    "onRerollDice",
    "onSwitchHands",
    "onSelectCard",
    "onGiveUp",
    "class",
    "children",
  ]);
  const dice = createMemo(() => props.data.state.player[props.who].dice);
  const hands = createMemo(() => props.data.state.player[props.who].handCard);
  const handOffset = createMemo(() => 94 / Math.max(1, hands().length - 1));
  return (
    <div
      class={`absolute inset-0 h-full w-full pointer-events-none ${
        localProps.class ?? ""
      }`}
      data-gi-tcg-opp-chessboard
      {...elProps}
    >
      <div class="absolute left-50% text-3xl">{localProps.viewType}</div>
      <Show when={localProps.viewType === "rerollDice"}>
        <div class="absolute left-50 top-0 w-50 h-30 b-solid b-white b-2 bg-green-50 rounded-xl overflow-clip flex flex-col justify-center items-center gap-4 ">
          <div>对方重掷界面</div>
          <ul class="grid grid-rows-2 grid-flow-col gap-2">
            <Index each={dice()}>
              {(die, index) => (
                <li>
                  <Dice type={die()} size={24} />
                </li>
              )}
            </Index>
          </ul>
        </div>
      </Show>
      <Show when={localProps.viewType === "selectCard"}>
        <div class="absolute left-50 top-0 w-50 h-30 b-solid b-white b-2 bg-green-50 rounded-xl overflow-clip flex flex-col justify-center items-center gap-4 ">
          <div>对方挑选界面</div>
          <ul class="flex flex-row gap-1">
            <For each={props.selectCardCandidates}>
              {(cardId) => (
                <li class="flex flex-col items-center">
                  <div class="h-12 w-7 relative">
                    <CardFace definitionId={cardId} />
                    {/* <DiceCostAsync cardDefinitionId={cardId} size={12} /> */}
                  </div>
                  <div class="mt-2 w-8 text-center font-size-2 text-center color-black/60 font-bold">
                    {assetsManager.getNameSync(cardId)}
                  </div>
                </li>
              )}
            </For>
          </ul>
        </div>
      </Show>
      <div class="absolute top-0 bottom-[calc(var(--actual-height,33.75rem)/2+11rem)] left-100 right-21 b-solid b-white b-2 bg-green-50 rounded-xl overflow-clip">
        <div class="absolute bottom-2 left-2 right-2 h-36 ">
          <Key each={hands()} by="id">
            {(card, index) => (
              <Card
                data={card()}
                enableShadow
                id={card().id}
                kind="myHand"
                playStep={null}
                uiState={{
                  type: "cardStatic",
                  transform: {
                    x: index() * handOffset(),
                    y: 0,
                    z: 0,
                    ry: 1,
                    rz: 0,
                  },
                  draggingEndAnimation: false,
                  isAnimating: false,
                }}
                enableTransition={false}
                selected={false}
                toBeSwitched={false}
                tuneStep={null}
              />
            )}
          </Key>
        </div>
      </div>
      <DicePanel
        state="hidden"
        dice={dice() as DiceType[]}
        disabledDiceTypes={[]}
        maxSelectedCount={null}
        onSelectDice={() => {}}
        onStateChange={() => {}}
        selectedDice={[]}
      />
    </div>
  );
}
