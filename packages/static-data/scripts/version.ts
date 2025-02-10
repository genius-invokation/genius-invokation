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
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { characters, actionCards } from "../src/index";
import { version as packageJsonVersion } from "../package.json" with { type: "json" };

const existingVersion = Object.fromEntries(
  [...characters, ...actionCards]
    .filter((d) => d.sinceVersion)
    .map((d) => [d.shareId!, d.sinceVersion!] as const),
);

const giIndex = packageJsonVersion.indexOf("gi-");
const newVersion = "v" + packageJsonVersion.substring(giIndex + 3).replace(/-/g, ".");

let newVersionChecked = false;
function checkNewVersion() {
  if (!newVersionChecked) {
    console.log(`Generating ${newVersion}...`);
    if (Object.values(existingVersion).includes(newVersion)) {
      throw new Error(
        "New version already exists, you may forget to update newVersion!",
      );
    }
    newVersionChecked = true;
  }
}

export function getVersion(shareId: number | undefined): string | undefined {
  if (typeof shareId === "undefined") {
    return;
  }
  if (shareId in existingVersion) {
    return existingVersion[shareId];
  }
  checkNewVersion();
  return newVersion;
}
