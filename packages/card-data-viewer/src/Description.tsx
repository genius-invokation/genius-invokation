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
  getImageUrl,
  getNameSync,
  KEYWORD_ID_OFFSET,
} from "@gi-tcg/assets-manager";
import {
  createEffect,
  createMemo,
  createResource,
  For,
  Match,
  Show,
  Switch,
} from "solid-js";
import { createStore, produce } from "solid-js/store";
import { Reference } from "./Entity";

type DescriptionItem =
  | {
      type: "text";
      content: string;
    }
  | {
      type: "key";
      content: string;
    }
  | {
      type: "damage";
      dType?: string;
    }
  | {
      type: "reference";
      rType: string; // "C" | "K" | "S" | "A"
      id: number;
    };

const descriptionToItems = (
  description: string,
  keyMap: Record<string, string> = {},
): DescriptionItem[] => {
  const text = description
    .replace(/<.*?>/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\{.*?\}/g, "");
  const segs = text.replace(/\$\[(.*?)\]/g, "$$[$1$$[").split("$[");
  const result: DescriptionItem[] = [];
  for (let i = 0; i < segs.length; i++) {
    result.push({ type: "text", content: segs[i] });
    i++;
    if (i >= segs.length) break;
    if (segs[i] === "D__KEY__ELEMENT") {
      result.push({ type: "damage", dType: keyMap[segs[i]] });
    } else if (keyMap[segs[i]]) {
      result.push({ type: "key", content: keyMap[segs[i]] });
    } else {
      const rType = segs[i][0];
      let id = Number(segs[i].substring(1));
      if (rType === "K") {
        id += KEYWORD_ID_OFFSET;
      }
      result.push({ type: "reference", rType, id });
    }
  }
  return result;
};

interface DamageDescriptionProps {
  dType: string | undefined;
  assetsApiEndPoint?: string;
  onRequestExplain?: (id: number) => void;
}

const DAMAGE_COLORS = [
  "#000000",
  "#91d5ff",
  "#1890ff",
  "#f5222d",
  "#722ed1",
  "#36cfc9",
  "#d4b106",
  "#52c41a",
];

function DamageDescription(props: DamageDescriptionProps) {
  const id = () =>
    [
      void 0,
      "GCG_ELEMENT_CRYO",
      "GCG_ELEMENT_HYDRO",
      "GCG_ELEMENT_PYRO",
      "GCG_ELEMENT_ELECTRO",
      "GCG_ELEMENT_ANEMO",
      "GCG_ELEMENT_GEO",
      "GCG_ELEMENT_DENDRO",
    ].indexOf(props.dType);
  const keywordId = () => KEYWORD_ID_OFFSET + 100 + id();
  const text = () => getNameSync(keywordId());
  const [url] = createResource(
    () => [id(), { ...props }] as const,
    ([id, p]) => getImageUrl(id, { assetsApiEndpoint: p.assetsApiEndPoint }),
  );
  return (
    <>
      <Show when={id() <= 7 && url()}>
        {(url) => <img src={url()} class="inline-block h-1em mb-2px mx-1" />}
      </Show>
      <span
        class="font-bold underline underline-1 underline-offset-3 cursor-pointer"
        style={{ color: DAMAGE_COLORS[id()] }}
        onClick={() => props.onRequestExplain?.(keywordId())}
      >
        {text()}
      </span>
    </>
  );
}

export interface DescriptionProps {
  description: string;
  keyMap?: Record<string, string>;
  assetsApiEndPoint?: string;
  includesImage: boolean;
  onRequestExplain?: (id: number) => void;
  onAddReference?: (defId: number) => void;
}

export function Description(props: DescriptionProps) {
  const items = createMemo(() =>
    descriptionToItems(props.description, props.keyMap),
  );
  const [references, setReferences] = createStore<number[]>([]);

  const addReference = (defId: number) => {
    setReferences(
      produce((prev) => {
        if (!prev.includes(defId)) {
          prev.push(defId);
        }
      }),
    );
  };

  createEffect(() => {
    for (const item of items()) {
      if (item.type === "reference" && item.rType === "C") {
        (props.onAddReference ?? addReference)(item.id);
      }
    }
  });

  return (
    <>
      <p class="line-height-normal whitespace-pre-wrap mb-2">
        <For each={items()}>
          {(item) => (
            <Switch>
              <Match when={item.type === "text" && item} keyed>
                {(item) => <span>{item.content}</span>}
              </Match>
              <Match when={item.type === "key" && item} keyed>
                {(item) => <span>{item.content}</span>}
              </Match>
              <Match when={item.type === "damage" && item} keyed>
                {(item) => (
                  <DamageDescription
                    dType={item.dType}
                    assetsApiEndPoint={props.assetsApiEndPoint}
                    onRequestExplain={props.onRequestExplain}
                  />
                )}
              </Match>
              <Match when={item.type === "reference" && item} keyed>
                {(item) => (
                  <Show
                    when={item.rType === "K"}
                    fallback={
                      <span class="font-bold mx-1">
                        {getNameSync(item.id) ?? item.id}
                      </span>
                    }
                  >
                    <span
                      class="font-bold underline underline-1 underline-offset-3 cursor-pointer mx-1"
                      onClick={() => props.onRequestExplain?.(item.id)}
                    >
                      {getNameSync(item.id)}
                    </span>
                  </Show>
                )}
              </Match>
            </Switch>
          )}
        </For>
      </p>
      <ul class="b-l-2 p-l-2 b-solid b-yellow-5">
        <For each={references}>
          {(defId) => (
            <li>
              <Reference
                {...props}
                definitionId={defId}
                onAddReference={props.onAddReference ?? addReference}
              />
            </li>
          )}
        </For>
      </ul>
    </>
  );
}
