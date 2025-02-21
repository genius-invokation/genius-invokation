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

import { createMemo } from "solid-js";

export interface VariableDiffProps {
  class?: string;
  defeated?: boolean;
  oldValue: number;
  newValue: number;
}

export function VariableDiff(props: VariableDiffProps) {
  const increase = createMemo(() => props.newValue >= props.oldValue);
  return (
    <div
      class={`data-[increase=true]-bg-green-500 data-[increase=false]-bg-red-500 text-white font-bold h-8 min-w-10 rounded-4 line-height-none flex items-center justify-center ${
        props.class ?? ""
      }`}
      data-increase={increase()}
    >
      <span>
        {increase() ? "+" : "-"}
        {Math.abs(props.newValue - props.oldValue)}
      </span>
    </div>
  );
}
