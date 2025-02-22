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

import { children, type JSX } from "solid-js";

export interface ButtonProps {
  class?: string;
  children: JSX.Element;
  onClick: (e: MouseEvent) => void;
}

export function Button(props: ButtonProps) {
  const ch = children(() => props.children);
  return (
    <button
      class={`flex items-center justify-center px-8 h-10 text-lg font-bold rounded-5 b-yellow-800 b-1 bg-yellow-50 hover:bg-yellow-100 active:bg-yellow-200 text-yellow-800 transition-colors line-height-none ${
        props.class ?? ""
      }`}
      onClick={(e) => props.onClick(e)}
    >
      {ch()}
    </button>
  );
}
