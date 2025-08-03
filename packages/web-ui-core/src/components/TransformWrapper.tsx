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
  children,
  onCleanup,
  onMount,
  untrack,
  type JSX,
  type Setter,
} from "solid-js";
import { MINIMUM_HEIGHT, MINIMUM_WIDTH, unitInPx } from "../layout";
import { funnel } from "remeda";

export type Rotation = 0 | 90 | 180 | 270;
export interface TransformWrapperProps {
  class?: string;
  autoHeight?: boolean;
  rotation?: Rotation;
  children: JSX.Element;
  transformScale: number;
  setTransformScale: Setter<number>;
}

const PRE_ROTATION_TRANSFORM = `translate(-50%, -50%)`;
const POST_ROTATION_TRANSFORM = {
  0: "translate(50%, 50%)",
  90: "translate(50%, -50%)",
  180: "translate(-50%, -50%)",
  270: "translate(-50%, 50%)",
};

export function TransformWrapper(props: TransformWrapperProps) {
  let transformWrapperEl!: HTMLDivElement;

  const onContainerResize = () => {
    const containerEl = transformWrapperEl.parentElement!;
    const hasOppChessboard = !! containerEl.querySelector("[data-gi-tcg-opp-chessboard]");
    const containerWidth = containerEl.clientWidth;
    let containerHeight = containerEl.clientHeight;
    const autoHeight = untrack(() => props.autoHeight) ?? true;
    const rotate = untrack(() => props.rotation) ?? 0;
    const UNIT = unitInPx();
    let height: number;
    let width: number;
    let scale: number;
    let offsetX = 0;
    const DEFAULT_HEIGHT_WIDTH_RATIO = MINIMUM_HEIGHT / MINIMUM_WIDTH;
    if (rotate % 180 === 0) {
      if (autoHeight) {
        containerHeight = 0.9 * DEFAULT_HEIGHT_WIDTH_RATIO * containerWidth;
        containerEl.style.height = `${containerHeight}px`;
      }
      scale = Math.min(
        containerHeight / (UNIT * MINIMUM_HEIGHT),
        containerWidth / (UNIT * MINIMUM_WIDTH),
      );
      if (hasOppChessboard) {
        scale = scale * 0.8;
        offsetX = -10;
      }
      height = containerHeight / scale;
      width = containerWidth / scale;
    } else {
      if (autoHeight) {
        containerHeight = containerWidth / DEFAULT_HEIGHT_WIDTH_RATIO;
        containerEl.style.height = `${containerHeight}px`;
      }
      scale = Math.min(
        containerHeight / (UNIT * MINIMUM_WIDTH),
        containerWidth / (UNIT * MINIMUM_HEIGHT),
      );
      height = containerWidth / scale;
      width = containerHeight / scale;
    }
    containerEl.style.setProperty("--actual-width", `${containerWidth}px`);
    containerEl.style.setProperty("--actual-height", `${containerHeight}px`);
    transformWrapperEl.style.transform = `${PRE_ROTATION_TRANSFORM} scale(${scale}) translate(${offsetX}%, 0) rotate(${rotate}deg) ${POST_ROTATION_TRANSFORM[rotate]}`;
    transformWrapperEl.style.height = `${height}px`;
    transformWrapperEl.style.width = `${width}px`;
    props.setTransformScale(scale);
  };

  const onContainerResizeDebouncer = funnel(onContainerResize, {
    minQuietPeriodMs: 200,
  });
  const containerResizeObserver = new ResizeObserver(
    onContainerResizeDebouncer.call,
  );
  onMount(() => {
    onContainerResize();
    containerResizeObserver.observe(transformWrapperEl.parentElement!);
  });
  onCleanup(() => {
    containerResizeObserver.disconnect();
  });

  const inner = children(() => props.children);
  return (
    <div class={`${props.class ?? ""}`} ref={transformWrapperEl}>
      {inner()}
    </div>
  );
}
