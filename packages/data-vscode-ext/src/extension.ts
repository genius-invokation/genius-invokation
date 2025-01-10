import * as vscode from "vscode";
import { debounceTime, Subject } from "rxjs";
import { parse } from "./parser";
import { updateTokenColors } from "./theme_colors";
import { log } from "./logger";
import { updateBuilderChainDecorations } from "./builder_chain_coloring";

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
    const { chainCalls } = parse(document.fileName, document.getText());
    log(chainCalls.map((calls) => calls.map((call) => call.text)));

    updateBuilderChainDecorations(activeEditor, chainCalls);
  };

  const updateSubscription = updateSubject
    .pipe(debounceTime(100))
    .subscribe(updateDecorations);
  context.subscriptions.push({
    dispose: () => updateSubscription.unsubscribe(),
  });

  updateTokenColors();
  vscode.window.onDidChangeActiveColorTheme(() => {
    updateTokenColors();
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
  }, context.subscriptions)

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
    const rootPath = workspaceFolders[0].uri.fsPath;
    const packageJsonPath = vscode.Uri.file(`${rootPath}/package.json`);

    try {
      const fileContent = await vscode.workspace.fs.readFile(packageJsonPath);
      const packageJson = JSON.parse(fileContent.toString());
      if (packageJson.name === "@gi-tcg/data") {
        registerHandlers(context);
      }
    } catch {}
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
