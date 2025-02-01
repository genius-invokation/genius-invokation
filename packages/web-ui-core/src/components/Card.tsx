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

import { getData } from "@gi-tcg/assets-manager";
import type { PbCardState, DiceType } from "@gi-tcg/typings";
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  onMount,
  Show,
  untrack,
} from "solid-js";
import { Image } from "./Image";
import { DiceCost } from "./DiceCost";

export interface CardTransform {
  x: number;
  y: number;
  z: number;
  // zIndex: number;
  ry: number;
  rz: number;
}

export type StaticCardUiState = {
  type: "static";
  transform: CardTransform;
};
export type AnimatedCardUiState = {
  type: "animation";
  /**
   * 动画开始时牌的位置；应当从上一个对局状态中查找到
   */
  start: CardTransform | null;
  /**
   * 牌面向上时展示；牌背向上时设置为 `null`
   */
  middle: CardTransform | null;
  /**
   * 动画结束时牌的位置；应当从当前对局状态中查找到
   */
  end: CardTransform | null;
  /** 动画持续毫秒数 */
  duration: number;
  /** 动画延迟播放毫秒数 */
  delay: number;
  onFinish?: () => void;
};

export type CardUiState = StaticCardUiState | AnimatedCardUiState;

const cssProperty = (x: CardTransform): Record<string, string> => ({
  // "z-index": `${x.zIndex}`,
  transform: `translate3d(${x.x / 4}rem, ${x.y / 4}rem, ${x.z / 4}rem) 
    rotateY(${x.ry}deg) 
    rotateZ(${x.rz}deg)`,
});

export interface CardProps {
  data: PbCardState;
  uiState: CardUiState;
  enableShadow: boolean;
  enableTransition: boolean;
  onClick?: (e: MouseEvent, currentTarget: HTMLElement) => void;
  onPointerEnter?: (e: PointerEvent, currentTarget: HTMLElement) => void;
  onPointerLeave?: (e: PointerEvent, currentTarget: HTMLElement) => void;
  onPointerUp?: (e: PointerEvent, currentTarget: HTMLElement) => void;
  onPointerMove?: (e: PointerEvent, currentTarget: HTMLElement) => void;
  onPointerDown?: (e: PointerEvent, currentTarget: HTMLElement) => void;
}

export function Card(props: CardProps) {
  // const [data] = createResource(
  //   () => props.data.definitionId,
  //   (id) => getData(id),
  // );
  let el!: HTMLDivElement;
  const data = createMemo(() => props.data);
  const [runningAnimation, setRunningAnimation] = createSignal(false);

  const style = createMemo(() => {
    if (props.uiState.type === "static") {
      return cssProperty(props.uiState.transform);
    } else {
      const { end } = props.uiState;
      return end ? cssProperty(end) : {};
    }
  });

  createEffect(() => {
    if (props.data.definitionId === 112131) {
      console.log(props.uiState);
    }
  });

  createEffect(() => {
    const uiState = props.uiState;
    if (uiState.type === "animation" && !untrack(runningAnimation)) {
      const { start, middle, end, delay, duration, onFinish } = uiState;
      const fallbackStyle = cssProperty(middle ?? end ?? start!);
      const startKeyframe: Keyframe = {
        offset: 0,
        ...(start ? cssProperty(start) : fallbackStyle),
        "--gi-tcg-opacity": start ? 1 : 0,
      };
      const middleKeyframes: Keyframe[] = middle
        ? [
            {
              offset: 0.4,
              ...cssProperty(middle),
              "--gi-tcg-opacity": 1,
            },
            {
              offset: 0.6,
              ...cssProperty(middle),
              "--gi-tcg-opacity": 1,
            },
          ]
        : [];
      const endKeyframe: Keyframe = {
        offset: 1,
        ...(end ? cssProperty(end) : fallbackStyle),
        "--gi-tcg-opacity": end ? 1 : 0,
      };
      const animation = el.animate(
        [startKeyframe, ...middleKeyframes, endKeyframe],
        {
          delay,
          duration,
          fill: "both",
        },
      );
      // console.log([startKeyframe, ...middleKeyframes, endKeyframe]);
      setRunningAnimation(true);
      animation.finished.then(() => {
        animation.commitStyles();
        animation.cancel();
        setRunningAnimation(false);
        onFinish?.();
      });
    }
  });

  return (
    <div
      ref={el}
      class="absolute top-0 left-0 h-36 w-21 rounded-xl preserve-3d transition-ease-in-out touch-none opacity-[var(--gi-tcg-opacity)]"
      style={style()}
      classList={{
        "transition-transform": props.enableTransition,
        "shadow-lg": props.enableShadow,
      }}
      onClick={(e) => {
        e.stopPropagation();
        props.onClick?.(e, e.currentTarget);
      }}
      onPointerEnter={(e) => {
        e.stopPropagation();
        props.onPointerEnter?.(e, e.currentTarget);
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        props.onPointerLeave?.(e, e.currentTarget);
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        props.onPointerUp?.(e, e.currentTarget);
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        props.onPointerMove?.(e, e.currentTarget);
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        props.onPointerDown?.(e, e.currentTarget);
      }}
    >
      <Show
        when={props.data.definitionId}
        // 令不知道什么牌的牌面和牌背显示一样的东西。从而避免一些因为奇怪 CSS 渲染问题导致的不和谐结果
        fallback={
          <div class="absolute h-full w-full rounded-xl backface-hidden bg-gray-600 b-gray-700 b-solid b-4 rounded" />
        }
      >
        <Image
          imageId={props.data.definitionId}
          class="absolute h-full w-full rounded-xl backface-hidden b-white b-solid b-3"
          title={`id = ${props.data.id}`}
        />
      </Show>
      <DiceCost
        class="absolute left-0 top-0 translate-x--50% backface-hidden flex flex-col "
        cost={data().definitionCost}
        // realCost={allCosts[props.data.id]}
      />
      <div class="absolute h-full w-full rounded-xl backface-hidden rotate-y-180 translate-z--0.1px bg-gray-600 b-gray-700 b-solid b-4 rounded" />
    </div>
  );
}
