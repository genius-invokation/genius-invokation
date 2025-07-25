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

import * as ts from "typescript";
import { ChainCall, ParseResult } from "./parser";

export interface SourceLoc {
  file: string;
  start: number;
  end: number;
}

export const FACTORY_TYPE = [
  "character",
  "summon",
  "status",
  "combatStatus",
  "skill",
  "extension",
  "card",
] as const;
export type FactoryType = (typeof FACTORY_TYPE)[number];

export interface DataEntry {
  id: number;
  name: string;
  factoryType: FactoryType;
  source: string;
  location: SourceLoc;
  references: number[];
}

export interface FileEntry {
  parsedFile: ParseResult;
  data: DataEntry[];
  exports: Map<string, DataEntry>;
}

type AllExports = Map<string, FileEntry>;

export function analyzeExport(parsedFiles: ParseResult[]): AllExports {
  const exports = new Map<string, FileEntry>();
  for (const parsedFile of parsedFiles) {
    const { file, chainCalls } = parsedFile;
    const fileExports = new Map<string, DataEntry>();
    const fileData: DataEntry[] = [];
    for (const chainCall of chainCalls) {
      const { isExport, bindings, chainCallEntries, expression } = chainCall;
      const factoryType = chainCallEntries[0]?.text;
      if (!(FACTORY_TYPE as readonly string[]).includes(factoryType)) {
        continue;
      }
      const rest = {
        factoryType: factoryType as FactoryType,
        source: expression.getText(file),
        location: {
          file: file.fileName,
          start: expression.getStart(file),
          end: expression.getEnd(),
        },
      };
      for (const { name, id } of bindings) {
        const data: DataEntry = {
          id: id as number,
          name,
          references: [],
          ...rest,
        };
        if (isExport) {
          fileExports.set(name, data);
        }
      }
    }
    exports.set(file.fileName, {
      parsedFile,
      data: fileData,
      exports: fileExports,
    });
  }
  return exports;
}

export function feedReferences(
  parsedFile: ParseResult,
  entry: DataEntry,
  exports: AllExports,
) {
  const traverse = (node: ts.Node) => {
    ts.forEachChild(node, traverse);
  }
}
