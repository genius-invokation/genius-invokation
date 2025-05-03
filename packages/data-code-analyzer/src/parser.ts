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

import * as ts from "typescript";

export interface ChainCallEntry {
  idStart: number;
  idEnd: number;
  callEnd: number;
  text: string;
}

export interface ChainCall {
  expression: ts.Expression;
  entries: ChainCallEntry[];
}

function parseChainCalls(node: ts.Expression): ChainCall | undefined {
  const chainCalls: ChainCallEntry[] = [];
  while (true) {
    if (node.kind !== ts.SyntaxKind.CallExpression) {
      return;
    }
    const { end, expression: callee } = node as ts.CallExpression;
    if (ts.isPropertyAccessExpression(callee)) {
      const { expression, name } = callee;
      const text = name.text;
      chainCalls.push({
        idStart: name.end - text.length,
        idEnd: name.end,
        callEnd: end,
        text,
      });
      node = expression;
      continue;
    } else if (ts.isIdentifier(callee)) {
      const name = callee as ts.Identifier;
      const text = name.text;
      chainCalls.push({
        idStart: name.end - text.length,
        idEnd: name.end,
        callEnd: end,
        text,
      });
      break;
    } else {
      return;
    }
  }
  return {
    expression: node,
    entries: chainCalls.reverse(),
  };
}

interface ImportedName {
  name: string;
  sourceName: string;
  fromSpecifier: string;
}
interface ExportedName {
  name: string;
  expression: ts.Expression;
  isDestructured: boolean;
}

const getBindingNames = (name: ts.BindingName): string[] => {
  if (ts.isIdentifier(name)) {
    return [name.text];
  } else if (ts.isObjectBindingPattern(name)) {
    return name.elements.flatMap((e) => getBindingNames(e.name));
  } else if (ts.isArrayBindingPattern(name)) {
    return name.elements.flatMap((e) =>
      "name" in e ? getBindingNames(e.name) : [],
    );
  }
  return [];
};

export interface ParseResult {
  filename: string;
  file: ts.SourceFile;
  chainCalls: ChainCall[];
  importedNames: ImportedName[];
  exportedNames: ExportedName[];
}

export function parse(filename: string, content: string): ParseResult {
  const file = ts.createSourceFile(filename, content, ts.ScriptTarget.Latest);

  const maybeChainCalls: ts.Expression[] = [];
  const importedNames: ImportedName[] = [];
  const exportedNames: ExportedName[] = [];

  for (const node of file.statements) {
    if (ts.isVariableStatement(node)) {
      const {
        declarationList: { declarations },
        modifiers,
      } = node;
      const isExport =
        modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
      for (const declaration of declarations) {
        if (declaration.initializer) {
          maybeChainCalls.push(declaration.initializer);
          if (isExport) {
            const { name } = declaration;
            const names = getBindingNames(name);
            for (const n of names) {
              exportedNames.push({
                name: n,
                expression: declaration.initializer,
                isDestructured: names.length > 1,
              });
            }
          }
        }
      }
    } else if (ts.isExpressionStatement(node)) {
      const { expression } = node as ts.ExpressionStatement;
      maybeChainCalls.push(expression);
    } else if (ts.isImportDeclaration(node)) {
      const { importClause, moduleSpecifier } = node;
      if (importClause) {
        const { namedBindings } = importClause;
        if (namedBindings) {
          if (ts.isNamedImports(namedBindings)) {
            for (const element of namedBindings.elements) {
              const { name, propertyName } = element;
              importedNames.push({
                name: propertyName?.text ?? name.text,
                sourceName: name.text,
                fromSpecifier: (moduleSpecifier as ts.StringLiteral).text,
              });
            }
          }
        }
      }
    } else {
      continue;
    }
  }

  const chainCalls = maybeChainCalls
    .map(parseChainCalls)
    .filter((call): call is ChainCall => !!call && call.entries.length > 1);
  return {
    filename,
    file,
    chainCalls,
    importedNames,
    exportedNames,
  };
}
