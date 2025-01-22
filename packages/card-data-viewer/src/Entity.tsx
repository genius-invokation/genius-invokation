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
  createResource,
  createSignal,
  For,
  Match,
  Show,
  Switch,
  type Setter,
} from "solid-js";
import type { ViewerInput } from "./CardDataViewer";
import { getData, getImageUrl, getNameSync } from "@gi-tcg/assets-manager";
import type {
  CharacterRawData,
  PlayCost,
  SkillRawData,
} from "@gi-tcg/static-data";
import { PlayCostList } from "./PlayCost";
import { Description } from "./Description";

export interface CardDataProps {
  input: ViewerInput;
  assetsApiEndPoint?: string;
  includesImage: boolean;
  onRequestExplain?: (id: number) => void;
}

export function Character(props: CardDataProps) {
  const [data] = createResource(
    () => ({ ...props }),
    (p) =>
      getData(p.input.definitionId, {
        assetsApiEndpoint: p.assetsApiEndPoint,
      }) as Promise<CharacterRawData>,
  );
  const [image] = createResource(
    () => ({ ...props }),
    (p) =>
      getImageUrl(p.input.definitionId, {
        assetsApiEndpoint: p.assetsApiEndPoint,
      }),
  );
  return (
    <div>
      <Switch>
        <Match when={data.error}>加载失败</Match>
        <Match when={data.loading}>加载中...</Match>
        <Match when={data()}>
          {(data) => (
            <>
              <Show when={props.includesImage}>
                <div class="w-20 float-start mr-3 mb-3">
                  <Show when={image()}>
                    {(image) => <img src={image()} class="w-full" />}
                  </Show>
                </div>
              </Show>
              <h3 class="font-bold mb-3">{data().name}</h3>
              <ul class="clear-both flex flex-col gap-2">
                <For each={data().skills}>
                  {(skill) => (
                    <Skill
                      {...props}
                      input={{
                        from: "definitionId",
                        type: "skill",
                        definitionId: skill.id,
                      }}
                      class="b-yellow-3 b-1 rounded-md"
                    />
                  )}
                </For>
              </ul>
            </>
          )}
        </Match>
      </Switch>
    </div>
  );
}

interface ExpandableCardDataProps extends CardDataProps {
  open?: boolean;
  setOpen?: Setter<boolean>;
  class?: string;
}

export function Skill(props: ExpandableCardDataProps) {
  const [data] = createResource(
    () => ({ ...props }),
    (p) =>
      getData(p.input.definitionId, {
        assetsApiEndpoint: p.assetsApiEndPoint,
      }) as Promise<SkillRawData>,
  );
  const [icon] = createResource(
    () => ({ ...props }),
    (p) =>
      getImageUrl(p.input.definitionId, {
        assetsApiEndpoint: p.assetsApiEndPoint,
      }),
  );
  const [skillTypeText, setSkillTypeText] = createSignal("");
  const [playCost, setPlayCost] = createSignal<PlayCost[]>([]);
  const SKILL_TYPE_TEXT_MAP: Record<string, string> = {
    GCG_SKILL_TAG_A: "普通攻击",
    GCG_SKILL_TAG_E: "元素战技",
    GCG_SKILL_TAG_Q: "元素爆发",
    GCG_SKILL_TAG_PASSIVE: "被动技能",
    GCG_SKILL_TAG_VEHICLE: "特技",
  };

  createEffect(() => {
    if (data.state === "ready") {
      setPlayCost(data().playCost);
      setSkillTypeText(SKILL_TYPE_TEXT_MAP[data().type]);
    }
  });
  return (
    <details
      class={`flex flex-col group ${props.class ?? ""}`}
      open={props.open}
      onToggle={(e) => props.setOpen?.((e.target as HTMLDetailsElement).open)}
    >
      <summary class="flex flex-row items-center gap-2 cursor-pointer rounded-md group-not-open:bg-yellow-2 transition-colors">
        <div class="w-12 h-12">
          <Show when={icon()}>
            {(icon) => <img src={icon()} class="w-full h-full" />}
          </Show>
        </div>
        <div class="flex flex-col">
          <h3>{getNameSync(props.input.definitionId) ?? props.input.definitionId}</h3>
          <div class="h-5 flex flex-row items-center gap-1">
            <span class="text-xs">{skillTypeText()}</span>
            <PlayCostList playCost={playCost()} />
          </div>
        </div>
      </summary>
      <Switch>
        <Match when={data.error}>加载失败</Match>
        <Match when={data.loading}>加载中...</Match>
        <Match when={data()}>
          {(data) => (
            <div class="p-2">
              <Description
                {...props}
                description={data().rawDescription}
                keyMap={data().keyMap}
                onRequestExplain={props.onRequestExplain}
              />
            </div>
          )}
        </Match>
      </Switch>
    </details>
  );
}
export interface CardDefinitionProps {
  definitionId: number;
  assetsApiEndPoint?: string;
  includesImage: boolean;
}

export function Keyword(props: CardDefinitionProps) {
  const [data] = createResource(
    () => ({ ...props }),
    (p) =>
      getData(p.definitionId, {
        assetsApiEndpoint: p.assetsApiEndPoint,
      }) as Promise<SkillRawData>,
  );
  return (
    <>
      <h3>
        <span class="text-yellow-7">规则解释：</span>
        <span class="font-bold">{getNameSync(props.definitionId) ?? props.definitionId}</span>
      </h3>
      <Switch>
        <Match when={data.error}>加载失败</Match>
        <Match when={data.loading}>加载中...</Match>
        <Match when={data()}>
          {(data) => (
            <div class="p-2">
              <Description {...props} description={data().rawDescription} />
            </div>
          )}
        </Match>
      </Switch>
    </>
  );
}

export interface ReferenceProps extends CardDefinitionProps {
  onAddReference?: (id: number) => void;
}

export function Reference(props: ReferenceProps) {
  const [data] = createResource(
    () => ({ ...props }),
    (p) =>
      getData(p.definitionId, {
        assetsApiEndpoint: p.assetsApiEndPoint,
      }) as Promise<SkillRawData>,
  );
  const [image] = createResource(
    () => ({ ...props }),
    (p) =>
      getImageUrl(p.definitionId, {
        assetsApiEndpoint: p.assetsApiEndPoint,
      }),
  );
  return (
    <div>
      <Show when={props.includesImage}>
        <div class="w-8 float-start mr-2 mb-2">
          <Show when={image()}>
            {(image) => <img src={image()} class="w-full" />}
          </Show>
        </div>
      </Show>
      <h4>{getNameSync(props.definitionId) ?? props.definitionId}</h4>
      <div class="text-sm">
        <Switch>
          <Match when={data.error}>加载失败</Match>
          <Match when={data.loading}>加载中...</Match>
          <Match when={data()}>
            {(data) => (
              <Description {...props} description={data().rawDescription} onAddReference={props.onAddReference} />
            )}
          </Match>
        </Switch>
      </div>
    </div>
  );
}
