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

import { getNameSync } from "@gi-tcg/assets-manager";
import type {
  Action,
  DiceRequirement,
  DiceType,
  PbDiceRequirement,
  PbDiceType,
  PreviewData,
  SwitchActiveAction,
} from "@gi-tcg/typings";
import type { DicePanelState } from "./components/DicePanel";
import { checkDice } from "@gi-tcg/utils";

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
  readonly hasOutline: boolean;
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
} as const;

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

export interface RealCosts {
  cards: Map<number, PbDiceRequirement[]>;
  skills: Map<number, PbDiceRequirement[]>;
  switchActive: PbDiceRequirement[] | null;
}

export interface ActionState {
  availableSteps: ActionStep[];
  realCosts: RealCosts;
  showHands: boolean;
  hintText: string | null;
  alertText: string | null;
  dicePanel: DicePanelState;
  showBackdrop: boolean;
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
    realCosts: root.realCosts,
    showHands: true,
    hintText: "结束回合",
    alertText: null,
    dicePanel: "hidden",
    showBackdrop: false,
    previewData: [],
    step: (step, dice) => {
      if (
        step.type === "clickDeclareEndButton" ||
        step.type === "clickDeclareEndMarker"
      ) {
        return {
          type: "actionCommitted",
          chosenActionIndex: actionIndex,
          usedDice: [],
        };
      } else {
        return root.step(step, dice);
      }
    },
  };
}

interface CreateSwitchActiveActionStateOption {
  outerLevelStates: Map<ClickEntityActionStep, ActionState>;
  innerLevelStates: Map<ClickEntityActionStep, ActionState>;
  action: SwitchActiveAction;
  index: number;
}

function createSwitchActiveActionState(
  root: ActionState,
  opt: CreateSwitchActiveActionStateOption,
): void {
  const SWITCH_ACTIVE_BUTTON: ClickSwitchActiveButtonActionStep = {
    type: "clickSwitchActiveButton",
  };
  const OUTER_CHARACTER_CLICK_ACTION: ClickEntityActionStep = {
    type: "clickEntity",
    entityId: opt.action.characterId,
    hasOutline: false,
    isSelected: false,
  };
  const INNER_CHARACTER_CLICK_ACTION: ClickEntityActionStep = {
    type: "clickEntity",
    entityId: opt.action.characterId,
    hasOutline: true,
    isSelected: false,
  };
  const CONFIRM_CLICK_ACTION: ClickEntityActionStep = {
    type: "clickEntity",
    entityId: opt.action.characterId,
    hasOutline: true,
    isSelected: true,
  };
  const innerState: ActionState = {
    availableSteps: [SWITCH_ACTIVE_BUTTON, CONFIRM_CLICK_ACTION],
    realCosts: root.realCosts,
    showHands: false,
    hintText: `切换出战角色为 ${getNameSync(opt.action.characterDefinitionId)}`,
    alertText: null,
    dicePanel: "visible",
    showBackdrop: true,
    previewData: [], // TODO,
    step: (step, dice) => {
      if (step === CANCEL_ACTION_STEP) {
        return { type: "newState", newState: root };
      } else if (
        step === SWITCH_ACTIVE_BUTTON ||
        step === CONFIRM_CLICK_ACTION
      ) {
        const diceReq = new Map(
          root.realCosts.switchActive!.map(({ type, count }) => [
            type as DiceType,
            count,
          ]),
        );
        if (checkDice(diceReq, dice)) {
          return {
            type: "actionCommitted",
            chosenActionIndex: opt.index,
            usedDice: dice as PbDiceType[],
          };
        } else {
          return {
            type: "newState",
            newState: {
              ...innerState,
              alertText: "骰子不符合要求",
            },
          };
        }
      } else if (step.type === "clickEntity") {
        return {
          type: "newState",
          newState: opt.innerLevelStates.get(step)!,
        };
      } else {
        throw new Error("Unexpected step");
      }
    },
  };
  const outerState: ActionState = {
    availableSteps: [SWITCH_ACTIVE_BUTTON],
    realCosts: root.realCosts,
    showHands: true,
    hintText: null,
    alertText: null,
    dicePanel: "hidden",
    showBackdrop: false,
    previewData: [],
    step: (step) => {
      if (step === CANCEL_ACTION_STEP) {
        return { type: "newState", newState: root };
      } else if (step === SWITCH_ACTIVE_BUTTON) {
        return {
          type: "newState",
          newState: innerState,
        };
      } else if (step.type === "clickEntity") {
        return {
          type: "newState",
          newState: opt.outerLevelStates.get(step)!,
        };
      } else {
        throw new Error("Unexpected step");
      }
    },
  };
  opt.outerLevelStates.set(OUTER_CHARACTER_CLICK_ACTION, outerState);
  opt.innerLevelStates.set(INNER_CHARACTER_CLICK_ACTION, innerState);
}

export function createActionState(actions: Action[]): ActionState {
  const realCosts: RealCosts = {
    cards: new Map(),
    skills: new Map(),
    switchActive: null,
  };
  const root: ActionState = {
    availableSteps: [],
    realCosts,
    alertText: null,
    hintText: null,
    previewData: [],
    dicePanel: "hidden",
    showBackdrop: false,
    showHands: true,
    step: (step) => {
      return {
        type: "newState",
        newState: steps.get(step)!,
      };
    },
  };
  const steps = new Map<ActionStep, ActionState>([[CANCEL_ACTION_STEP, root]]);
  const switchActiveInnerStates = new Map<ClickEntityActionStep, ActionState>();
  const switchActiveOuterStates = new Map<ClickEntityActionStep, ActionState>();
  let declareEndIndex: number | null = null;
  for (let i = 0; i < actions.length; i++) {
    const { action, preview, requiredCost } = actions[i];
    switch (action?.$case) {
      case "useSkill": {
        realCosts.skills.set(action.value.skillDefinitionId, requiredCost);
        // TODO
        break;
      }
      case "playCard": {
        realCosts.cards.set(action.value.cardId, requiredCost);
        // TODO
        break;
      }
      case "switchActive": {
        realCosts.switchActive = requiredCost;
        createSwitchActiveActionState(root, {
          outerLevelStates: switchActiveOuterStates,
          innerLevelStates: switchActiveInnerStates,
          action: action.value,
          index: i,
        });
        break;
      }
      case "elementalTuning": {
        // TODO
        break;
      }
      case "declareEnd": {
        declareEndIndex = i;
        break;
      }
    }
  }
  root.availableSteps = steps.keys().toArray();

  for (const [step, state] of switchActiveOuterStates.entries()) {
    state.availableSteps.push(...switchActiveOuterStates.keys());
    steps.set(step, state);
  }
  for (const [step, state] of switchActiveInnerStates.entries()) {
    state.availableSteps.push(
      ...switchActiveInnerStates
        .keys()
        .filter((k) => k.entityId !== step.entityId),
    );
  }
  root.availableSteps.push(...switchActiveOuterStates.keys());
  if (declareEndIndex !== null) {
    const step: ActionStep = {
      type: "clickDeclareEndMarker",
    };
    steps.set(step, createDeclareEndActionState(root, declareEndIndex));
    root.availableSteps.push(step);
  }
  console.log(root);
  return root;
}
