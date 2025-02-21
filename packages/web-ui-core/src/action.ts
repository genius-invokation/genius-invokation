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
  UseSkillAction,
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

export enum ActionStepEntityUi {
  None = 0,
  Visible = 1,
  Outlined = 2,
  Selected = 3,
}

export interface ClickEntityActionStep {
  readonly type: "clickEntity";
  readonly entityId: number | "myActiveCharacter";
  readonly ui: ActionStepEntityUi;
}
export interface ClickSkillButtonActionStep {
  readonly type: "clickSkillButton";
  readonly skillId: number;
  readonly tooltipText?: string;
  readonly isDisabled: boolean;
  readonly isFocused: boolean;
}
export interface ClickSwitchActiveButtonActionStep {
  readonly type: "clickSwitchActiveButton";
  readonly tooltipText?: string;
  readonly isDisabled: boolean;
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
  hintText?: string;
  alertText?: string;
  dicePanel: DicePanelState;
  autoSelectedDice: DiceType[] | null;
  showBackdrop: boolean;
  previewData: PreviewData[];
  step: StepActionFunction;
}

interface CreateUseSkillActionStateOption {
  skillStates: Map<ClickSkillButtonActionStep, ActionState>;
  action: Action & { value: UseSkillAction };
  index: number;
}

const validityText = (validity: ActionValidity): string | undefined => {
  switch (validity) {
    case ActionValidity.CONDITION_NOT_MET:
      return "未满足使用条件";
    case ActionValidity.NO_TARGET:
      return "无可用目标";
    case ActionValidity.DISABLED:
      return "不可进行此操作";
    case ActionValidity.NO_DICE:
      return "骰子不足";
    case ActionValidity.NO_ENERGY:
      return "充能不足";
  }
};

function createUseSkillActionState(
  root: ActionState,
  opt: CreateUseSkillActionStateOption,
) {
  const id = opt.action.value.skillDefinitionId;
  const ok = opt.action.validity === ActionValidity.VALID;
  if (opt.action.value.targetIds.length > 0) {
    // TODO: do it later
    return;
  }
  const ENTER_STEP: ClickSkillButtonActionStep = {
    type: "clickSkillButton",
    skillId: id,
    tooltipText: validityText(opt.action.validity),
    isDisabled: !ok,
    isFocused: false,
  };
  const CONFIRM_TARGET_STEP: ClickEntityActionStep = {
    type: "clickEntity",
    entityId: opt.action.value.mainDamageTargetId ?? "myActiveCharacter",
    ui: ActionStepEntityUi.Selected,
  };
  const CONFIRM_BUTTON_STEP: ClickSkillButtonActionStep = {
    type: "clickSkillButton",
    skillId: id,
    isDisabled: !ok,
    isFocused: true,
  };
  const resultState: ActionState = {
    availableSteps: [
      CANCEL_ACTION_STEP,
      CONFIRM_TARGET_STEP,
      CONFIRM_BUTTON_STEP,
    ],
    realCosts: root.realCosts,
    showHands: false,
    dicePanel: ok ? "visible" : "wrapped",
    autoSelectedDice: opt.action.autoSelectedDice as DiceType[],
    showBackdrop: true,
    previewData: [], // TODO,
    step: (step, dice) => {
      if (step === CANCEL_ACTION_STEP) {
        return { type: "newState", newState: root };
      } else if (step === CONFIRM_TARGET_STEP || step === CONFIRM_BUTTON_STEP) {
        const diceReq = new Map(
          root.realCosts.skills
            .get(id)!
            .map(({ type, count }) => [type as DiceType, count]),
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
              ...resultState,
              autoSelectedDice: null,
              alertText: "骰子不符合要求",
            },
          };
        }
      } else if (step.type === "clickSkillButton") {
        return {
          type: "newState",
          newState: opt.skillStates.get(step)!,
        };
      } else {
        console.error(step);
        throw new Error("Unexpected step");
      }
    },
  };
  opt.skillStates.set(ENTER_STEP, resultState);
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
    isDisabled: false,
    isFocused: true,
  };
  const OUTER_SWITCH_ACTIVE_BUTTON: ClickSwitchActiveButtonActionStep = {
    type: "clickSwitchActiveButton",
    isDisabled: false,
    isFocused: false,
  };
  const OUTER_CHARACTER_CLICK_ACTION: ClickEntityActionStep = {
    type: "clickEntity",
    entityId: opt.action.value.characterId,
    ui: ActionStepEntityUi.None,
  };
  const INNER_CHARACTER_CLICK_ACTION: ClickEntityActionStep = {
    type: "clickEntity",
    entityId: opt.action.value.characterId,
    ui: ActionStepEntityUi.Outlined,
  };
  const CONFIRM_CLICK_ACTION: ClickEntityActionStep = {
    type: "clickEntity",
    entityId: opt.action.value.characterId,
    ui: ActionStepEntityUi.Selected,
  };
  const innerState: ActionState = {
    availableSteps: [
      CANCEL_ACTION_STEP,
      INNER_SWITCH_ACTIVE_BUTTON,
      CONFIRM_CLICK_ACTION,
    ],
    realCosts: root.realCosts,
    showHands: false,
    hintText: `切换出战角色为 ${getNameSync(
      opt.action.value.characterDefinitionId,
    )}`,
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
        console.error(step);
        throw new Error("Unexpected step");
      }
    },
  };
  const outerState: ActionState = {
    availableSteps: [CANCEL_ACTION_STEP, OUTER_SWITCH_ACTIVE_BUTTON],
    realCosts: root.realCosts,
    showHands: true,
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
  const useSkillStates = new Map<ClickSkillButtonActionStep, ActionState>();
  let declareEndIndex: number | null = null;
  for (let i = 0; i < actions.length; i++) {
    const { action, preview, requiredCost, validity } = actions[i];
    switch (action?.$case) {
      case "useSkill": {
        realCosts.skills.set(action.value.skillDefinitionId, requiredCost);
        createUseSkillActionState(root, {
          skillStates: useSkillStates,
          action: { value: action.value, ...actions[i] },
          index: i,
        });
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

  for (const [step, state] of useSkillStates.entries()) {
    state.availableSteps.push(
      ...useSkillStates.keys().filter((k) => k !== step),
    );
    steps.set(step, state);
  }
  for (const [step, state] of switchActiveOuterStates.entries()) {
    state.availableSteps.push(...switchActiveOuterStates.keys());
    steps.set(step, state);
  }
  for (const [step, state] of switchActiveInnerStates.entries()) {
    state.availableSteps.push(
      ...switchActiveInnerStates.keys().filter((k) => k !== step),
    );
  }
  root.availableSteps.push(...steps.keys());
  console.log(root);
  return root;
}
