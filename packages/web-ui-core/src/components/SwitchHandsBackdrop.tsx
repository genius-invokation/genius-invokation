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

export interface SwitchHandsBackdropProps {
  shown?: boolean;
  onClick?: (e: MouseEvent) => void;
}

export function SwitchHandsBackdrop(props: SwitchHandsBackdropProps) {
  return (
    <div
      class="absolute inset-0 top-50% left-50% -translate-x-50% -translate-y-50% translate-z-10 pointer-events-none data-[shown]:pointer-events-auto data-[shown]:bg-green-50/90 transition-colors h-102 w-170"
      bool:data-shown={props.shown}
      onClick={(e) => {
        e.stopPropagation();
        props.onClick?.(e);
      }}
    />
  );
}
