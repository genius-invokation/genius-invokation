import * as vscode from "vscode";
import { getColorForToken } from "./theme_colors";
import { ChainCallEntry } from "./parser";
import { context, event } from "./names.json";

enum ChainMethodCategory {
  Factory,
  Meta, // since, description
  Property, // type, tags, etc
  Variable, // variable, usage, duration, shield,...
  ConvertType,
  TriggerOn,
  Shorthand, // conflictWith, prepare, ...
  TriggerOnShorthand, // endPhaseDamage
  Modifier, // addTarget, filter, listenToXxx
  ControlFlow, // if, do, else
  Action,
  EventAction,
  Done,
  Reversed,
  Other,
  Last,
}

const CHAIN_METHOD_COLOR_MAP: Record<ChainMethodCategory, string> = {
  [ChainMethodCategory.Factory]: "support.type",
  [ChainMethodCategory.Meta]: "comment",
  [ChainMethodCategory.Property]: "support.constant.property-value",
  [ChainMethodCategory.Variable]: "support.variable",
  [ChainMethodCategory.ConvertType]: "support.type",
  [ChainMethodCategory.TriggerOn]: "storage.type",
  [ChainMethodCategory.TriggerOnShorthand]: "storage.type",
  [ChainMethodCategory.Modifier]: "storage.modifier",
  [ChainMethodCategory.ControlFlow]: "keyword.control",
  [ChainMethodCategory.Action]: "support.function",
  [ChainMethodCategory.EventAction]: "support.function",
  [ChainMethodCategory.Done]: "keyword.control",
  [ChainMethodCategory.Reversed]: "keyword.control",
  [ChainMethodCategory.Shorthand]: "support.variable",
  [ChainMethodCategory.Other]: "support.variable",
  [ChainMethodCategory.Last]: "",
};

const underlines = [
  ChainMethodCategory.EventAction,
  ChainMethodCategory.Shorthand,
  ChainMethodCategory.TriggerOnShorthand,
];
const bolds = [
  ChainMethodCategory.TriggerOn,
  ChainMethodCategory.TriggerOnShorthand,
  ChainMethodCategory.Factory,
  ChainMethodCategory.Variable,
];

let decorationTypes = new Map<
  ChainMethodCategory,
  vscode.TextEditorDecorationType
>();

export const updateBuilderChainDecorations = (
  editor: vscode.TextEditor,
  chainCalls: ChainCallEntry[][],
) => {
  // TODO: fix theme changing
  if (decorationTypes.size === 0) {
    for (const [key, value] of Object.entries(CHAIN_METHOD_COLOR_MAP)) {
      const { foreground } = getColorForToken(value);
      const category = Number(key) as ChainMethodCategory;
      if (foreground) {
        decorationTypes.set(
          category,
          vscode.window.createTextEditorDecorationType({
            // before: {
            //   contentText: " ",
            //   border: "1px solid",
            //   margin: "0 0.1em",
            //   width: "0.5em",
            //   height: "0.5em",
            //   borderColor: foreground,
            //   // borderRadius: "50%",
            //   backgroundColor: foreground,
            // }
            // color: `oklch(50% 0.4 ${(360 * category / ChainMethodCategory.Last).toFixed(0)}deg)`,
            fontStyle: "italic",
            fontWeight: bolds.includes(category) ? "bold" : void 0,
            textDecoration: underlines.includes(category)
              ? "underline"
              : void 0,
            color: foreground,
            // backgroundColor: `${foreground}20`,
          }),
        );
      }
    }
    decorationTypes.set(
      ChainMethodCategory.Last,
      vscode.window.createTextEditorDecorationType({
        opacity: "0.6",
      }),
    );
  }
  const allRanges = new Map<ChainMethodCategory, vscode.Range[]>();
  const addRange = (
    category: ChainMethodCategory,
    start: number,
    end: number,
  ) => {
    if (!allRanges.has(category)) {
      allRanges.set(category, []);
    }
    allRanges
      .get(category)!
      .push(
        new vscode.Range(
          editor.document.positionAt(start),
          editor.document.positionAt(end),
        ),
      );
  };
  for (const { idStart, idEnd, callEnd, text } of chainCalls.flat()) {
    if (["done"].includes(text)) {
      addRange(ChainMethodCategory.Done, idStart, idEnd);
    } else if (["since", "description", "associateExtension"].includes(text)) {
      addRange(ChainMethodCategory.Meta, idStart, idEnd);
    } else if (
      [
        "type",
        "tags",
        "unobtainable",
        "health",
        "energy",
        "skills",
        "food",
      ].includes(text)
    ) {
      addRange(ChainMethodCategory.Property, idStart, idEnd);
    } else if (["if", "else", "do"].includes(text)) {
      addRange(ChainMethodCategory.ControlFlow, idStart, idEnd);
    } else if (
      [
        "status",
        "combatStatus",
        "card",
        "skill",
        "extension",
        "character",
      ].includes(text)
    ) {
      addRange(ChainMethodCategory.Factory, idStart, idEnd);
    } else if (
      [
        "support",
        "artifact",
        "weapon",
        "talent",
        "technique",
        "nightsoulTechnique",
        "toStatus",
        "toCombatStatus",
        "provideSkill",
      ].includes(text)
    ) {
      addRange(ChainMethodCategory.ConvertType, idStart, idEnd);
    } else if (
      ["on", "once", "endOn", "endProvide", "mutateWhen"].includes(text)
    ) {
      addRange(ChainMethodCategory.TriggerOn, idStart, idEnd);
    } else if (["endPhaseDamage"].includes(text)) {
      addRange(ChainMethodCategory.TriggerOnShorthand, idStart, idEnd);
    } else if (
      ["addTarget", "filter", "listenToPlayer", "listenToAll"].includes(text)
    ) {
      addRange(ChainMethodCategory.Modifier, idStart, idEnd);
    } else if (
      [
        "variable",
        "variableCanAppend",
        "usage",
        "usageCanAppend",
        "usagePerRound",
        "duration",
        "shield",
      ].includes(text)
    ) {
      addRange(ChainMethodCategory.Variable, idStart, idEnd);
    } else if (["conflictWith", "prepare", "unique"].includes(text)) {
      addRange(ChainMethodCategory.Shorthand, idStart, idEnd);
    } else if (context.includes(text)) {
      addRange(ChainMethodCategory.Action, idStart, idEnd);
    } else if (event.includes(text)) {
      addRange(ChainMethodCategory.EventAction, idStart, idEnd);
    } else {
      addRange(ChainMethodCategory.Other, idStart, idEnd);
    }
    const idEndPos = editor.document.positionAt(idEnd);
    const callEndPos = editor.document.positionAt(callEnd);
    if (
      editor.selection.start.isAfterOrEqual(callEndPos) ||
      editor.selection.end.isBeforeOrEqual(idEndPos)
    ) {
      addRange(ChainMethodCategory.Last, idEnd, callEnd);
    } else {
    }
  }
  for (const [category, ranges] of allRanges) {
    editor.setDecorations(decorationTypes.get(category)!, ranges);
  }
};
