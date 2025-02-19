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

export function SelectingIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="72"
      height="72"
      viewBox="0 0 24 24"
      style={{ color: "#ffdf20" }}
    >
      <g
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2.5"
        stroke-opacity="0.8"
      >
        <path
          stroke-dasharray="16"
          stroke-dashoffset="0"
          d="M12 3c4.97 0 9 4.03 9 9"
        >
          <animateTransform
            attributeName="transform"
            dur="10s"
            repeatCount="indefinite"
            type="rotate"
            values="0 12 12;360 12 12"
          />
        </path>
        <path
          stroke-dasharray="16"
          stroke-dashoffset="0"
          d="M12 3c4.97 0 9 4.03 9 9"
        >
          <animateTransform
            attributeName="transform"
            dur="10s"
            repeatCount="indefinite"
            type="rotate"
            values="120 12 12;480 12 12"
          />
        </path>
        <path
          stroke-dasharray="16"
          stroke-dashoffset="0"
          d="M12 3c4.97 0 9 4.03 9 9"
        >
          <animateTransform
            attributeName="transform"
            dur="10s"
            repeatCount="indefinite"
            type="rotate"
            values="240 12 12;600 12 12"
          />
        </path>
      </g>
    </svg>
  );
}
