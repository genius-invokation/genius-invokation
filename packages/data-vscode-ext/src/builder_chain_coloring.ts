import * as vscode from "vscode";
import { getColorForToken } from "./theme_colors";
import { ChainCallEntry } from "./parser";
import { context, event } from "./names.json";

enum ChainMethodCategory {
  Factory,
  Property, // type, tags, etc
  ConvertType,
  TriggerOn,
  ControlFlow, // if, do, else
  Action,
  Done,
  Reversed,
  Other,
  Last,
}

const CHAIN_METHOD_COLOR_MAP: Record<ChainMethodCategory, string> = {
  [ChainMethodCategory.Factory]: "support.type",
  [ChainMethodCategory.Property]: "support.constant.property-value",
  [ChainMethodCategory.ConvertType]: "support.type",
  [ChainMethodCategory.TriggerOn]: "storage.type",
  [ChainMethodCategory.ControlFlow]: "keyword.control",
  [ChainMethodCategory.Action]: "support.function",
  [ChainMethodCategory.Done]: "keyword.control",
  [ChainMethodCategory.Reversed]: "keyword.control",
  [ChainMethodCategory.Other]: "support.variable",
  [ChainMethodCategory.Last]: "",
};

let decorationTypes = new Map<ChainMethodCategory, vscode.TextEditorDecorationType>();

export const updateBuilderChainDecorations = (editor: vscode.TextEditor, chainCalls: ChainCallEntry[][]) => {
  // TODO: fix theme changing
  if (decorationTypes.size === 0) {
    for (const [key, value] of Object.entries(CHAIN_METHOD_COLOR_MAP)) {
      const { foreground } = getColorForToken(value);
      if (foreground) {
        decorationTypes.set(
          Number(key),
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
            // color: `oklch(50% 0.4 ${(360 * Number(key) / ChainMethodCategory.Last).toFixed(0)}deg)`,
            // fontStyle: "italic",
            color: foreground,
            // backgroundColor: `${foreground}20`,
          }),
        );
      }
    }
  }
  const allRanges = new Map<ChainMethodCategory, vscode.Range[]>();
  const addRange = (category: ChainMethodCategory, pos: number, end: number) => {
    if (!allRanges.has(category)) {
      allRanges.set(category, []);
    }
    allRanges.get(category)!.push(new vscode.Range(
      editor.document.positionAt(pos),
      editor.document.positionAt(end),
    ));
  }
  for (const { pos, end, text } of chainCalls.flat()) {
    if (["done"].includes(text)) {
      addRange(ChainMethodCategory.Done, pos, end);
    } else if (["type", "tags", "health", "energy", "skills", "food", "talent"].includes(text)) {
      addRange(ChainMethodCategory.Property, pos, end);
    } else if (["if", "else", "do"].includes(text)) {
      addRange(ChainMethodCategory.ControlFlow, pos, end);
    } else if (["status", "combatStatus", "card", "skill", "extension", "character"].includes(text)) {
      addRange(ChainMethodCategory.Factory, pos, end);
    } else if (["support", "artifact", "weapon", "toStatus", "toCombatStatus", "provideSkill"].includes(text)) {
      addRange(ChainMethodCategory.ConvertType, pos, end);
    } else if (["on", "once", "endPhaseDamage", "endOn", "endProvide"].includes(text)) {
      addRange(ChainMethodCategory.TriggerOn, pos, end);
    } else if (context.includes(text) || event.includes(text)) {
      addRange(ChainMethodCategory.Action, pos, end);
    } else {
      addRange(ChainMethodCategory.Other, pos, end);
    }
  }
  for (const [category, ranges] of allRanges) {
    editor.setDecorations(decorationTypes.get(category)!, ranges);
  }
};
