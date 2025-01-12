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
import { inspect } from "node:util";

let outputChannel: vscode.OutputChannel | null = null;
export function log(...args: any[]) {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel("@gi-tcg/data Extension");
  }
  for (const arg of args) {
    outputChannel.appendLine(inspect(arg));
  }
}
