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

import { createEffect, createMemo, Match, Show, Switch } from "solid-js";
import { Image } from "./Image";
import { DiceCost } from "./DiceCost";
import { cssPropertyOfTransform, type CardAnimatingUiState } from "../ui_state";
import type { CardInfo } from "./Chessboard";
import { SelectingIcon } from "./SelectingIcon";
import type { PbDiceRequirement } from "@gi-tcg/typings";
import { WithDelicateUi } from "../primitives/delicate_ui";

export interface CardProps extends CardInfo {
  selected: boolean;
  toBeSwitched: boolean;
  realCost?: PbDiceRequirement[];
  onClick?: (e: MouseEvent, currentTarget: HTMLElement) => void;
  onPointerEnter?: (e: PointerEvent, currentTarget: HTMLElement) => void;
  onPointerLeave?: (e: PointerEvent, currentTarget: HTMLElement) => void;
  onPointerUp?: (e: PointerEvent, currentTarget: HTMLElement) => void;
  onPointerMove?: (e: PointerEvent, currentTarget: HTMLElement) => void;
  onPointerDown?: (e: PointerEvent, currentTarget: HTMLElement) => void;
}

const transformKeyframes = (uiState: CardAnimatingUiState): Keyframe[] => {
  const { start, middle, end } = uiState;
  const fallbackStyle = cssPropertyOfTransform(middle ?? end ?? start!);
  const startKeyframe: Keyframe = {
    offset: 0,
    ...(start ? cssPropertyOfTransform(start) : fallbackStyle),
  };
  const middleKeyframes: Keyframe[] = middle
    ? [
        {
          offset: 0.4,
          ...cssPropertyOfTransform(middle),
        },
        {
          offset: 0.6,
          ...cssPropertyOfTransform(middle),
        },
      ]
    : [];
  const endKeyframe: Keyframe[] = end
    ? [
        {
          offset: 1,
          ...cssPropertyOfTransform(end),
        },
      ]
    : [
        {
          offset: 0.99,
          ...fallbackStyle,
          visibility: "visible",
        },
        {
          offset: 1,
          ...fallbackStyle,
          visibility: "hidden",
        },
      ];
  return [startKeyframe, ...middleKeyframes, ...endKeyframe];
};

/**
 * The opacity keyframes must be applied to a non-3d rendering context.
 * In our case, apply to the card's children.
 */
const opacityKeyframes = (uiState: CardAnimatingUiState): Keyframe[] => {
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
  const realCost = createMemo(() => props.realCost);

  const style = createMemo(() => {
    if (props.uiState.type === "cardStatic") {
      return cssPropertyOfTransform(props.uiState.transform);
    } else {
      const { end } = props.uiState;
      return end ? cssPropertyOfTransform(end) : {};
    }
  });

  // onMount(() => {
  //   console.log(el);
  // });

  // createEffect(() => {
  //   if (props.data.id === -500039) {
  //     console.log(el);
  //   }
  // });

  createEffect(() => {
    const uiState = props.uiState;
    if (uiState.type === "cardAnimation") {
      const { delayMs, durationMs, onAnimationFinish } = uiState;
      const transformKf = transformKeyframes(uiState);
      const opacityKf = opacityKeyframes(uiState);
      const opt: KeyframeAnimationOptions = {
        delay: delayMs,
        duration: durationMs,
        fill: "both",
        // easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      };
      const applyAndWait = (el: Element, kf: Keyframe[]) => {
        const animation = el.animate(kf, opt);
        return animation.finished.then(() => {
          try {
            animation.commitStyles();
          } catch {}
          animation.cancel();
        });
      };
      Promise.all([
        applyAndWait(el, transformKf),
        ...[...el.children].map((e) => applyAndWait(e, opacityKf)),
      ]).then(() => {
        onAnimationFinish?.();
      });
    }
  });

  return (
    <div
      ref={el}
      class="absolute top-0 left-0 h-36 w-21 rounded-xl preserve-3d touch-none transform-origin-tl card data-[dragging-end]:pointer-events-none"
      style={style()}
      bool:data-transition-transform={props.enableTransition}
      bool:data-shadow={props.enableShadow}
      bool:data-playable={props.playStep?.playable}
      bool:data-dragging-end={
        props.uiState.type === "cardStatic" &&
        props.uiState.draggingEndAnimation
      }
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
      <div class="absolute h-full w-full backface-hidden">
        <WithDelicateUi
          assetId="UI_TeyvatCard_CardFrame_Common"
          fallback={
            <Image
              class="h-full w-full rounded-xl b-white b-3"
              imageId={data().definitionId}
            />
          }
        >
          {(frame) => (
            <>
              <Image
                class="absolute inset-0 h-full w-full p-1px"
                imageId={data().definitionId}
              />
              <div class="absolute inset-0 h-full w-full children-h-full children-w-full">
                {frame}
              </div>
            </>
          )}
        </WithDelicateUi>
      </div>
      <Switch>
        <Match when={props.toBeSwitched}>
          <WithDelicateUi
            assetId="UI_TeyvatCard_Select_ExchangeCard"
            fallback={
              <div class="absolute h-full w-full backface-hidden flex items-center justify-center text-8xl text-red-500 line-height-none">
                &#8856;
              </div>
            }
          >
            {(image) => (
              <div class="absolute h-full w-full backface-hidden flex items-center justify-center children-w-18">
                {image}
              </div>
            )}
          </WithDelicateUi>
        </Match>
        <Match when={props.selected}>
          <div class="absolute h-full w-full backface-hidden flex items-center justify-center">
            <SelectingIcon />
          </div>
        </Match>
      </Switch>
      <DiceCost
        class="absolute left-0 top-1 translate-x--50% backface-hidden flex flex-col gap-1"
        cost={data().definitionCost}
        size={36}
        realCost={realCost()}
      />
      <div class="absolute h-full w-full rounded-xl backface-hidden rotate-y-180 translate-z--0.1px bg-gray-600 b-gray-700 b-4 rounded" />
    </div>
  );
}
