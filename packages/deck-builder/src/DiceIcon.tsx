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

import { createResource, Show } from "solid-js";
import { useDeckBuilderContext } from "./DeckBuilder";

export interface DiceIconProps {
  id: number;
}

const CHARACTER_ELEMENT_NAME = {
  1: "冰",
  2: "水",
  3: "火",
  4: "雷",
  5: "风",
  6: "岩",
  7: "草",
} as Record<number, string>;

export function DiceIcon(props: DiceIconProps) {
  const { assetsManager } = useDeckBuilderContext();
  const [url] = createResource(() =>
    assetsManager.getImageUrl(props.id, { thumbnail: true }),
  );
  return (
    <Show
      when={url.state === "ready"}
      fallback={CHARACTER_ELEMENT_NAME[Number(props.id)]}
    >
      <img src={url()} />
    </Show>
  );
}
