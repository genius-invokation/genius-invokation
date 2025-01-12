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
import { log } from "./logger";

export interface ChainCallEntry {
  idStart: number;
  idEnd: number;
  callEnd: number;
  text: string;
}

function parseChainCalls(node: ts.Expression): ChainCallEntry[] {
  const chainCalls: ChainCallEntry[] = [];
  outer: while (true) {
    if (node.kind !== ts.SyntaxKind.CallExpression) {
      break;
    }
    const { end, expression: callee } = node as ts.CallExpression;
    switch (callee.kind) {
      case ts.SyntaxKind.PropertyAccessExpression: {
        const { expression, name } = callee as ts.PropertyAccessExpression;
        const text = name.text;
        chainCalls.push({
          idStart: name.end - text.length,
          idEnd: name.end,
          callEnd: end,
          text,
        });
        node = expression;
        continue;
      }
      case ts.SyntaxKind.Identifier: {
        const name = callee as ts.Identifier;
        const text = name.text;
        chainCalls.push({
          idStart: name.end - text.length,
          idEnd: name.end,
          callEnd: end,
          text,
        });
        break outer;
      }
      default:
        break outer;
    }
  }
  return chainCalls.reverse();
}

export function parse(filename: string, content: string) {
  const file = ts.createSourceFile(filename, content, ts.ScriptTarget.Latest);

  const maybeChainCalls: ts.Expression[] = [];

  for (const node of file.statements) {
    switch (node.kind) {
      case ts.SyntaxKind.VariableStatement:
        const {
          declarationList: { declarations },
        } = node as ts.VariableStatement;
        for (const declaration of declarations) {
          if (declaration.initializer) {
            maybeChainCalls.push(declaration.initializer);
          }
        }
        break;
      case ts.SyntaxKind.ExpressionStatement:
        const { expression } = node as ts.ExpressionStatement;
        maybeChainCalls.push(expression);
        break;
      default:
        continue;
    }
  }

  const chainCalls = maybeChainCalls
    .map(parseChainCalls)
    .filter((calls) => calls.length > 0);
  return {
    chainCalls,
  };
}
