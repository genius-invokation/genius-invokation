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
