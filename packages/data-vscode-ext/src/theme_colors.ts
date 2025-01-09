import * as vscode from "vscode";
import * as path from "node:path";
import { log } from "./logger";

// https://github.com/microsoft/vscode/issues/32813#issuecomment-524174937

export type TokenColors = Map<string, TokenColorSettings>;

export interface TokenColorSettings {
  background?: string;
  fontStyle?: string;
  foreground?: string;
}

export const tokenColors: TokenColors = new Map();

export const updateTokenColors = () => {
  const themeName: string | undefined = vscode.workspace
    .getConfiguration("workbench")
    .get("colorTheme");
  tokenColors.clear();
  let currentThemePath;
  for (const extension of vscode.extensions.all) {
    const themes =
      extension.packageJSON.contributes &&
      extension.packageJSON.contributes.themes;
    const currentTheme =
      themes && themes.find((theme: any) => theme.id === themeName);
    if (currentTheme) {
      currentThemePath = path.join(extension.extensionPath, currentTheme.path);
      break;
    }
  }
  const themePaths: string[] = [];
  if (currentThemePath) {
    themePaths.push(currentThemePath);
  }
  while (themePaths.length > 0) {
    const themePath = themePaths.pop()!;
    const theme = require(themePath);
    if (theme) {
      if (theme.include) {
        themePaths.push(path.join(path.dirname(themePath), theme.include));
      }
      if (theme.tokenColors) {
        for (const rule of theme.tokenColors) {
          if (typeof rule.scope === "string" && !tokenColors.has(rule.scope)) {
            tokenColors.set(rule.scope, rule.settings);
          } else if (rule.scope instanceof Array) {
            for (const scope of rule.scope) {
              if (!tokenColors.has(rule.scope)) {
                tokenColors.set(scope, rule.settings);
              }
            }
          }
        }
      }
    }
  }
  log(tokenColors);
};

export function getColorForToken(token: string) {
  const keys = [...tokenColors.keys()].toSorted((a, b) => b.length - a.length);
  const key = keys.find((k) => token.startsWith(k));
  return key ? tokenColors.get(key)! : {};
}
