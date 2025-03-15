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

import {
  createEffect,
  createMemo,
  createResource,
  Show,
  type JSX,
} from "solid-js";

export interface WithDelicateUi {
  assetId: string | string[];
  fallback: JSX.Element;
  children: (...assets: HTMLImageElement[]) => JSX.Element;
}

const UI_ASSET_URL_BASE = `https://ui.assets.gi-tcg.guyutongxue.site/`;

export function WithDelicateUi(props: WithDelicateUi) {
  const assetId = createMemo(() => props.assetId);
  const assetUrls = createMemo(() => {
    const id = assetId();
    return (Array.isArray(id) ? id : [id]).map(
      (id) => `${UI_ASSET_URL_BASE}${id}.webp`,
    );
  });
  createEffect(() => console.log(assetUrls()));
  const [resource] = createResource(assetUrls, (urls) =>
    Promise.all(
      urls.map(
        (url) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(img);
            img.onerror = () => reject(null);
          }),
      ),
    ),
  );
  return (
    <Show when={resource.state === "ready"} fallback={props.fallback}>
      {props.children(...(resource() as HTMLImageElement[]))}
    </Show>
  );
}
