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
  type ComponentProps,
  Show,
  createMemo,
  createResource,
  mergeProps,
  splitProps,
} from "solid-js";
import { useUiContext } from "../hooks/context";

export interface ImageProps extends ComponentProps<"img"> {
  imageId: number;
  zero?: "unknown" | "physic";
  noAltText?: boolean;
}

export function Image(props: ImageProps) {
  const merged = mergeProps({ zero: "unknown" } as const, props);
  const [local, rest] = splitProps(merged, [
    "imageId",
    "width",
    "height",
    "zero",
    "noAltText",
  ]);
  const { assetsManager } = useUiContext();
  const [url] = createResource(
    () => local.imageId,
    (imageId) =>
      assetsManager.getImageUrl(imageId, {
        thumbnail: true,
      }),
  );

  const isUnknown = () => local.imageId === 0 && local.zero === "unknown";

  const showImage = () => {
    if (local.imageId === 0 && local.zero === "unknown") {
      return false;
    } else {
      return url.state === "ready";
    }
  };

  const classNames = "flex items-center justify-center object-cover";
  const innerProps = createMemo(
    (): ComponentProps<"img"> => ({
      ...rest,
      class: `${rest.class ?? ""} ${classNames}`,
      src: url(),
      alt: isUnknown()
        ? ""
        : assetsManager.getNameSync(local.imageId) ?? `${local.imageId}`,
      draggable: "false",
      style: {
        background: showImage() ? void 0 : "#e5e7eb",
        height: local.height ? `${local.height}px` : void 0,
        width: local.width ? `${local.width}px` : void 0,
      },
    }),
  );

  return (
    <Show
      when={showImage()}
      fallback={
        <div {...(innerProps() as ComponentProps<"div">)}>
          {local.noAltText ? "" : innerProps().alt}
        </div>
      }
    >
      <img {...innerProps()} />
    </Show>
  );
}
