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
import { createResource, For, Match, Show, Switch } from "solid-js";
import { getData } from "@gi-tcg/assets-manager";
import { Character } from "./Character";

export type StateType = AnyState["definition"]["type"] | "skill";

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

export type NestedStyle = "inline" | "interactive";

export interface CardDataViewerProps {
  inputs: ViewerInput[];
  assetsApiEndPoint?: string;
  includesImage: boolean;
  nestedStyle: NestedStyle;
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
  return (
    <div class="gi-tcg-card-data-viewer flex flex-row justify-begin">
      <For each={grouped().character}>
        {(input) =><div class="bg-yellow-1 b-yellow-8 b-solid b-1 rounded-md">
          <Character {...props} input={input} />
        </div>}
      </For>
    </div>
  );
}
