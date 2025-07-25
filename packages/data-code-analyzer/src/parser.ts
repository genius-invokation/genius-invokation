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
import asserts from "node:assert";

export interface ChainCallEntry {
  idStart: number;
  idEnd: number;
  callEnd: number;
  text: string;
}

type Id = number | string;

export interface Binding {
  name: string;
  id: Id;
}
export interface ChainCall {
  expression: ts.Expression;
  chainCallEntries: ChainCallEntry[];
  bindings: Binding[];
  isExport: boolean;
}

interface ParseChainCallResult {
  chainCallEntries: ChainCallEntry[];
  ids: Id[];
}

function parseId(node: ts.Expression): Id {
  if (ts.isNumericLiteral(node)) {
    return Number(node.text);
  } else if (ts.isStringLiteral(node)) {
    return node.text;
  } else {
    throw new Error(`Expect number or string literal, got ${ts.SyntaxKind[node.kind]}`);
  }
}

function parseChainCalls(
  node: ts.Expression,
  sourceFile: ts.SourceFile,
): ParseChainCallResult | undefined {
  const chainCalls: ChainCallEntry[] = [];
  let currentArgs: readonly ts.Expression[] = [];
  const ids: Id[] = [];
  while (true) {
    if (node.kind !== ts.SyntaxKind.CallExpression) {
      return;
    }
    const {
      end,
      expression: callee,
      arguments: args,
    } = node as ts.CallExpression;
    if (ts.isPropertyAccessExpression(callee)) {
      const { expression, name } = callee;
      const text = name.text;
      chainCalls.push({
        idStart: name.end - text.length,
        idEnd: name.end,
        callEnd: end,
        text,
      });
      if (text === "toStatus" || text === "toCombatStatus") {
        asserts(args.length >= 1);
        ids.unshift(parseId(args[0]));
      }
      node = expression;
      currentArgs = args;
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
      asserts(args.length >= 1);
      ids.unshift(parseId(args[0]));
      break;
    } else {
      return;
    }
  }
  return {
    ids,
    chainCallEntries: chainCalls.toReversed(),
  };
}

export interface ImportedName {
  name: string;
  sourceName: string;
  fromSpecifier: string;
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
  otherDecls: ts.Declaration[];
  importedNames: ImportedName[];
}

function parseNames(declaration: ts.VariableDeclaration): ts.Identifier[] {
  const { name } = declaration;
  const result: ts.Identifier[] = [];
  const run = (node: ts.BindingName) => {
    if (ts.isIdentifier(node)) {
      result.push(node);
    } else if (ts.isArrayBindingPattern(node)) {
      for (const element of node.elements) {
        if (ts.isOmittedExpression(element)) {
          continue;
        }
        run(element.name);
      }
    } else if (ts.isObjectBindingPattern(node)) {
      for (const element of node.elements) {
        run(element.name);
      }
    }
  };
  run(name);
  return result;
}

export function parse(filename: string, content: string): ParseResult {
  const file = ts.createSourceFile(filename, content, ts.ScriptTarget.Latest);

  const importedNames: ImportedName[] = [];
  const chainCalls: ChainCall[] = [];
  const otherDecls: ts.Declaration[] = [];

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
          const parsed = parseChainCalls(declaration.initializer, file);
          if (!parsed) {
            otherDecls.push(declaration);
            continue;
          }
          const identifiers = parseNames(declaration);
          asserts(identifiers.length <= parsed.ids.length, `${identifiers} <=> ${parsed.ids}`);
          chainCalls.push({
            expression: declaration.initializer,
            chainCallEntries: parsed.chainCallEntries,
            bindings: identifiers.map((name, i) => ({
              name: name.text,
              id: parsed.ids[i],
            })),
            isExport,
          });
        }
      }
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
  return {
    filename,
    file,
    chainCalls,
    importedNames,
    otherDecls,
  };
}
