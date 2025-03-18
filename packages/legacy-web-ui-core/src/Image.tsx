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

import {
  ComponentProps,
  Show,
  createResource,
  splitProps,
  untrack,
} from "solid-js";
import { usePlayerContext } from "./Chessboard";

export interface ImageProps extends ComponentProps<"img"> {
  imageId: number;
}

export function Image(props: ImageProps) {
  const [local, rest] = splitProps(props, ["imageId", "width", "height"]);
  const { assetsManager } = usePlayerContext();
  const placeholderUrl = () =>
    `https://placehold.jp/70x120.png?text=${encodeURIComponent(
      assetsManager.getNameSync(local.imageId) ?? local.imageId,
    )}`;
  const [url] = createResource(
    () =>
      assetsManager.getImageUrl(local.imageId, {
        thumbnail: true,
      }),
    {
      initialValue: untrack(placeholderUrl),
    },
  );

  const classNames = "flex items-center justify-center object-cover";
  const innerProps = (): ComponentProps<"img"> => ({
    ...rest,
    class: `${rest.class ?? ""} ${classNames}`,
    src: url(),
    alt: assetsManager.getNameSync(local.imageId) ?? `${local.imageId}`,
    draggable: "false",
    style: {
      background: url.state === "ready" ? void 0 : "#e5e7eb",
      height: local.height ? `${local.height}px` : void 0,
      width: local.width ? `${local.width}px` : void 0,
    },
  });

  return (
    <Show
      when={url.state === "ready"}
      fallback={
        <div {...(innerProps() as ComponentProps<"div">)}>
          {innerProps().alt}
        </div>
      }
    >
      <img {...innerProps()} />
    </Show>
  );
}
