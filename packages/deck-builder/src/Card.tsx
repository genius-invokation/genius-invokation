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

import { Show, createResource, onCleanup } from "solid-js";
import { useDeckBuilderContext } from "./DeckBuilder";
import { getImageUrl } from "@gi-tcg/assets-manager";

export interface CardProps {
  id: number;
  name: string;
  partialSelected?: boolean;
  selected?: boolean;
}

export function Card(props: CardProps) {
  const { assetsApiEndpoint } = useDeckBuilderContext();
  const [url] = createResource(() =>
    getImageUrl(props.id, { assetsApiEndpoint }),
  );
  return (
    <div
      title={props.name}
      data-selected={props.selected}
      data-partial-selected={props.partialSelected}
      class="w-full rounded-lg overflow-clip data-[selected=true]:border-green data-[partial-selected=true]:border-yellow border-2 border-transparent"
    >
      <Show
        when={url.state === "ready"}
        fallback={
          <div class="w-full aspect-ratio-[7/12] bg-gray-200">{props.name}</div>
        }
      >
        <img src={url()} alt={props.name} draggable="false" />
      </Show>
    </div>
  );
}
