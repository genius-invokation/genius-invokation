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

import type { AnyState } from "@gi-tcg/core";
import { createEffect, createSignal, For, onMount, Show } from "solid-js";
import { getNameSync } from "@gi-tcg/assets-manager";
import { Character, Keyword, type CardDataProps } from "./Entity";
import { createStore } from "solid-js/store";

export type StateType = AnyState["definition"]["type"] | "skill" | "keyword";

export type ViewerInput =
  | {
      from: "definitionId";
      definitionId: number;
      type: StateType;
    }
  | {
      from: "state";
      id: number;
      type: StateType;
      definitionId: number;
      variableValue?: number;
      descriptionDictionary: {
        [key: string]: string;
      };
    };

export interface CardDataViewerProps {
  inputs: ViewerInput[];
  assetsApiEndPoint?: string;
  includesImage: boolean;
}

export interface CardDataViewerContainerProps extends CardDataViewerProps {
  shown: boolean;
}

export function CardDataViewerContainer(props: CardDataViewerContainerProps) {
  return (
    <Show when={props.shown}>
      <CardDataViewer {...props} />
    </Show>
  );
}

function CardDataViewer(props: CardDataViewerProps) {
  const grouped = () => Object.groupBy(props.inputs, (i) => i.type);
  const [explainKeyword, setExplainKeyword] = createSignal<number | null>(null);
  const onRequestExplain = (definitionId: number) => {
    setExplainKeyword(definitionId);
  };

  return (
    <div class="gi-tcg-card-data-viewer">
      <div class="flex flex-row justify-begin items-start select-none gap-2">
        <For each={grouped().character}>
          {(input) => (
            <div class="bg-yellow-1 b-yellow-8 text-yellow-9 b-solid b-1 rounded-md p-2 w-80">
              <Character
                {...props}
                input={input}
                onRequestExplain={onRequestExplain}
              />
            </div>
          )}
        </For>
        <Show when={explainKeyword()}>
          {(defId) => (
            <div class="relative bg-yellow-1 b-yellow-8 text-yellow-9 b-solid b-1 rounded-md p-2 w-80">
              <Keyword {...props} definitionId={defId()} />
              <div
                class="absolute right-1 top-1 text-xs"
                onClick={() => setExplainKeyword(null)}
              >
                &#10060;
              </div>
            </div>
          )}
        </Show>
      </div>
    </div>
  );
}
