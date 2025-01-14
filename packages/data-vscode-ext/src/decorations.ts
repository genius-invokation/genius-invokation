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
  Control, // if, do, else
  Action,
  EventAction,
  Done,
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
  [ChainMethodCategory.Control]: "keyword.control",
  [ChainMethodCategory.Action]: "support.function",
  [ChainMethodCategory.EventAction]: "support.function",
  [ChainMethodCategory.Done]: "keyword.control",
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
  Physical = Void,
  Cryo,
  Hydro,
  Pyro,
  Electro,
  Anemo,
  Geo,
  Dendro,
  Omni,
  Piercing = Omni,
  Energy,
  // EventName, // italic
  ChainArguments, // opacity
  Deleted, // .reserve
}

const otherDecorationTypes = new Map<
  DecorationCategory,
  vscode.TextEditorDecorationType
>();

const chainMethodRanges = new Map<ChainMethodCategory, vscode.Range[]>();
const otherDecorationRanges = new Map<DecorationCategory, vscode.Range[]>();

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
  const ELEMENT_TYPE_COLORS: Record<number, { light: string; dark: string }> = {
    [DecorationCategory.Void]: { light: "#000000", dark: "#4f4f4f" },
    [DecorationCategory.Cryo]: { light: "#91d5ff", dark: "#55ddff" },
    [DecorationCategory.Hydro]: { light: "#1890ff", dark: "#3e99ff" },
    [DecorationCategory.Pyro]: { light: "#f5222d", dark: "#ff9955" },
    [DecorationCategory.Electro]: { light: "#722ed1", dark: "#b380ff" },
    [DecorationCategory.Anemo]: { light: "#36cfc9", dark: "#80ffe6" },
    [DecorationCategory.Geo]: { light: "#d4b106", dark: "#ffcc00" },
    [DecorationCategory.Dendro]: { light: "#52c41a", dark: "#a5c83b" },
    [DecorationCategory.Omni]: { light: "#929292", dark: "#000000" },
    [DecorationCategory.Energy]: { light: "#bd7611", dark: "#f8c901" },
  };

  for (const [category, { light, dark }] of Object.entries(
    ELEMENT_TYPE_COLORS,
  )) {
    otherDecorationTypes.set(
      Number(category) as DecorationCategory,
      vscode.window.createTextEditorDecorationType({
        light: { color: light },
        dark: { color: dark },
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
  otherDecorationTypes.set(
    DecorationCategory.Deleted,
    vscode.window.createTextEditorDecorationType({
      textDecoration: "line-through",
      fontStyle: "italic",
      light: { color: "#929292" },
      dark: { color: "#4f4f4f" },
    }),
  );
};

const addToMap = <K, V>(map: Map<K, V[]>, key: K, value: V) => {
  if (!map.has(key)) {
    map.set(key, []);
  }
  map.get(key)!.push(value);
};

export const initDecorations = () => {
  chainMethodRanges.clear();
  otherDecorationRanges.clear();
};

export const updateEnumDecorations = (editor: vscode.TextEditor) => {
  if (otherDecorationTypes.size === 0) {
    setOtherDecorationTypes();
  }
  const text = editor.document.getText();
  const enumRegex = /(?:Aura|DamageType|DiceType)\.(\w+)/dg;
  const enumMatches = text.matchAll(enumRegex);

  for (const match of enumMatches) {
    const enumType = match[1] as keyof typeof DecorationCategory;
    if (enumType in DecorationCategory) {
      const [start, end] = match.indices![1];
      addToMap(
        otherDecorationRanges,
        DecorationCategory[enumType],
        new vscode.Range(
          editor.document.positionAt(start),
          editor.document.positionAt(end),
        ),
      );
    }
  }
};

export const updateBuilderChainDecorations = (
  editor: vscode.TextEditor,
  chainCalls: ChainCallEntry[][],
) => {
  if (tokenBasedDecorationTypes.size === 0) {
    updateTokenBasedDecorationTypes();
  }
  if (otherDecorationTypes.size === 0) {
    setOtherDecorationTypes();
  }

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
    const last = chain[chain.length - 1];
    if (last.text === "done") {
      addChainMethodRange(ChainMethodCategory.Done, last.idStart, last.idEnd);
    } else if (last.text === "reserve") {
      for (const { idStart, idEnd, callEnd } of chain) {
        addOtherDecorationRange(DecorationCategory.Deleted, idStart, idEnd);
        addOtherDecorationRange(
          DecorationCategory.ChainArguments,
          idEnd,
          callEnd,
        );
      }
      continue;
    } else {
      continue;
    }
    if (
      [
        "status",
        "combatStatus",
        "card",
        "skill",
        "extension",
        "character",
      ].includes(chain[0].text)
    ) {
      addChainMethodRange(
        ChainMethodCategory.Factory,
        chain[0].idStart,
        chain[0].idEnd,
      );
    }
    const totalRange = new vscode.Range(
      editor.document.positionAt(chain[0].idStart),
      editor.document.positionAt(chain[chain.length - 1].callEnd),
    );
    for (let i = 1; i < chain.length - 1; i++) {
      const { idStart, idEnd, callEnd, text } = chain[i];
      const COST_METHODS: Record<string, DecorationCategory> = {
        costVoid: DecorationCategory.Void,
        costCryo: DecorationCategory.Cryo,
        costHydro: DecorationCategory.Hydro,
        costPyro: DecorationCategory.Pyro,
        costElectro: DecorationCategory.Electro,
        costAnemo: DecorationCategory.Anemo,
        costGeo: DecorationCategory.Geo,
        costDendro: DecorationCategory.Dendro,
        costSame: DecorationCategory.Omni,
        costEnergy: DecorationCategory.Energy,
      };
      if (text in COST_METHODS) {
        addChainMethodRange(ChainMethodCategory.Property, idStart, idStart + 4);
        addOtherDecorationRange(COST_METHODS[text], idStart + 4, idEnd);
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
      } else if (
        ["if", "else", "do", "defineSnippet", "callSnippet"].includes(text)
      ) {
        addChainMethodRange(ChainMethodCategory.Control, idStart, idEnd);
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
      if (
        editor.selection.end.line < totalRange.start.line ||
        editor.selection.start.line > totalRange.end.line
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
};

export const applyDecorations = (editor: vscode.TextEditor) => {
  for (const [category, ranges] of chainMethodRanges) {
    editor.setDecorations(tokenBasedDecorationTypes.get(category)!, ranges);
  }
  for (const [category, ranges] of otherDecorationRanges) {
    editor.setDecorations(otherDecorationTypes.get(category)!, ranges);
  }
};
