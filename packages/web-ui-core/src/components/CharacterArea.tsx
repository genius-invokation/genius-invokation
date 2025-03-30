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

import { PbEquipmentType } from "@gi-tcg/typings";
import { Key } from "@solid-primitives/keyed";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Index,
  Match,
  Show,
  Switch,
  untrack,
} from "solid-js";
import { Image } from "./Image";
import type { CharacterInfo, DamageInfo } from "./Chessboard";
import { Damage } from "./Damage";
import { cssPropertyOfTransform } from "../ui_state";
import { StatusGroup } from "./StatusGroup";
import { SelectingIcon } from "./SelectingIcon";
import { ActionStepEntityUi } from "../action";
import { VariableDiff } from "./VariableDiff";
import { WithDelicateUi } from "../primitives/delicate_ui";

export interface DamageSourceAnimation {
  type: "damageSource";
  targetX: number;
  targetY: number;
}

export const DAMAGE_SOURCE_ANIMATION_DURATION = 800;
export const DAMAGE_TARGET_ANIMATION_DELAY = 500;
export const DAMAGE_TARGET_ANIMATION_DURATION = 200;

export interface DamageTargetAnimation {
  type: "damageTarget";
  sourceX: number;
  sourceY: number;
}

export const CHARACTER_ANIMATION_NONE = { type: "none" as const };

export type CharacterAnimation =
  | DamageSourceAnimation
  | DamageTargetAnimation
  | typeof CHARACTER_ANIMATION_NONE;

export interface CharacterAreaProps extends CharacterInfo {
  selecting: boolean;
  onClick?: (e: MouseEvent, currentTarget: HTMLElement) => void;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function CharacterArea(props: CharacterAreaProps) {
  let el!: HTMLDivElement;
  const data = createMemo(() => props.data);

  const [getDamage, setDamage] = createSignal<DamageInfo | null>(null);
  const [showDamage, setShowDamage] = createSignal(false);

  const renderDamages = async (delayMs: number, damages: DamageInfo[]) => {
    await sleep(delayMs);
    for (const damage of damages) {
      setDamage(damage);
      setShowDamage(true);
      await sleep(500);
      setShowDamage(false);
      await sleep(100);
    }
  };

  // createEffect(() => {
  //   if (props.id === -500035) {
  //     console.log(props.uiState.damages);
  //   }
  // });

  createEffect(() => {
    const {
      damages,
      animation: propAnimation,
      transform,
      onAnimationFinish,
    } = props.uiState;

    let damageDelay = 0;
    const animations: Promise<void>[] = [];

    if (propAnimation.type === "damageTarget") {
      damageDelay = DAMAGE_TARGET_ANIMATION_DELAY;
      const animation = el.animate([], {
        delay: 0,
        duration: DAMAGE_SOURCE_ANIMATION_DURATION,
      });
      animations.push(animation.finished.then(() => animation.cancel()));
    } else if (propAnimation.type === "damageSource") {
      const { targetX, targetY } = propAnimation;
      const animation = el.animate(
        [
          {
            offset: 0.5,
            transform: `translate3d(${targetX / 4}rem, ${targetY / 4}rem, ${
              1 / 4
            }rem)`,
          },
        ],
        {
          delay: 0,
          duration: DAMAGE_SOURCE_ANIMATION_DURATION,
        },
      );
      animations.push(animation.finished.then(() => animation.cancel()));
    }
    const dmgRender = renderDamages(damageDelay, damages);
    animations.push(dmgRender);

    Promise.all(animations).then(() => {
      onAnimationFinish?.();
    });
  });

  const aura = createMemo((): [number, number] => {
    const aura = props.preview?.newAura ?? data().aura;
    return [aura & 0xf, (aura >> 4) & 0xf];
  });
  const energy = createMemo(
    () =>
      /* previewData().find(
      (p) =>
        p.modifyEntityVar?.entityId === props.data.id &&
        p.modifyEntityVar?.variableName === "energy",
    )?.modifyEntityVar?.variableValue ?? */ data().energy,
  );
  const defeated = createMemo(
    () =>
      /* previewData().some(
      (p) =>
        p.modifyEntityVar?.entityId === props.data.id &&
        p.modifyEntityVar?.variableName === "alive" &&
        p.modifyEntityVar?.variableValue === 0,
    ) || */ data().defeated,
  );

  // const previewHealthDiff = () => {
  //   const previewHealth = previewData().find(
  //     (p) =>
  //       p.modifyEntityVar?.entityId === props.data.id &&
  //       p.modifyEntityVar?.variableName === "health",
  //   )?.modifyEntityVar?.variableValue;
  //   if (typeof previewHealth === "undefined") {
  //     return null;
  //   }
  //   if (previewHealth < props.data.health) {
  //     return `- ${props.data.health - previewHealth}`;
  //   } else {
  //     return `+ ${previewHealth - props.data.health}`;
  //   }
  // };

  const statuses = createMemo(() =>
    props.entities.filter((et) => typeof et.data.equipment === "undefined"),
  );
  const weapon = createMemo(() =>
    props.entities.find((et) => et.data.equipment === PbEquipmentType.WEAPON),
  );
  const artifact = createMemo(() =>
    props.entities.find((et) => et.data.equipment === PbEquipmentType.ARTIFACT),
  );
  const technique = createMemo(() =>
    props.entities.find(
      (et) => et.data.equipment === PbEquipmentType.TECHNIQUE,
    ),
  );
  const otherEquipments = createMemo(() =>
    props.entities.filter((et) => et.data.equipment === PbEquipmentType.OTHER),
  );
  return (
    <div
      class="absolute flex flex-col items-center transition-transform"
      style={cssPropertyOfTransform(props.uiState.transform)}
      ref={el}
      onClick={(e) => {
        e.stopPropagation();
        props.onClick?.(e, e.currentTarget);
      }}
    >
      <div
        class="h-5 flex flex-row items-end gap-2 data-[preview]:animate-pulse"
        bool:data-preview={props.preview?.newAura}
      >
        <For each={aura()}>
          {(aura) => (
            <Show when={aura}>
              <Image imageId={aura} class="h-5 w-5" />
            </Show>
          )}
        </For>
      </div>
      <div class="h-36 w-21 relative">
        <Show when={!defeated()}>
          <Health value={data().health} />
          <div class="absolute z-1 right-1 top-3 translate-x-50% flex flex-col gap-1 items-center">
            <EnergyBar
              current={energy()}
              preview={props.preview?.newEnergy ?? null}
              total={data().maxEnergy}
            />
            <Show when={technique()} keyed>
              {(et) => (
                <div
                  class="w-5 h-5 text-4 line-height-none rounded-3 text-center bg-yellow-50 data-[highlight]:bg-yellow-200 border-solid border-1 border-yellow-800"
                  bool:data-highlight={et.data.hasUsagePerRound}
                  bool:data-entering={et.animation === "entering"}
                  bool:data-disposing={et.animation === "disposing"}
                  bool:data-triggered={et.triggered}
                >
                  &#129668;
                </div>
              )}
            </Show>
          </div>
          <Show when={props.preview && props.preview.newHealth !== null}>
            <VariableDiff
              class="absolute z-5 top-3 left-50% translate-x--50%"
              oldValue={data().health}
              newValue={props.preview!.newHealth!}
              defeated={props.preview?.defeated}
            />
          </Show>
          <div class="absolute z-3 hover:z-10 left--1 top-8 flex flex-col items-center justify-center gap-2">
            <Show when={weapon()} keyed>
              {(et) => (
                <div
                  class="w-5 h-5 text-4 line-height-none rounded-3 text-center bg-yellow-50 data-[highlight]:bg-yellow-200 border-solid border-1 border-yellow-800"
                  bool:data-highlight={et.data.hasUsagePerRound}
                  bool:data-entering={et.animation === "entering"}
                  bool:data-disposing={et.animation === "disposing"}
                  bool:data-triggered={et.triggered}
                >
                  &#x1F5E1;
                </div>
              )}
            </Show>
            <Show when={artifact()} keyed>
              {(et) => (
                <div
                  class="w-5 h-5 text-4 line-height-none rounded-3 text-center bg-yellow-50 data-[highlight]:bg-yellow-200 border-solid border-1 border-yellow-800"
                  bool:data-highlight={et.data.hasUsagePerRound}
                  bool:data-entering={et.animation === "entering"}
                  bool:data-disposing={et.animation === "disposing"}
                  bool:data-triggered={et.triggered}
                >
                  &#x1F451;
                </div>
              )}
            </Show>
            <Key each={otherEquipments()} by="id">
              {(et) => (
                <div
                  class="w-5 h-5 text-4 line-height-none rounded-3 text-center bg-yellow-50 data-[highlight]:bg-yellow-200 border-solid border-1 border-yellow-800"
                  bool:data-highlight={et().data.hasUsagePerRound}
                  bool:data-entering={et().animation === "entering"}
                  bool:data-disposing={et().animation === "disposing"}
                  bool:data-triggered={et().triggered}
                >
                  &#x2728;
                </div>
              )}
            </Key>
          </div>
        </Show>
        <div
          class="h-full w-full rounded-xl data-[clickable]:cursor-pointer data-[clickable]:shadow-[0_0_5px_5px] shadow-yellow-200 transition-shadow data-[defeated]:brightness-50"
          bool:data-triggered={props.triggered}
          bool:data-clickable={
            props.clickStep && props.clickStep.ui >= ActionStepEntityUi.Outlined
          }
          bool:data-defeated={defeated()}
        >
          <WithDelicateUi
            assetId="UI_TeyvatCard_CardFrame_Common"
            fallback={
              <Image
                imageId={data().definitionId}
                class="h-full rounded-xl b-white b-3"
              />
            }
          >
            {(frame) => (
              <>
                <Image
                  imageId={data().definitionId}
                  class="absolute inset-0 h-full w-full p-1px"
                />
                <div class="absolute inset-0 h-full w-full children-h-full children-w-full">
                  {frame}
                </div>
              </>
            )}
          </WithDelicateUi>
        </div>
        <StatusGroup
          class="absolute z-3 left-0.5 bottom-0 h-5.5 w-20"
          statuses={statuses()}
        />
        <Show when={defeated()}>
          <div class="absolute z-5 top-[50%] left-0 w-full text-center text-5xl font-bold translate-y-[-50%] font-[var(--font-emoji)]">
            &#9760;
          </div>
        </Show>
        {/* <Show when={damaged()}>
          {(damaged) => (
            <div
              class="absolute z-5 top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] rounded-999 w-20 h-20 bg-white b-2 b-dashed text-5xl flex items-center justify-center"
              style={{
                "border-color": `var(--c-${DICE_COLOR[damaged().type]})`,
                color: `var(--c-${DICE_COLOR[damaged().type]})`,
              }}
            >
              {damaged().type === DamageType.Heal ? "+" : "-"}
              {damaged().value}
            </div>
          )}
        </Show> */}
        <Switch>
          <Match when={props.clickStep?.ui === ActionStepEntityUi.Selected}>
            <div class="absolute inset-0 backface-hidden flex items-center justify-center text-5xl">
              <span class="cursor-pointer">&#9989;</span>
            </div>
          </Match>
          <Match when={props.selecting}>
            <div class="absolute inset-0 backface-hidden flex items-center justify-center">
              <SelectingIcon />
            </div>
          </Match>
        </Switch>
        <Show when={getDamage()}>
          {(dmg) => <Damage info={dmg()} shown={showDamage()} />}
        </Show>
      </div>
      <Show when={props.active}>
        <StatusGroup class="h-6 w-20" statuses={props.combatStatus} />
      </Show>
    </div>
  );
}

interface EnergyBarProps {
  current: number;
  preview: number | null;
  total: number;
}

function EnergyBar(props: EnergyBarProps) {
  return (
    <>
      <For each={Array.from({ length: props.total }, (_, i) => i)}>
        {(i) => (
          <WithDelicateUi
            assetId={
              i < props.current
                ? "UI_TeyvatCard_LifeBg2"
                : "UI_TeyvatCard_LifeBg3"
            }
            fallback={
              <svg // 能量点
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
              >
                <path
                  d="M538.112 38.4c-15.36-44.544-39.936-44.544-55.296 0l-84.992 250.88c-14.848 44.544-64 93.184-108.032 108.544L40.448 482.816c-44.544 15.36-44.544 39.936 0 55.296l247.808 86.016c44.544 15.36 93.184 64.512 108.544 108.544l86.528 251.392c15.36 44.544 39.936 44.544 55.296 0l84.48-249.856c14.848-44.544 63.488-93.184 108.032-108.544l252.928-86.528c44.544-15.36 44.544-39.936 0-54.784l-248.832-83.968c-44.544-14.848-93.184-63.488-108.544-108.032-1.536-0.512-88.576-253.952-88.576-253.952z"
                  fill={i < props.current ? "yellow" : "#e5e7eb"}
                  stroke={i < props.current ? "#854d0e" : "gray"}
                  stroke-width="32"
                />
              </svg>
            }
          >
            {(img) => <div class="h-4 children-h-full">{img}</div>}
          </WithDelicateUi>
        )}
      </For>
    </>
  );
}

function Health(props: { value: number }) {
  return (
    <WithDelicateUi
      assetId="UI_TeyvatCard_LifeBg_Common"
      fallback={
        <div class="absolute z-1 left--2 top--2.5 flex items-center justify-center">
          <svg // 水滴
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="40"
          >
            <path
              d="M926.2 609.8c0 227.2-187 414.2-414.2 414.2S97.8 837 97.8 609.8c0-226.2 173.3-395 295.7-552C423.5 19.3 467.8 0 512 0s88.5 19.3 118.5 57.8c122.4 157 295.7 325.8 295.7 552z"
              fill="#ffffff" // "#ddc695"
              stroke="black"
              stroke-width="30"
            />
          </svg>
          <div class="absolute line-height-none">{props.value}</div>
        </div>
      }
    >
      {(img) => (
        <div class="absolute z-1 left--3 top--4 h-12 children-h-full">
          {img}
          <div class="absolute inset-0 h-full w-full pt-1 flex items-center justify-center line-height-none text-yellow-900 font-bold">
            {props.value}
          </div>
        </div>
      )}
    </WithDelicateUi>
  );
}
