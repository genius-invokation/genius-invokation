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

import { EntityType } from "@gi-tcg/core";
import * as ts from "typescript";
import { ParseResult } from "./parser";

export interface SourceLoc {
  file: string;
  start: number;
  end: number;
}

export interface DataEntry {
  id: number;
  factoryType: EntityType | "character" | "extension" | "skill";
  variableName: string;
  source: string;
  location: SourceLoc;
  references: number[];
}

export function analyze(parsedFiles: ParseResult[]): DataEntry[] {
  const dataEntries: DataEntry[] = [];
  for (const parsedFile of parsedFiles) {
    for (const chainCall of parsedFile.chainCalls) {
      const { expression, entries } = chainCall;
      if (ts.isIdentifier(expression)) {
        const variableName = expression.text;
        const source = parsedFile.file;
        const location = {
          file: source,
          start: expression.getStart(),
          end: expression.getEnd(),
        };
        for (const entry of entries) {
          dataEntries.push({
            id: entry.idStart,
            factoryType: "character",
            variableName,
            source,
            location,
            references: [],
          });
        }
      }
    }
  }
  return dataEntries;
}
