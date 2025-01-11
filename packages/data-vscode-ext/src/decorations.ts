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
}

const CHAIN_METHOD_TOKEN_COLOR_MAP: Record<ChainMethodCategory, string> = {
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
};

const underline_methods = [
  ChainMethodCategory.EventAction,
  ChainMethodCategory.Shorthand,
  ChainMethodCategory.TriggerOnShorthand,
];
const bold_methods = [
  ChainMethodCategory.TriggerOn,
  ChainMethodCategory.TriggerOnShorthand,
  ChainMethodCategory.Factory,
  ChainMethodCategory.Variable,
];

const tokenBasedDecorationTypes = new Map<
  ChainMethodCategory,
  vscode.TextEditorDecorationType
>();

enum DecorationCategory {
  Void,
  Cryo,
  Hydro,
  Pyro,
  Electro,
  Anemo,
  Geo,
  Dendro,
  Omni,
  // EventName, // italic
  ChainArguments, // opacity
}

const otherDecorationTypes = new Map<
  DecorationCategory,
  vscode.TextEditorDecorationType
>();

export const updateTokenBasedDecorationTypes = () => {
  for (const [, value] of tokenBasedDecorationTypes) {
    value.dispose();
  }
  tokenBasedDecorationTypes.clear();
  for (const [key, value] of Object.entries(CHAIN_METHOD_TOKEN_COLOR_MAP)) {
    const { foreground } = getColorForToken(value);
    const category = Number(key) as ChainMethodCategory;
    if (foreground) {
      tokenBasedDecorationTypes.set(
        category,
        vscode.window.createTextEditorDecorationType({
          fontStyle: "italic",
          fontWeight: bold_methods.includes(category) ? "bold" : void 0,
          textDecoration: underline_methods.includes(category)
            ? "underline"
            : void 0,
          color: foreground,
        }),
      );
    }
  }
};

const setOtherDecorationTypes = () => {
  const ELEMENT_TYPE_COLORS: Record<number, string> = {
    [DecorationCategory.Void]: "#4a4a4a",
    [DecorationCategory.Cryo]: "#55ddff",
    [DecorationCategory.Hydro]: "#3e99ff",
    [DecorationCategory.Pyro]: "#ff9955",
    [DecorationCategory.Electro]: "#b380ff",
    [DecorationCategory.Anemo]: "#80ffe6",
    [DecorationCategory.Geo]: "#ffcc00",
    [DecorationCategory.Dendro]: "#a5c83b",
    [DecorationCategory.Omni]: "#dcd4c2",
  };

  for (const [category, color] of Object.entries(ELEMENT_TYPE_COLORS)) {
    otherDecorationTypes.set(
      Number(category) as DecorationCategory,
      vscode.window.createTextEditorDecorationType({
        color,
        fontStyle: "italic",
      }),
    );
  }
  // otherDecorationTypes.set(
  //   DecorationCategory.EventName,
  //   vscode.window.createTextEditorDecorationType({
  //     fontStyle: "italic",
  //   }),
  // );
  otherDecorationTypes.set(
    DecorationCategory.ChainArguments,
    vscode.window.createTextEditorDecorationType({
      opacity: "0.6",
    }),
  );
};

export const updateBuilderChainDecorations = (
  editor: vscode.TextEditor,
  chainCalls: ChainCallEntry[][],
) => {
  // TODO: fix theme changing
  if (tokenBasedDecorationTypes.size === 0) {
    updateTokenBasedDecorationTypes();
  }
  if (otherDecorationTypes.size === 0) {
    setOtherDecorationTypes();
  }

  const chainMethodRanges = new Map<ChainMethodCategory, vscode.Range[]>();
  const otherDecorationRanges = new Map<DecorationCategory, vscode.Range[]>();

  const addToMap = <K, V>(map: Map<K, V[]>, key: K, value: V) => {
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(value);
  };
  const addChainMethodRange = (
    category: ChainMethodCategory,
    start: number,
    end: number,
  ) => {
    addToMap(
      chainMethodRanges,
      category,
      new vscode.Range(
        editor.document.positionAt(start),
        editor.document.positionAt(end),
      ),
    );
  };
  const addOtherDecorationRange = (
    category: DecorationCategory,
    start: number,
    end: number,
  ) => {
    addToMap(
      otherDecorationRanges,
      category,
      new vscode.Range(
        editor.document.positionAt(start),
        editor.document.positionAt(end),
      ),
    );
  };

  for (const chain of chainCalls) {
    for (let i = 0; i < chain.length; i++) {
      const { idStart, idEnd, callEnd, text } = chain[i];
      if (["done"].includes(text)) {
        addChainMethodRange(ChainMethodCategory.Done, idStart, idEnd);
      } else if (
        ["since", "description", "associateExtension"].includes(text)
      ) {
        addChainMethodRange(ChainMethodCategory.Meta, idStart, idEnd);
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
        addChainMethodRange(ChainMethodCategory.Property, idStart, idEnd);
      } else if (["if", "else", "do"].includes(text)) {
        addChainMethodRange(ChainMethodCategory.ControlFlow, idStart, idEnd);
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
        addChainMethodRange(ChainMethodCategory.Factory, idStart, idEnd);
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
        addChainMethodRange(ChainMethodCategory.ConvertType, idStart, idEnd);
      } else if (
        ["on", "once", "endOn", "endProvide", "mutateWhen"].includes(text)
      ) {
        addChainMethodRange(ChainMethodCategory.TriggerOn, idStart, idEnd);
      } else if (["endPhaseDamage"].includes(text)) {
        addChainMethodRange(
          ChainMethodCategory.TriggerOnShorthand,
          idStart,
          idEnd,
        );
      } else if (
        ["addTarget", "filter", "listenToPlayer", "listenToAll"].includes(text)
      ) {
        addChainMethodRange(ChainMethodCategory.Modifier, idStart, idEnd);
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
        addChainMethodRange(ChainMethodCategory.Variable, idStart, idEnd);
      } else if (["conflictWith", "prepare", "unique"].includes(text)) {
        addChainMethodRange(ChainMethodCategory.Shorthand, idStart, idEnd);
      } else if (context.includes(text)) {
        addChainMethodRange(ChainMethodCategory.Action, idStart, idEnd);
      } else if (event.includes(text)) {
        addChainMethodRange(ChainMethodCategory.EventAction, idStart, idEnd);
      } else {
        addChainMethodRange(ChainMethodCategory.Other, idStart, idEnd);
      }
      const argStart = editor.document.positionAt(idEnd);
      const argEnd = editor.document.positionAt(callEnd);
      if (
        editor.selection.start.isAfterOrEqual(argEnd) ||
        editor.selection.end.isBeforeOrEqual(argStart)
      ) {
        // const args = editor.document.getText(
        //   new vscode.Range(argStart, argEnd),
        // );
        // let eventArg = null;
        // if (
        //   ["on", "once", "mutateWhen"].includes(text) &&
        //   (eventArg = /"\w+"/g.exec(args))
        // ) {
        //   addOtherDecorationRange(
        //     DecorationCategory.ChainArguments,
        //     idEnd,
        //     idEnd + eventArg.index,
        //   );
        //   addOtherDecorationRange(
        //     DecorationCategory.EventName,
        //     idEnd + eventArg.index,
        //     idEnd + eventArg.index + eventArg[0].length,
        //   );
        //   addOtherDecorationRange(
        //     DecorationCategory.ChainArguments,
        //     idEnd + eventArg.index + eventArg[0].length,
        //     callEnd,
        //   );
        // } else
        {
          addOtherDecorationRange(
            DecorationCategory.ChainArguments,
            idEnd,
            callEnd,
          );
        }
      }
    }
  }
  for (const [category, ranges] of chainMethodRanges) {
    editor.setDecorations(tokenBasedDecorationTypes.get(category)!, ranges);
  }
  for (const [category, ranges] of otherDecorationRanges) {
    editor.setDecorations(otherDecorationTypes.get(category)!, ranges);
  }
};
