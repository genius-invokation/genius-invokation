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

import type { JSX } from "solid-js/jsx-runtime";
import {
  CardDataViewerContainer,
  type ViewerInput,
  type NestedStyle,
  type StateType,
} from "./CardDataViewer";
import { createSignal } from "solid-js";
import type { PbCharacterState, PbEntityState } from "@gi-tcg/typings";

export interface RegisterResult {
  readonly CardDataViewer: () => JSX.Element;
  readonly showCharacter: (id: number) => void;
  readonly showSkill: (id: number) => void;
  readonly showCard: (id: number) => void;
  readonly showStates: {
    (character: PbCharacterState, combatStatuses: PbEntityState[]): void;
    (entity: PbEntityState): void;
  };
  readonly hide: () => void;
}

export interface CreateCardDataViewerOption {
  assetsApiEndPoint?: string;
  includesImage?: boolean;
  nestedStyle?: NestedStyle;
}

export function createCardDataViewer(
  option: CreateCardDataViewerOption = {},
): RegisterResult {
  const [shown, setShown] = createSignal(false);
  const [inputs, setInputs] = createSignal<ViewerInput[]>([]);

  const showDef = (definitionId: number, type: StateType) => {
    setInputs([
      {
        from: "definitionId",
        definitionId,
        type,
      },
    ]);
    setShown(true);
  };

  return {
    CardDataViewer: () => (
      <CardDataViewerContainer
        shown={shown()}
        inputs={inputs()}
        includesImage={option.includesImage ?? false}
        nestedStyle={option.nestedStyle ?? "interactive"}
        assetsApiEndPoint={option.assetsApiEndPoint}
      />
    ),
    showCard: (id) => {
      showDef(id, "card");
    },
    showCharacter: (id) => {
      showDef(id, "character");
    },
    showSkill: (id) => {
      showDef(id, "skill");
    },
    showStates: (
      state: PbCharacterState | PbEntityState,
      combatStatuses?: PbEntityState[],
    ) => {
      if (Array.isArray(combatStatuses)) {

      } else {
        setInputs([{
          from: "state",
          id: state.id,
          type: "",
          definitionId: state.definitionId,
          variableValue: "variableValue" in state ? state.variableValue: void 0,
          descriptionDictionary: "descriptionDictionary" in state ? state.descriptionDictionary : {}
        }]);
      }
      setShown(true);
    },
    hide: () => {
      setShown(false);
    },
  };
}
