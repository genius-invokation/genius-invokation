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
import VisibilityIcon from "../svg/VisibilityIcon.svg?component-solid";

export interface SpecialViewToggleButtonProps {
  onClick?: () => void;
}

export function SpecialViewToggleButton(props: SpecialViewToggleButtonProps) {
  return (
    <button
      class="h-8 w-8 flex items-center justify-center rounded-full b-yellow-800 b-1 bg-yellow-50 hover:bg-yellow-100 active:bg-yellow-200 text-yellow-800 transition-colors line-height-none cursor-pointer z-1"
      onClick={() => {
        props.onClick?.();
      }}
    >
      <VisibilityIcon />
    </button>
  );
}
