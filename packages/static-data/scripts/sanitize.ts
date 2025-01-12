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

function convertBold(str: string, removeBold?: boolean) {
  return str.replace(
    /<color=#FFD780FF>(.*?)<\/color>/gi,
    removeBold ? "$1" : "**$1**",
  );
}

function stripMarkup(str: string) {
  return str.replace(/(<([^>]+)>)/gi, "");
}

function replaceLayout(str: string) {
  return str
    .replace(/{LAYOUT_MOBILE#.*?}{LAYOUT_PC#(.*?)}{LAYOUT_PS#.*?}/gi, "$1")
    .replace("#", "")
    .replaceAll("{NON_BREAK_SPACE}", " ");
}

function removeSprite(str: string) {
  return str.replace(/{SPRITE_PRESET.*?}/gi, "");
}

function replaceNewline(str: string) {
  return str.replace(/\\n/gi, "\n");
}

export function sanitizeDescription(str: string, removeBold?: boolean) {
  return removeSprite(
    replaceNewline(replaceLayout(stripMarkup(convertBold(str, removeBold)))),
  );
}
