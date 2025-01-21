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

import { createResource, Match, Switch } from "solid-js";
import type {
  CardDataViewerProps,
  NestedStyle,
  ViewerInput,
} from "./CardDataViewer";
import { getData } from "@gi-tcg/assets-manager";
import type { CharacterRawData } from "@gi-tcg/static-data";

export interface CardDataProps {
  input: ViewerInput;
  assetsApiEndPoint?: string;
  includesImage: boolean;
  nestedStyle: NestedStyle;
}

export function Character(props: CardDataProps) {
  const [data] = createResource(
    () =>
      getData(props.input.definitionId, {
        assetsApiEndpoint: props.assetsApiEndPoint,
      }) as Promise<CharacterRawData>,
  );
  return (
    <div>
      <Switch>
        <Match when={data.error}>加载失败</Match>
        <Match when={data.loading}>加载中...</Match>
        <Match when={data()}>{(data) => <h3>{data().name}</h3>}</Match>
      </Switch>
    </div>
  );
}
