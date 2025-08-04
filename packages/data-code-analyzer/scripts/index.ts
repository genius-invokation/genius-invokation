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

import { Glob } from "bun";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Project } from "ts-morph";
import { TcgDataSourceFile } from "./source_file";
import { TcgDataProject } from "./project";
import { CURRENT_VERSION, Version } from "@gi-tcg/core";
import { Location } from "./declaration";

export const base = fileURLToPath(new URL("../../data", import.meta.url).href);

const project = new Project({
  tsConfigFilePath: path.join(base, "tsconfig.json"),
});

const tcgProject = new TcgDataProject(project);
for await (const file of new Glob("src/**/*.ts").scan(base)) {
  if (file.includes("old_versions")) {
    continue;
  }
  const filepath = path.join(base, file);
  const source = project.getSourceFileOrThrow(filepath);
  tcgProject.addFile(source);
}

export interface AnalyzeResult {
  id: number;
  dependencies: number[];
  variableName: string;
  nameIndex: number | null;
  // jsdocComment: string;
  code: string;
  location: Location;
}

const result: AnalyzeResult[] = [];
for (const [, file] of tcgProject.files) {
  for (const [name, decl] of file.varDecls) {
    if (!decl.isEntity()) {
      continue;
    }
    const references = file.getReferencesOfDecl(decl);
    result.push({
      id: decl.id,
      dependencies: references.values().map((r) => r.id).toArray(),
      variableName: name,
      nameIndex: decl.nameIndex,
      // jsdocComment: decl.getJsDocComment(),
      code: decl.getCode(),
      location: decl.getLocation(),
    });
  }
}

await Bun.write(`${import.meta.dirname}/../src/result.json`, JSON.stringify(result, null, 2));
