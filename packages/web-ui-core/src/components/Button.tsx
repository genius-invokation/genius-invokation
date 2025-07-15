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
import ButtonNormal from "../svg/ButtonNormal.svg";
import ButtonHover from "../svg/ButtonHover.svg";
import ButtonActive from "../svg/ButtonActive.svg";

export interface ButtonProps {
  class?: string;
  children: JSX.Element;
  onClick: (e: MouseEvent) => void;
}

export function Button(props: ButtonProps) {
  const ch = children(() => props.children);
  return (
    <button
      class={`grid h-10.8 w-45 group-confirm-button bg-transparent ${
        props.class ?? ""
      }`}
      onClick={(e) => props.onClick(e)}
    >
      <img 
        src={ButtonNormal} 
        class="grid-area-[1/1] w-45 h-10.8 block group-[-confirm-button]-hover:hidden group-[-confirm-button]-active:hidden" 
      />
      <img 
        src={ButtonHover} 
        class="grid-area-[1/1] w-45 h-10.8 hidden group-[-confirm-button]-hover:block group-[-confirm-button]-active:hidden" 
      />
      <img 
        src={ButtonActive} 
        class="grid-area-[1/1] w-45 h-10.8 hidden group-[-confirm-button]-active:block" 
      />
      <div class="grid-area-[1/1] h-full w-full flex items-center justify-center text-lg font-bold text-black/70 transition-colors line-height-none">
      {ch()}        
      </div>
    </button>
  );
}
