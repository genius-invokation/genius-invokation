// Copyright (C) 2024-2025 Guyutongxue
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

import type {
  Action,
  DiceRequirement,
  DiceType,
  PbDiceRequirement,
  PbDiceType,
  PreviewData,
} from "@gi-tcg/typings";

export interface PlayCardActionStep {
  readonly type: "playCard";
  readonly cardId: number;
}
export interface ElementalTunningActionStep {
  readonly type: "elementalTunning";
  readonly cardId: number;
}
export interface ClickEntityActionStep {
  readonly type: "clickEntity";
  readonly entityId: number;
  readonly isSelected: boolean;
}
export interface ClickSkillButtonActionStep {
  readonly type: "clickSkillButton";
  readonly skillId: number;
  readonly isSelected: boolean;
}
export interface ClickSwitchActiveButtonActionStep {
  readonly type: "clickSwitchActiveButton";
}
export interface ClickDeclareEndMarkerActionStep {
  readonly type: "clickDeclareEndMarker";
}
export interface ClickDeclareEndButtonActionStep {
  readonly type: "clickDeclareEndButton";
}
export interface ClickConfirmButtonActionStep {
  readonly type: "clickConfirmButton";
  readonly confirmText: string;
}

export const CANCEL_ACTION_STEP = {
  type: "cancel",
};

export type ActionStep =
  | PlayCardActionStep
  | ElementalTunningActionStep
  | ClickEntityActionStep
  | ClickSkillButtonActionStep
  | ClickSwitchActiveButtonActionStep
  | ClickDeclareEndMarkerActionStep
  | ClickDeclareEndButtonActionStep
  | ClickConfirmButtonActionStep
  | typeof CANCEL_ACTION_STEP;

export type StepActionResult =
  | {
      type: "actionCommitted";
      chosenActionIndex: number;
      usedDice: PbDiceType[];
    }
  | {
      type: "chooseActiveCommitted";
      activeCharacterId: number;
    }
  | {
      type: "newState";
      newState: ActionState;
    };

type StepActionFunction = (
  step: ActionStep,
  selectedDice: DiceType[],
) => StepActionResult;

export interface ActionState {
  availableSteps: ActionStep[];
  showHands: boolean;
  hintText: string | null;
  alertText: string | null;
  requiredDice: DiceRequirement[] | null;
  previewData: PreviewData[];
  step: StepActionFunction;
}

function createDeclareEndActionState(
  root: ActionState,
  actionIndex: number,
): ActionState {
  return {
    availableSteps: [
      ...root.availableSteps,
      { type: "clickDeclareEndMarker" },
      { type: "clickDeclareEndButton" },
    ],
    showHands: false,
    hintText: "结束回合",
    alertText: null,
    requiredDice: null,
    previewData: [],
    step: (step) => {
      if (step === CANCEL_ACTION_STEP) {
        return { type: "newState", newState: root };
      }
      return {
        type: "actionCommitted",
        chosenActionIndex: actionIndex,
        usedDice: [],
      };
    },
  };
}

export function createActionState(actions: Action[]): ActionState {
  const root: ActionState = {
    availableSteps: [],
    alertText: null,
    hintText: null,
    previewData: [],
    requiredDice: null,
    showHands: true,
    step: (step) => {
      return {
        type: "newState",
        newState: steps.get(step)!,
      };
    },
  };
  const steps = new Map<ActionStep, ActionState>([[CANCEL_ACTION_STEP, root]]);
  let declareEndIndex: number | null = null;
  for (let i = 0; i < actions.length; i++) {
    const { action, preview, requiredCost } = actions[i];
    switch (action?.$case) {
      case "useSkill":
      case "playCard":
      case "switchActive":
      case "elementalTuning":
        break;
      case "declareEnd": {
        declareEndIndex = i;
        break;
      }
    }
  }
  root.availableSteps = steps.keys().toArray();
  if (declareEndIndex !== null) {
    const step: ActionStep = {
      type: "clickDeclareEndMarker",
    };
    steps.set(step, createDeclareEndActionState(root, declareEndIndex));
    root.availableSteps.push(step);
  }
  return root;
}
