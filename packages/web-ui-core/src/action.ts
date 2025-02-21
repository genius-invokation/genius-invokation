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
import {
  ActionValidity,
  type Action,
  type DiceRequirement,
  type DiceType,
  type PbDiceRequirement,
  type PbDiceType,
  type PreviewData,
  type SwitchActiveAction,
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
  readonly isFocused: boolean;
}
export interface ClickSwitchActiveButtonActionStep {
  readonly type: "clickSwitchActiveButton";
  readonly isFocused: boolean;
}
export interface ClickDeclareEndActionStep {
  readonly type: "declareEnd";
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
  | ClickDeclareEndActionStep
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
  autoSelectedDice: DiceType[] | null;
  showBackdrop: boolean;
  previewData: PreviewData[];
  step: StepActionFunction;
}

interface CreateSwitchActiveActionStateOption {
  outerLevelStates: Map<ClickEntityActionStep, ActionState>;
  innerLevelStates: Map<ClickEntityActionStep, ActionState>;
  action: Action & { value: SwitchActiveAction };
  index: number;
}

function createSwitchActiveActionState(
  root: ActionState,
  opt: CreateSwitchActiveActionStateOption,
): void {
  const INNER_SWITCH_ACTIVE_BUTTON: ClickSwitchActiveButtonActionStep = {
    type: "clickSwitchActiveButton",
    isFocused: true,
  };
  const OUTER_SWITCH_ACTIVE_BUTTON: ClickSwitchActiveButtonActionStep = {
    type: "clickSwitchActiveButton",
    isFocused: false,
  };
  const OUTER_CHARACTER_CLICK_ACTION: ClickEntityActionStep = {
    type: "clickEntity",
    entityId: opt.action.value.characterId,
    hasOutline: false,
    isSelected: false,
  };
  const INNER_CHARACTER_CLICK_ACTION: ClickEntityActionStep = {
    type: "clickEntity",
    entityId: opt.action.value.characterId,
    hasOutline: true,
    isSelected: false,
  };
  const CONFIRM_CLICK_ACTION: ClickEntityActionStep = {
    type: "clickEntity",
    entityId: opt.action.value.characterId,
    hasOutline: true,
    isSelected: true,
  };
  const innerState: ActionState = {
    availableSteps: [INNER_SWITCH_ACTIVE_BUTTON, CONFIRM_CLICK_ACTION],
    realCosts: root.realCosts,
    showHands: false,
    hintText: `切换出战角色为 ${getNameSync(
      opt.action.value.characterDefinitionId,
    )}`,
    alertText: null,
    dicePanel: "visible",
    autoSelectedDice: opt.action.autoSelectedDice as DiceType[],
    showBackdrop: true,
    previewData: [], // TODO,
    step: (step, dice) => {
      if (step === CANCEL_ACTION_STEP) {
        return { type: "newState", newState: root };
      } else if (
        step === INNER_SWITCH_ACTIVE_BUTTON ||
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
              autoSelectedDice: null,
              alertText: "骰子不符合要求",
            },
          };
        }
      } else if (step.type === "clickEntity") {
        return {
          type: "newState",
          newState: {
            ...opt.innerLevelStates.get(step)!,
            autoSelectedDice: null,
          },
        };
      } else {
        throw new Error("Unexpected step");
      }
    },
  };
  const outerState: ActionState = {
    availableSteps: [OUTER_SWITCH_ACTIVE_BUTTON],
    realCosts: root.realCosts,
    showHands: true,
    hintText: null,
    alertText: null,
    dicePanel: "hidden",
    autoSelectedDice: null,
    showBackdrop: false,
    previewData: [],
    step: (step) => {
      if (step === CANCEL_ACTION_STEP) {
        return { type: "newState", newState: root };
      } else if (step === OUTER_SWITCH_ACTIVE_BUTTON) {
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
    autoSelectedDice: null,
    showBackdrop: false,
    showHands: true,
    step: (step) => {
      if (step.type === "declareEnd") {
        return {
          type: "actionCommitted",
          chosenActionIndex: declareEndIndex!,
          usedDice: [],
        };
      }
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
    const { action, preview, requiredCost, validity } = actions[i];
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
        if (validity !== ActionValidity.VALID) {
          continue;
        }
        realCosts.switchActive = requiredCost;
        createSwitchActiveActionState(root, {
          outerLevelStates: switchActiveOuterStates,
          innerLevelStates: switchActiveInnerStates,
          action: { value: action.value, ...actions[i] },
          index: i,
        });
        break;
      }
      case "elementalTuning": {
        // TODO
        break;
      }
      case "declareEnd": {
        root.availableSteps.push({
          type: "declareEnd",
        });
        declareEndIndex = i;
        break;
      }
    }
  }
  root.availableSteps.push(...steps.keys());

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
  console.log(root);
  return root;
}
