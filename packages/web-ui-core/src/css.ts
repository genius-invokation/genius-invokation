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

const REGISTERED: unique symbol = Symbol(
  "gi-tcg-web-ui-core-css-property-registered",
);

/**
 * Using `opacity: <value>` in CSS animation causes `backface-visibility: hidden` to be ignored.
 * https://dev.to/skymax/backface-visibility-doesn-t-work-when-used-together-with-an-animation-11hf
 */
export const OPACITY_PROP = "--gi-tcg-opacity";

export function registerCssProperty() {
  if (Reflect.has(window, REGISTERED)) {
    return;
  }
  CSS.registerProperty({
    name: OPACITY_PROP,
    syntax: "<number>",
    inherits: false,
    initialValue: "1",
  });
  Reflect.set(window, REGISTERED, true);
}
