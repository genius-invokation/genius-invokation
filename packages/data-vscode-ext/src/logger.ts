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
