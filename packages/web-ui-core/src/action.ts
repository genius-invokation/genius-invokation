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

import {
  getDataSync,
  getNameSync,
  prepareForSync,
} from "@gi-tcg/assets-manager";
import {
  ActionValidity,
  flattenPbOneof,
  PbEntityArea,
  PbEntityState,
  PlayCardAction,
  Reaction,
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
import type { SkillRawData, ActionCardRawData } from "@gi-tcg/static-data";

prepareForSync();

export function getHintTextOfCardOrSkill(
  definitionId: number,
  targetLength: number,
): string[] {
  try {
    const data = getDataSync(definitionId) as SkillRawData | ActionCardRawData;
    console.log(data);
    if (data.type === "GCG_CARD_ASSIST") {
      return ["需先选择一张支援牌弃置"];
    }
    return data.targetList.map((x) => x.hintText);
  } catch (e) {
    return Array.from({ length: targetLength }, () => `请选择使用目标`);
  }
}

export interface PlayCardActionStep {
  readonly type: "playCard";
  readonly cardId: number;
  readonly playable: boolean;
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

export interface PreviewingCharacterInfo {
  newHealth: number | null;
  newEnergy: number | null;
  reactions: Reaction[];
  newAura: number | null;
  newDefinitionId: number | null;
  defeated: boolean;
  active: boolean;
}

export interface PreviewingEntityInfo {
  newVariableValue: number | null;
  newDefinitionId: number | null;
  disposed: boolean;
}

export interface ParsedPreviewData {
  characters: Map<number, PreviewingCharacterInfo>;
  entities: Map<number, PreviewingEntityInfo>;
  newEntities: Map<`${"summon" | "support"}${0 | 1}`, PbEntityState[]>;
}

export const NO_PREVIEW: ParsedPreviewData = {
  characters: new Map(),
  entities: new Map(),
  newEntities: new Map(),
};

function parsePreviewData(previewData: PreviewData[]): ParsedPreviewData {
  const result: ParsedPreviewData = {
    characters: new Map(),
    entities: new Map(),
    newEntities: new Map(),
  };
  const newPreviewingCharacter = (): PreviewingCharacterInfo => ({
    newHealth: null,
    newEnergy: null,
    reactions: [],
    newAura: null,
    newDefinitionId: null,
    defeated: false,
    active: false,
  });
  const newPreviewingEntity = (): PreviewingEntityInfo => ({
    newVariableValue: null,
    newDefinitionId: null,
    disposed: false,
  });
  for (const data of previewData) {
    const { $case, value } = data.mutation!;
    outer: switch ($case) {
      case "createEntity": {
        let where: "support" | "summon";
        const who = value.who as 0 | 1;
        switch (value.where) {
          case PbEntityArea.SUMMON:
            where = "summon";
            break;
          case PbEntityArea.SUPPORT:
            where = "support";
            break;
          default:
            break outer;
        }
        const key = `${where}${who}` as const;
        if (!result.newEntities.has(key)) {
          result.newEntities.set(key, []);
        }
        result.newEntities.get(key)!.push(value.entity!);
        break;
      }
      case "modifyEntityVar": {
        switch (value.variableName) {
          case "health": {
            const info =
              result.characters.get(value.entityId) ?? newPreviewingCharacter();
            info.newHealth = value.variableValue;
            result.characters.set(value.entityId, info);
            break;
          }
          case "aura": {
            const info =
              result.characters.get(value.entityId) ?? newPreviewingCharacter();
            info.newAura = value.variableValue;
            result.characters.set(value.entityId, info);
            break;
          }
          case "energy": {
            const info =
              result.characters.get(value.entityId) ?? newPreviewingCharacter();
            info.newEnergy = value.variableValue;
            result.characters.set(value.entityId, info);
            break;
          }
          case "alive": {
            if (!value.variableValue) {
              const info =
                result.characters.get(value.entityId) ??
                newPreviewingCharacter();
              info.defeated = true;
              result.characters.set(value.entityId, info);
            }
            break;
          }
          default: {
            const info =
              result.entities.get(value.entityId) ?? newPreviewingEntity();
            info.newVariableValue = value.variableValue;
            result.entities.set(value.entityId, info);
            break;
          }
        }
        break;
      }
      case "elementalReaction": {
        const info =
          result.characters.get(value.characterId) ?? newPreviewingCharacter();
        info.reactions.push(value.reactionType as Reaction);
        break;
      }
      case "removeEntity": {
        const info =
          result.entities.get(value.entity!.id) ?? newPreviewingEntity();
        info.disposed = true;
        result.entities.set(value.entity!.id, info);
        break;
      }
      case "switchActive": {
        const info =
          result.characters.get(value.characterId) ?? newPreviewingCharacter();
        info.active = true;
        result.characters.set(value.characterId, info);
        break;
      }
      case "transformDefinition": {
        const info =
          result.entities.get(value.entityId) ?? newPreviewingEntity();
        info.newDefinitionId = value.newEntityDefinitionId;
        result.entities.set(value.entityId, info);
        const info2 =
          result.characters.get(value.entityId) ?? newPreviewingCharacter();
        info2.newDefinitionId = value.newEntityDefinitionId;
        result.characters.set(value.entityId, info2);
        break;
      }
    }
  }
  return result;
}

export interface ActionState {
  availableSteps: ActionStep[];
  realCosts: RealCosts;
  showHands: boolean;
  showSkillButtons: boolean;
  hintText?: string;
  alertText?: string;
  dicePanel: DicePanelState;
  autoSelectedDice: DiceType[] | null;
  showBackdrop: boolean;
  previewData: ParsedPreviewData;
  step: StepActionFunction;
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

type TreeNode<T> =
  | {
      type: "branch";
      children: Map<number, TreeNode<T>>;
    }
  | {
      type: "leaf";
      value: T;
    };

type PlayCardMultiStepNode = TreeNode<{
  action: Action & { value: PlayCardAction };
  index: number;
}>;

type UseSkillMultiStepNode = TreeNode<{
  action: Action & { value: UseSkillAction };
  index: number;
}>;

function appendMultiStepNode<T>(
  rootNode: TreeNode<T>,
  keys: number[],
  value: T,
) {
  // create (keys.length - 1) branch nodes if needed, then add a final leaf node.
  let current = rootNode;
  for (let i = 0; i < keys.length - 1; i++) {
    if (current.type === "leaf") {
      throw new Error("Unexpected leaf node");
    }
    if (!current.children.has(keys[i])) {
      current.children.set(keys[i], { type: "branch", children: new Map() });
    }
    current = current.children.get(keys[i])!;
  }
  if (current.type === "leaf") {
    throw new Error("Unexpected leaf node");
  }
  current.children.set(keys[keys.length - 1], { type: "leaf", value });
}

interface PlayCardMultiStepRootNodeContext {
  node: PlayCardMultiStepNode;
  autoSelectedDice: DiceType[];
  cardDefinitionId: number;
}

interface CreatePlayCardActionStateOption {
  cardSingleSteps: Map<PlayCardActionStep, () => StepActionResult>;
  cardMultiSteps: Map<number, PlayCardMultiStepRootNodeContext>;
  action: Action & { value: PlayCardAction };
  index: number;
}

function createPlayCardActionState(
  root: ActionState,
  opt: CreatePlayCardActionStateOption,
) {
  const id = opt.action.value.cardId;
  const ok = opt.action.validity === ActionValidity.VALID;
  const ENTER_STEP: PlayCardActionStep = {
    type: "playCard",
    cardId: id,
    playable: ok,
  };
  if (!ok) {
    opt.cardSingleSteps.set(ENTER_STEP, () => ({
      type: "newState",
      newState: {
        ...root,
        alertText: validityText(opt.action.validity),
      },
    }));
    return;
  }
  const targetLength = opt.action.value.targetIds.length;
  if (targetLength > 0) {
    if (!opt.cardMultiSteps.has(id)) {
      opt.cardMultiSteps.set(id, {
        node: { type: "branch", children: new Map() },
        autoSelectedDice: opt.action.autoSelectedDice as DiceType[],
        cardDefinitionId: opt.action.value.cardDefinitionId,
      });
    }
    appendMultiStepNode(
      opt.cardMultiSteps.get(id)!.node,
      opt.action.value.targetIds,
      opt,
    );
    return;
  }
  const previewData = parsePreviewData(opt.action.preview);
  if (
    opt.action.autoSelectedDice.length === 0 &&
    previewData.characters.size === 0
  ) {
    // 无费无预览时，直接提交
    opt.cardSingleSteps.set(ENTER_STEP, () => ({
      type: "actionCommitted",
      chosenActionIndex: opt.index,
      usedDice: [],
    }));
    return;
  }
  const CONFIRM_BUTTON_STEP: ClickConfirmButtonActionStep = {
    type: "clickConfirmButton",
    confirmText: "确定",
  };
  const resultState: ActionState = {
    availableSteps: [
      CANCEL_ACTION_STEP,
      ENTER_STEP, // 仅为动画连贯而设计（实际上点不到）
      CONFIRM_BUTTON_STEP,
    ],
    realCosts: root.realCosts,
    showHands: false,
    showSkillButtons: false,
    hintText: `打出手牌「${getNameSync(opt.action.value.cardDefinitionId)}」`,
    dicePanel: opt.action.autoSelectedDice.length > 0 ? "visible" : "hidden",
    autoSelectedDice: opt.action.autoSelectedDice as DiceType[],
    showBackdrop: true,
    previewData,
    step: (step, dice) => {
      if (step === CANCEL_ACTION_STEP) {
        return { type: "newState", newState: root };
      } else if (step === CONFIRM_BUTTON_STEP) {
        const diceReq = new Map(
          root.realCosts.cards
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
      } else if (step === ENTER_STEP) {
        return {
          type: "newState",
          newState: {
            ...resultState,
            autoSelectedDice: null,
          },
        };
      } else {
        console.error(step);
        throw new Error("Unexpected step");
      }
    },
  };
  opt.cardSingleSteps.set(ENTER_STEP, () => ({
    type: "newState",
    newState: resultState,
  }));
}

function createPlayCardMultiStepState(
  root: ActionState,
  id: number,
  ctx: PlayCardMultiStepRootNodeContext,
) {
  const createState = (
    id: number,
    node: PlayCardMultiStepNode,
    hintTexts: string[],
    parentNode?: ActionState,
  ): ActionState => {
    if (node.type === "leaf") {
      const CLICK_CONFIRM_STEP: ClickConfirmButtonActionStep = {
        type: "clickConfirmButton",
        confirmText: "确定",
      };
      const CLICK_ENTITY_STEP: ClickEntityActionStep = {
        type: "clickEntity",
        entityId: id,
        ui: ActionStepEntityUi.Selected,
      };
      const resultState: ActionState = {
        availableSteps: [
          CANCEL_ACTION_STEP,
          CLICK_ENTITY_STEP,
          CLICK_CONFIRM_STEP,
        ],
        realCosts: root.realCosts,
        showHands: false,
        showSkillButtons: false,
        hintText: hintTexts[0],
        dicePanel:
          node.value.action.autoSelectedDice.length > 0 ? "visible" : "hidden",
        autoSelectedDice: null,
        showBackdrop: true,
        previewData: NO_PREVIEW,
        step: (step, dice) => {
          if (step === CLICK_CONFIRM_STEP || step === CLICK_ENTITY_STEP) {
            const diceReq = new Map(
              node.value.action.requiredCost.map(({ type, count }) => [
                type as DiceType,
                count,
              ]),
            );
            if (checkDice(diceReq, dice)) {
              return {
                type: "actionCommitted",
                chosenActionIndex: node.value.index,
                usedDice: dice as PbDiceType[],
              };
            } else {
              return {
                type: "newState",
                newState: {
                  ...resultState,
                  alertText: "骰子不符合要求",
                },
              };
            }
          } else {
            return parentNode!.step(step, dice);
          }
        },
      };
      return resultState;
    } else {
      const childrenStates = new Map<ClickEntityActionStep, ActionState>();
      const resultState: ActionState = {
        availableSteps: [CANCEL_ACTION_STEP],
        realCosts: root.realCosts,
        showHands: false,
        showSkillButtons: false,
        hintText: hintTexts[0],
        dicePanel: "hidden",
        autoSelectedDice: parentNode ? null : ctx.autoSelectedDice,
        showBackdrop: true,
        previewData: NO_PREVIEW,
        step: (step) => {
          if (step === CANCEL_ACTION_STEP) {
            return { type: "newState", newState: root };
          } else if (step.type === "clickEntity") {
            return {
              type: "newState",
              newState: childrenStates.get(step)!,
            };
          } else {
            console.error(step);
            throw new Error("Unexpected step");
          }
        },
      };

      const children = node.children.values().toArray();
      if (children.length === 1 && children[0].type === "leaf") {
        // 最后一层只有一个可用 target 时，直接步进到下一层
        return createState(id, children[0], hintTexts, parentNode);
      } else {
        for (const [key, value] of node.children.entries()) {
          const step: ClickEntityActionStep = {
            type: "clickEntity",
            entityId: key,
            ui: ActionStepEntityUi.Outlined,
          };
          childrenStates.set(
            step,
            createState(key, value, hintTexts.slice(1), resultState),
          );
          resultState.availableSteps.push(step);
        }
        if (children[0].type === "leaf") {
          for (const [key, state] of childrenStates) {
            state.availableSteps.push(
              ...childrenStates.keys().filter((k) => k !== key),
            );
          }
        }
        return resultState;
      }
    }
  };
  const step: PlayCardActionStep = {
    type: "playCard",
    cardId: id,
    playable: true,
  };
  console.log(ctx);
  const hintTexts = getHintTextOfCardOrSkill(ctx.cardDefinitionId, 2);
  const state = createState(id, ctx.node, hintTexts);
  return [step, state] as const;
}

interface CreateUseSkillActionStateOption {
  skillSingleStepStates: Map<ClickSkillButtonActionStep, ActionState>;
  skillMultiSteps: Map<number, UseSkillMultiStepNode>;
  action: Action & { value: UseSkillAction };
  index: number;
}

function createUseSkillActionState(
  root: ActionState,
  opt: CreateUseSkillActionStateOption,
) {
  const id = opt.action.value.skillDefinitionId;
  const ok = opt.action.validity === ActionValidity.VALID;
  if (opt.action.value.targetIds.length > 0) {
    if (!opt.skillMultiSteps.has(id)) {
      opt.skillMultiSteps.set(id, { type: "branch", children: new Map() });
    }
    appendMultiStepNode(
      opt.skillMultiSteps.get(id)!,
      opt.action.value.targetIds,
      opt,
    );
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
    showSkillButtons: true,
    dicePanel: opt.action.autoSelectedDice.length > 0 ? "visible" : "wrapped",
    autoSelectedDice: opt.action.autoSelectedDice as DiceType[],
    showBackdrop: true,
    previewData: parsePreviewData(opt.action.preview),
    step: (step, dice) => {
      if (step === CANCEL_ACTION_STEP) {
        return { type: "newState", newState: root };
      } else if (step === CONFIRM_TARGET_STEP || step === CONFIRM_BUTTON_STEP) {
        const diceReq = new Map(
          root.realCosts.skills
            .get(id)!
            .map(({ type, count }) => [type as DiceType, count]),
        );
        if (ok && checkDice(diceReq, dice)) {
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
              alertText: validityText(opt.action.validity) ?? "骰子不符合要求",
            },
          };
        }
      } else if (step.type === "clickSkillButton") {
        return {
          type: "newState",
          newState: opt.skillSingleStepStates.get(step)!,
        };
      } else {
        console.error(step);
        throw new Error("Unexpected step");
      }
    },
  };
  opt.skillSingleStepStates.set(ENTER_STEP, resultState);
}

interface UseSkillMultiStepRootNodeContext {
  node: UseSkillMultiStepNode;
  autoSelectedDice: DiceType[];
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
    showSkillButtons: true,
    hintText: `切换出战角色为「${getNameSync(
      opt.action.value.characterDefinitionId,
    )}」`,
    dicePanel: opt.action.autoSelectedDice.length > 0 ? "visible" : "wrapped",
    autoSelectedDice: opt.action.autoSelectedDice as DiceType[],
    showBackdrop: true,
    previewData: parsePreviewData(opt.action.preview),
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
    showSkillButtons: true,
    dicePanel: "hidden",
    autoSelectedDice: null,
    showBackdrop: false,
    previewData: NO_PREVIEW,
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
    previewData: NO_PREVIEW,
    dicePanel: "hidden",
    autoSelectedDice: null,
    showBackdrop: false,
    showHands: true,
    showSkillButtons: true,
    step: (step) => {
      return steps.get(step)!();
    },
  };
  const steps = new Map<ActionStep, () => StepActionResult>([
    [
      CANCEL_ACTION_STEP,
      () => ({
        type: "newState",
        newState: root,
      }),
    ],
  ]);
  const playCardSingleSteps = new Map<
    PlayCardActionStep,
    () => StepActionResult
  >();
  const playCardMultiSteps = new Map<
    number,
    PlayCardMultiStepRootNodeContext
  >();
  const useSkillSingleStepStates = new Map<
    ClickSkillButtonActionStep,
    ActionState
  >();
  const useSkillMultiSteps = new Map<number, UseSkillMultiStepNode>();
  const switchActiveInnerStates = new Map<ClickEntityActionStep, ActionState>();
  const switchActiveOuterStates = new Map<ClickEntityActionStep, ActionState>();
  for (let i = 0; i < actions.length; i++) {
    const { action, requiredCost, validity } = actions[i];
    switch (action?.$case) {
      case "useSkill": {
        realCosts.skills.set(action.value.skillDefinitionId, requiredCost);
        createUseSkillActionState(root, {
          skillSingleStepStates: useSkillSingleStepStates,
          skillMultiSteps: useSkillMultiSteps,
          action: { value: action.value, ...actions[i] },
          index: i,
        });
        break;
      }
      case "playCard": {
        realCosts.cards.set(action.value.cardId, requiredCost);
        createPlayCardActionState(root, {
          cardSingleSteps: playCardSingleSteps,
          cardMultiSteps: playCardMultiSteps,
          action: { value: action.value, ...actions[i] },
          index: i,
        });
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
        const DECLARE_END_STEP = {
          type: "declareEnd" as const,
        };
        steps.set(DECLARE_END_STEP, () => ({
          type: "actionCommitted",
          chosenActionIndex: i,
          usedDice: [],
        }));
        break;
      }
    }
  }

  for (const [id, node] of playCardMultiSteps) {
    const [step, state] = createPlayCardMultiStepState(root, id, node);
    steps.set(step, () => ({ type: "newState", newState: state }));
  }
  for (const [step, stepResult] of playCardSingleSteps.entries()) {
    steps.set(step, stepResult);
  }
  for (const [step, state] of useSkillSingleStepStates.entries()) {
    state.availableSteps.push(
      ...useSkillSingleStepStates.keys().filter((k) => k !== step),
    );
    steps.set(step, () => ({ type: "newState", newState: state }));
  }
  for (const [step, state] of switchActiveOuterStates.entries()) {
    state.availableSteps.push(...switchActiveOuterStates.keys());
    steps.set(step, () => ({ type: "newState", newState: state }));
  }
  for (const [step, state] of switchActiveInnerStates.entries()) {
    state.availableSteps.push(
      ...switchActiveInnerStates.keys().filter((k) => k !== step),
    );
  }
  root.availableSteps.push(...steps.keys());
  console.log({ useSkillMultiSteps, playCardMultiSteps });
  console.log(root);
  return root;
}
