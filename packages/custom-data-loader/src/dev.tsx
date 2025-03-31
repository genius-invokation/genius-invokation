// Copyright (C) 2025 Guyutongxue
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

import * as monaco from "monaco-editor";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import { createEffect, createSignal, onMount } from "solid-js";
import { render } from "solid-js/web";

self.MonacoEnvironment = {
  getWorker: () => new tsWorker(),
};

monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: false,
  noSyntaxValidation: false,
});
monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
  target: monaco.languages.typescript.ScriptTarget.ESNext,
  allowNonTsExtensions: true,
});

const root = document.querySelector("#root")!;

interface MonacoEditorProps {
  code?: string;
  onCodeChange?: (code: string) => void;
}

const MonacoEditor = (props: MonacoEditorProps) => {
  let container!: HTMLDivElement;
  let editor: monaco.editor.IStandaloneCodeEditor | null = null;
  onMount(() => {
    editor = monaco.editor.create(container, {
      language: "javascript",
      automaticLayout: true,
    });
    editor.onDidChangeModelContent((e) => {
      const code = editor?.getValue() ?? "";
      props.onCodeChange?.(code);
    });
  });

  createEffect(() => {
    editor?.setValue(props.code ?? "");
  });
  return <div class="editor" ref={container}></div>;
};

const App = () => {
  const [code, setCode] = createSignal("");
  return (
    <div class="app">
      <MonacoEditor code={code()} onCodeChange={setCode} />
    </div>
  );
};

render(() => <App />, root);
