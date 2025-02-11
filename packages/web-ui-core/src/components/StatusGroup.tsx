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

import { Key } from "@solid-primitives/keyed";
import type { EntityInfo } from "./Chessboard";
import type { PbEntityState } from "@gi-tcg/typings";
import { Image } from "./Image";
import { createMemo } from "solid-js";

interface StatusProps {
  id: number;
  data: PbEntityState;
}

function Status(props: StatusProps) {
  const data = createMemo(() => props.data);
  return (
    <div>
      <Image imageId={data().definitionId} class="h-5 w-5" />
    </div>
  );
}

export interface StatusGroupProps {
  class?: string;
  statuses: EntityInfo[];
}

export function StatusGroup(props: StatusGroupProps) {
  // TODO: if length > 4, add a ellipsis
  return (
    <div class={`flex flex-row ${props.class ?? ""}`}>
      <Key each={props.statuses.slice(0, 4)} by="id">
        {(status) => <Status {...status()} />}
      </Key>
    </div>
  );
}
