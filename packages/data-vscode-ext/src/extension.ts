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
import { debounceTime, Subject } from "rxjs";
import { parse } from "./parser";
import { updateTokenColors } from "./theme_colors";
import { log } from "./logger";
import {
  applyDecorations,
  initDecorations,
  updateBuilderChainDecorations,
  updateEnumDecorations,
  updateTokenBasedDecorationTypes,
} from "./decorations";

function registerHandlers(context: vscode.ExtensionContext) {
  let activeEditor = vscode.window.activeTextEditor;

  const decorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: "yellow",
  });

  const updateSubject = new Subject<void>();
  const updateDecorations = () => {
    if (!activeEditor) {
      return;
    }
    const document = activeEditor.document;
    if (document.languageId !== "typescript") {
      return;
    }
    if (!vscode.workspace.asRelativePath(document.uri).startsWith("src")) {
      return;
    }
    // log(document.fileName);
    const { chainCalls } = parse(document.fileName, document.getText());
    initDecorations();
    updateEnumDecorations(activeEditor);
    updateBuilderChainDecorations(activeEditor, chainCalls);
    applyDecorations(activeEditor);
  };

  const updateSubscription = updateSubject
    .pipe(debounceTime(100))
    .subscribe(updateDecorations);
  context.subscriptions.push({
    dispose: () => updateSubscription.unsubscribe(),
  });

  updateTokenColors();
  vscode.window.onDidChangeActiveColorTheme(async (theme) => {
    log(theme); // no usage at all
    // FIXME: when "previewing" theme, the settings won't update
    // let workspace.getConfiguration be able to get the latest theme name
    await new Promise((resolve) => setTimeout(resolve, 500));
    updateTokenColors();
    updateTokenBasedDecorationTypes();
    updateSubject.next();
  });

  // vscode.workspace.onDidOpenTextDocument((document) => {
  //   if (document.languageId === "typescript") {
  //     vscode.commands.executeCommand("editor.foldLevel1");
  //   }
  // });

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    activeEditor = editor;
    updateSubject.next();
  }, context.subscriptions);

  vscode.workspace.onDidChangeTextDocument((event) => {
    if (activeEditor && event.document === activeEditor.document) {
      updateSubject.next();
    }
  }, context.subscriptions);

  vscode.window.onDidChangeTextEditorSelection((event) => {
    if (activeEditor && event.textEditor === activeEditor) {
      updateSubject.next();
    }
  }, context.subscriptions);

  updateDecorations();

  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBarItem.text = `$(game)`;
  statusBarItem.tooltip = "@gi-tcg/data Extension is activated";
  statusBarItem.show();
}

export async function activate(context: vscode.ExtensionContext) {
  log('Congratulations, your extension "gi-tcg-data-extension" is now active!');

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders?.length === 1) {
    const rootPath = workspaceFolders[0].uri;
    const packageJsonPath = vscode.Uri.joinPath(rootPath, 'package.json');

    try {
      const fileContent = await vscode.workspace.fs.readFile(packageJsonPath);
      const packageJson = JSON.parse(fileContent.toString());
      if (packageJson.name === "@gi-tcg/data") {
        registerHandlers(context);
      }
    } catch (e) {
      log(e);
    }
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
