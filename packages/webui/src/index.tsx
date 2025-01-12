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

import { type JSX } from "solid-js";
import { render } from "solid-js/web";
import {
  EMPTY_GAME_STATE,
  PlayerIOWithCancellation,
  StandaloneChessboard,
  StandaloneChessboardProps,
  WebUiOption,
  createPlayer as createPlayerSolid,
} from "@gi-tcg/webui-core";
import { DetailLogViewer } from "@gi-tcg/detail-log-viewer";
import webuiCss from "@gi-tcg/webui-core/style.css?inline";
import { customElement } from "solid-element";

export function createPlayer(
  element: HTMLElement,
  who: 0 | 1,
  opt?: WebUiOption,
) {
  const shadow = element.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = webuiCss;
  shadow.appendChild(style);
  let io: PlayerIOWithCancellation;
  render(() => {
    let Chessboard: (props: JSX.HTMLAttributes<HTMLDivElement>) => JSX.Element;
    [io, Chessboard] = createPlayerSolid(who, opt);
    return <Chessboard style={{ width: "100%", height: "100%" }} />;
  }, shadow);
  return io!;
}

const standaloneChessboardDefaultProps: StandaloneChessboardProps = {
  state: EMPTY_GAME_STATE,
  who: 0,
  mutations: [],
  previewData: null,
  assetApiEndpoint: void 0,
  assetAltText: void 0,
};

customElement(
  "gi-tcg-standalone-chessboard",
  standaloneChessboardDefaultProps,
  (props, { element }) => {
    return (
      <>
        <style>{webuiCss}</style>
        <StandaloneChessboard {...props} />
      </>
    );
  },
);

const detailLogViewerDefaultProps: DetailLogViewer.Props = {
  logs: [],
  names: void 0,
}

customElement(
  "gi-tcg-detail-log-viewer",
  detailLogViewerDefaultProps,
  (props, { element }) => {
    return (
      <>
        {/* <style>{css}</style> */}
        <DetailLogViewer {...props} />
      </>
    );
  },
)
