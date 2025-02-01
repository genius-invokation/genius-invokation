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

const transformKeyframes = (uiState: AnimatedCardUiState): Keyframe[] => {
  const { start, middle, end } = uiState;
  const fallbackStyle = cssProperty(middle ?? end ?? start!);
  const startKeyframe: Keyframe = {
    offset: 0,
    ...(start ? cssProperty(start) : fallbackStyle),
  };
  const middleKeyframes: Keyframe[] = middle
    ? [
        {
          offset: 0.4,
          ...cssProperty(middle),
        },
        {
          offset: 0.6,
          ...cssProperty(middle),
        },
      ]
    : [];
  const endKeyframe: Keyframe = {
    offset: 1,
    ...(end ? cssProperty(end) : fallbackStyle),
  };
  return [startKeyframe, ...middleKeyframes, endKeyframe];
};

/**
 * The opacity keyframes must be applied to a non-3d rendering context.
 * In our case, apply to the card's children.
 */
const opacityKeyframes = (uiState: AnimatedCardUiState): Keyframe[] => {
  const { start, middle, end } = uiState;
  const startKeyframe: Keyframe = {
    offset: 0,
    opacity: start ? 1 : 0,
  };
  const middleKeyframes: Keyframe[] = middle
    ? [
        {
          offset: 0.4,
          opacity: 1,
        },
        {
          offset: 0.6,
          opacity: 1,
        },
      ]
    : [];
  const endKeyframe: Keyframe = {
    offset: 1,
    opacity: end ? 1 : 0,
  };
  return [startKeyframe, ...middleKeyframes, endKeyframe];
};

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
      const { delay, duration, onFinish } = uiState;
      const transformKf = transformKeyframes(uiState);
      const opacityKf = opacityKeyframes(uiState);
      const opt: KeyframeAnimationOptions = {
        delay,
        duration,
        fill: "both",
        // easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      };
      const applyAndWait = (el: Element, kf: Keyframe[]) => {
        const animation = el.animate(kf, opt);
        return animation.finished.then(() => {
          animation.commitStyles();
          animation.cancel();
        });
      };
      Promise.all([
        applyAndWait(el, transformKf),
        ...[...el.children].map((e) => applyAndWait(e, opacityKf)),
      ]).then(() => {
        setRunningAnimation(false);
        onFinish?.();
      });
      setRunningAnimation(true);
    }
  });

  return (
    <div
      ref={el}
      class="absolute top-0 left-0 h-36 w-21 rounded-xl preserve-3d transition-ease-in-out touch-none"
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
      <div class="absolute h-full w-full backface-hidden opacity-[var(--gi-tcg-opacity)]">
        <Image
          class="h-full w-full rounded-xl b-white b-solid b-3 "
          imageId={props.data.definitionId}
        />
      </div>
      <DiceCost
        class="absolute left-0 top-0 translate-x--50% backface-hidden flex flex-col opacity-[var(--gi-tcg-opacity)]"
        cost={data().definitionCost}
        // realCost={allCosts[props.data.id]}
      />
      <div class="absolute h-full w-full rounded-xl backface-hidden rotate-y-180 translate-z--0.1px bg-gray-600 b-gray-700 b-solid b-4 rounded opacity-[var(--gi-tcg-opacity)]" />
    </div>
  );
}
