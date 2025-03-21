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

import type { AnyState } from "@gi-tcg/core";
import { createMemo, createSignal, ErrorBoundary, For, Show } from "solid-js";
import { ActionCard, Character, Entity, Keyword, Skill } from "./Entity";
import type { DefinitionIdStr } from "@gi-tcg/utils";

export type StateType = AnyState["definition"]["type"] | "skill" | "keyword";

export type ViewerInput =
  | {
      from: "definitionId";
      definitionId: DefinitionIdStr;
      type: StateType;
    }
  | {
      from: "state";
      id: number;
      type: StateType;
      definitionId: DefinitionIdStr;
      variableValue?: number;
      descriptionDictionary: {
        [key: string]: string;
      };
    };

export interface CardDataViewerProps {
  inputs: ViewerInput[];
  includesImage: boolean;
}

export interface CardDataViewerContainerProps extends CardDataViewerProps {
  shown: boolean;
}

export function CardDataViewerContainer(props: CardDataViewerContainerProps) {
  return (
    <Show when={props.shown}>
      <CardDataViewer {...props} />
    </Show>
  );
}

function CardDataViewer(props: CardDataViewerProps) {
  const grouped = createMemo(() => Object.groupBy(props.inputs, (i) => i.type));
  const hasStatuses = () => {
    const g = grouped();
    return g.equipment || g.status || g.combatStatus;
  };
  const equipmentAndStatuses = () => [
    ...(grouped().equipment ?? []),
    ...(grouped().status ?? []),
  ];

  const [explainKeyword, setExplainKeyword] = createSignal<DefinitionIdStr | null>(null);
  const onRequestExplain = (definitionId: DefinitionIdStr) => {
    setExplainKeyword((prev) => (prev === definitionId ? null : definitionId));
  };

  return (
    <div class="gi-tcg-card-data-viewer reset">
      <ErrorBoundary
        fallback={(err) => (
          <div class="card-panel">
            <p>加载失败</p>
            <pre class="whitespace-pre-wrap">
              {"message" in err ? err.message : `${err}`}
            </pre>
          </div>
        )}
      >
        <div class="h-full w-full flex flex-row justify-begin items-start select-none gap-2 min-h-0">
          <For each={grouped().character}>
            {(input) => (
              <div class="card-panel">
                <Character
                  {...props}
                  input={input}
                  onRequestExplain={onRequestExplain}
                />
              </div>
            )}
          </For>
          <For each={grouped().card}>
            {(input) => (
              <div class="card-panel">
                <ActionCard
                  class="min-h-0"
                  {...props}
                  input={input}
                  onRequestExplain={onRequestExplain}
                />
              </div>
            )}
          </For>
          <For each={grouped().skill}>
            {(input) => (
              <div class="card-panel">
                <Skill
                  class="min-h-0"
                  {...props}
                  input={input}
                  onRequestExplain={onRequestExplain}
                />
              </div>
            )}
          </For>
          <For
            each={[...(grouped().summon ?? []), ...(grouped().support ?? [])]}
          >
            {(input) => (
              <div class="card-panel">
                <Entity
                  class="min-h-0"
                  {...props}
                  input={input}
                  onRequestExplain={onRequestExplain}
                />
              </div>
            )}
          </For>
          <Show when={hasStatuses()}>
            <div class="card-panel">
              <Show when={equipmentAndStatuses().length}>
                <h3 class="text-yellow-7 mb-2">装备与状态</h3>
              </Show>
              <For each={equipmentAndStatuses()}>
                {(input) => (
                  <Entity
                    class="b-yellow-3 b-1 rounded-md mb-2"
                    {...props}
                    input={input}
                    asChild
                    onRequestExplain={onRequestExplain}
                  />
                )}
              </For>
              <Show when={grouped().combatStatus?.length}>
                <h3 class="text-yellow-7 mb-2">出战状态</h3>
              </Show>
              <For each={grouped().combatStatus}>
                {(input) => (
                  <Entity
                    class="b-yellow-3 b-1 rounded-md mb-2"
                    {...props}
                    input={input}
                    asChild
                    onRequestExplain={onRequestExplain}
                  />
                )}
              </For>
            </div>
          </Show>
          <Show when={explainKeyword()}>
            {(defId) => (
              <div class="card-panel">
                <Keyword {...props} definitionId={defId()} />
                <div
                  class="absolute right-1 top-1 text-xs"
                  onClick={() => setExplainKeyword(null)}
                >
                  &#10060;
                </div>
              </div>
            )}
          </Show>
        </div>
      </ErrorBoundary>
    </div>
  );
}
