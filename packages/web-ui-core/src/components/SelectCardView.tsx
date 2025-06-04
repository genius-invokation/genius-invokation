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

import { createSignal, For, Show, Switch, Match } from "solid-js";
import { Button } from "./Button";
import { Image } from "./Image";
import { SelectingIcon } from "./SelectingIcon";
import type { ChessboardViewType } from "./Chessboard";
import { SpecialViewBackdrop } from "./ViewPanelBackdrop";
import { WithDelicateUi } from "../primitives/delicate_ui";
import { DiceCost } from "./DiceCost";
import { CardFace } from "./Card";

export interface SelectCardViewProps {
  candidateIds: number[];
  nameGetter: (id: number) => string | undefined;
  onClickCard: (id: number) => void;
  onConfirm: (id: number) => void;
  onVisible: () => void;
}

export function SelectCardView(props: SelectCardViewProps) {
  const [selectedId, setSelectedId] = createSignal<number | null>(null);

  return (
    <div class="absolute inset-0 flex flex-col items-center justify-center gap-10 select-none">
      <h3 class="font-bold text-3xl z-1">挑选卡牌</h3>
      <ul class="flex flex-row gap-16 z-1">
        <For each={props.candidateIds}>
          {(cardId) => (
            <li
              class="h-36 w-21 relative"
              onClick={() => {
                setSelectedId(cardId);
                props.onClickCard(cardId);
              }}
            >
              <CardFace definitionId={cardId} />
              <Show when={selectedId() === cardId}>
                <div class="absolute h-full w-full backface-hidden flex items-center justify-center">
                  <SelectingIcon />
                </div>
              </Show>
              <DiceCost
                class="absolute left-1.8 top--1 translate-x--50% backface-hidden flex flex-col gap-1"
                cost={[]}
                size={36}
              />
              <div class="absolute h-full w-full rounded-xl backface-hidden rotate-y-180 translate-z--0.1px bg-gray-600 b-gray-700 b-4" />
              <div class="absolute h-10 w-full bottom--12 font-size-4 text-center color-black/60 font-bold">
                {props.nameGetter(cardId)}
              </div>
            </li>
          )}
        </For>
      </ul>
      <div
        class="invisible pointer-events-none data-[shown]:visible data-[shown]:pointer-events-auto z-1"
        bool:data-shown={selectedId() !== null}
      >
        <Button
          onClick={() => {
            const id = selectedId();
            if (id !== null) {
              props.onConfirm(id);
            }
          }}
        >
          确定
        </Button>
      </div>
    </div>
  );
}
