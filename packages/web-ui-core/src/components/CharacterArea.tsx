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
  CHARACTER_TAG_BARRIER,
  CHARACTER_TAG_DISABLE_SKILL,
  CHARACTER_TAG_SHIELD,
  PbEquipmentType,
} from "@gi-tcg/typings";
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
        class="h-5 flex flex-row items-end gap-2 data-[preview]:animate-pulse z-10"
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
      <div class="h-36 w-21 relative z-9">
        <Show when={!defeated()}>
          <Health value={data().health} />
          <div class="absolute z-1 right-0.4 top-4 translate-x-50% flex flex-col gap-0 items-center">
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
              class="absolute scale-80% z-5 top-3 left-5 -translate-y-50%"
              oldValue={data().health}
              newValue={props.preview!.newHealth!}
              direction={props.preview!.newHealthDirection}
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
            <DefeatedIcon />
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
            <div class="absolute inset-0 backface-hidden flex items-center justify-center">
              <div class="cursor-pointer h-20 w-20">
                <SelectingConfirmIcon/>
              </div>
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
        <CharacterTagMasks tags={data().tags} />
      </div>
      <Show when={props.active}>
        <StatusGroup class="h-6 w-20 z-10" statuses={props.combatStatus} />
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
          <div class="absolute inset-0 h-full w-full pt-1.5 flex items-center justify-center line-height-none text-yellow-900 font-bold text-stroke-black text-stroke-opacity-70 text-stroke-2">
            {props.value}
          </div>
          <div class="absolute inset-0 h-full w-full pt-1.5 flex items-center justify-center line-height-none text-white font-bold">
            {props.value}
          </div>
        </div>
      )}
    </WithDelicateUi>
  );
}

interface CharacterTagMasksProps {
  tags: number;
}

function CharacterTagMasks(props: CharacterTagMasksProps) {
  const assets = {
    [CHARACTER_TAG_SHIELD]: "UI_GCG_Shield_01",
    [CHARACTER_TAG_BARRIER]: "UI_GCG_Shield_02",
    [CHARACTER_TAG_DISABLE_SKILL]: "UI_GCG_Frozen",
    // [CHARACTER_TAG_ROCK]: "UI_GCG_Rocken",
    // [CHARACTER_TAG_DIZZY]: "UI_GCG_Dizzy",
  };
  return (
    <WithDelicateUi assetId={Object.values(assets)} fallback={<></>}>
      {(...imgs) => (
        <div class="absolute inset-0 children-absolute children-inset-1/2 children--translate-x-1/2 children--translate-y-1/2 children-h-92% children-w-full children-scale-125%">
          <Index each={Object.keys(assets)}>
            {(flag, i) => (
              <Show when={props.tags & Number(flag())}>{imgs[i]}</Show>
            )}
          </Index>
        </div>
      )}
    </WithDelicateUi>
  );
}

function DefeatedIcon() {
  return (
    <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <g filter="url(#filter0_ddd_24_174)">
        <circle cx="256.5" cy="256.182" r="179.5" fill="#7E4346"/>
        <path d="M254.127 19.6589C255.404 17.447 258.596 17.447 259.873 19.6589C274.5 38.6822 263.5 56.6822 309 84.6822H204.5C251 56.6822 240 38.6822 254.127 19.6589Z" fill="#7E4346"/>
        <path d="M19.6589 258.555C17.447 257.278 17.447 254.086 19.6589 252.809C38.6822 238.182 56.6822 249.182 84.6822 203.682L84.6822 308.182C56.6822 261.682 38.6822 272.682 19.6589 258.555Z" fill="#7E4346"/>
        <path d="M493.023 259.555C495.235 258.278 495.235 255.086 493.023 253.809C474 239.182 456 250.182 428 204.682L428 309.182C456 262.682 474 273.682 493.023 259.555Z" fill="#7E4346"/>
        <path d="M253.627 492.706C254.904 494.917 258.096 494.917 259.373 492.706C274 473.682 263 455.682 308.5 427.682H204C250.5 455.682 239.5 473.682 253.627 492.706Z" fill="#7E4346"/>
        <circle cx="256.5" cy="255.5" r="161.5" fill="#8F474A" stroke="#A35254" stroke-width="14"/>
        <path d="M451.88 255.276C452.822 255.82 452.822 257.18 451.88 257.724C440.125 270.5 432.625 273.5 418 304L418 208C432.125 238.5 440.625 242.5 451.88 255.276Z" fill="#A35254"/>
        <path d="M61.7066 255.276C60.7645 255.82 60.7645 257.18 61.7066 257.724C73.462 270.5 80.962 273.5 95.5869 304L95.5869 208C81.462 238.5 72.962 242.5 61.7066 255.276Z" fill="#A35254"/>
        <path d="M255.276 450.755C255.82 451.698 257.18 451.698 257.724 450.755C270.5 439 273.5 431.5 304 416.875H208C238.5 431 242.5 439.5 255.276 450.755Z" fill="#A35254"/>
        <path d="M255.276 60.7066C255.82 59.7645 257.18 59.7645 257.724 60.7066C270.5 72.462 273.5 79.962 304 94.5869H208C238.5 80.462 242.5 71.962 255.276 60.7066Z" fill="#A35254"/>
        <circle cx="256.5" cy="256.5" r="140" stroke="#A35254" stroke-width="7"/>
        <path d="M429.526 91.3555L429.323 91.3691L392.178 94.8086C390.377 94.9753 389 96.486 389 98.2939V110.606C389 113.889 387.709 117.035 385.413 119.37L385.188 119.594L359.953 143.987C357.622 146.24 354.507 147.5 351.266 147.5H322.249C321.338 147.5 320.462 147.856 319.809 148.491L122.625 340.293C122.062 340.841 121.699 341.562 121.596 342.341L113.759 401.326C113.466 403.529 115.273 405.443 117.489 405.277L178.192 400.735C178.926 400.68 179.621 400.395 180.181 399.926L180.412 399.713L374.981 204.167C375.634 203.511 376 202.623 376 201.698V173.852C376 170.501 377.345 167.291 379.733 164.941L406.009 139.09C408.347 136.79 411.495 135.5 414.775 135.5H426.206C427.958 135.5 429.43 134.208 429.672 132.49L429.691 132.322L433.131 95.1768C433.327 93.0636 431.617 91.281 429.526 91.3555Z" fill="#B55B5C" stroke="#8F474A" stroke-width="9"/>
        <path d="M301.363 117.18L278.606 139.937L383.743 245.074L406.5 222.317L301.363 117.18Z" fill="#8F474A"/>
        <path d="M318.641 123.359C315.836 120.553 311.503 119.286 306.295 120.069C301.088 120.852 295.335 123.675 290.459 128.551C285.583 133.428 282.759 139.181 281.976 144.387C281.193 149.595 282.461 153.928 285.267 156.733C288.072 159.539 292.405 160.807 297.613 160.024C302.819 159.241 308.572 156.417 313.449 151.541C318.325 146.665 321.148 140.912 321.931 135.705C322.714 130.497 321.447 126.164 318.641 123.359Z" fill="#B55B5C" stroke="#8F474A" stroke-width="9"/>
        <path d="M400.641 205.359C397.836 202.553 393.503 201.286 388.295 202.069C383.088 202.852 377.335 205.675 372.459 210.551C367.583 215.428 364.759 221.181 363.976 226.387C363.193 231.595 364.461 235.928 367.267 238.733C370.072 241.539 374.405 242.807 379.613 242.024C384.819 241.241 390.572 238.417 395.449 233.541C400.325 228.665 403.148 222.912 403.931 217.705C404.714 212.497 403.447 208.164 400.641 205.359Z" fill="#B55B5C" stroke="#8F474A" stroke-width="9"/>
        <path d="M307.962 134.696L296.249 146.408L378.784 228.943L390.497 217.23L307.962 134.696Z" fill="#B55B5C"/>
        <path d="M84.9736 90.8555L85.1768 90.8691L122.322 94.3086C124.123 94.4753 125.5 95.986 125.5 97.7939V110.106C125.5 113.389 126.791 116.535 129.087 118.87L129.312 119.094L154.547 143.487C156.878 145.74 159.993 147 163.234 147H192.251C193.162 147 194.038 147.356 194.691 147.991L391.875 339.793C392.438 340.341 392.801 341.062 392.904 341.841L400.741 400.826C401.034 403.029 399.227 404.943 397.011 404.777L336.308 400.235C335.574 400.18 334.879 399.895 334.319 399.426L334.088 399.213L139.519 203.667C138.866 203.011 138.5 202.123 138.5 201.198V173.352C138.5 170.001 137.155 166.791 134.767 164.441L108.491 138.59C106.153 136.29 103.005 135 99.7246 135H88.2939C86.5425 135 85.07 133.708 84.8281 131.99L84.8086 131.822L81.3691 94.6768C81.1735 92.5636 82.8834 90.781 84.9736 90.8555Z" fill="#B55B5C" stroke="#8F474A" stroke-width="9"/>
        <path d="M213.137 116.68L235.894 139.437L130.757 244.574L108 221.817L213.137 116.68Z" fill="#8F474A"/>
        <path d="M195.859 122.859C198.664 120.053 202.997 118.786 208.205 119.569C213.412 120.352 219.165 123.175 224.041 128.051C228.917 132.928 231.741 138.681 232.524 143.887C233.307 149.095 232.039 153.428 229.233 156.233C226.428 159.039 222.095 160.307 216.887 159.524C211.681 158.741 205.928 155.917 201.051 151.041C196.175 146.165 193.352 140.412 192.569 135.205C191.786 129.997 193.053 125.664 195.859 122.859Z" fill="#B55B5C" stroke="#8F474A" stroke-width="9"/>
        <path d="M113.859 204.859C116.664 202.053 120.997 200.786 126.205 201.569C131.412 202.352 137.165 205.175 142.041 210.051C146.917 214.928 149.741 220.681 150.524 225.887C151.307 231.095 150.039 235.428 147.233 238.233C144.428 241.039 140.095 242.307 134.887 241.524C129.681 240.741 123.928 237.917 119.051 233.041C114.175 228.165 111.352 222.412 110.569 217.205C109.786 211.997 111.053 207.664 113.859 204.859Z" fill="#B55B5C" stroke="#8F474A" stroke-width="9"/>
        <path d="M206.538 134.196L218.251 145.908L135.716 228.443L124.003 216.73L206.538 134.196Z" fill="#B55B5C"/>
        <circle cx="255" cy="274" r="73" fill="#864643"/>
        <path d="M248.072 147C251.151 141.667 258.849 141.667 261.928 147C292.528 200 328 216.5 328 274H182C182 217.5 217 200.818 248.072 147Z" fill="#864643"/>
        <circle cx="255" cy="273.238" r="65" fill="#F98283"/>
        <path d="M248.831 160.156C255.218 149.094 255 149.471 261.169 160.156C288.415 207.347 320 222.039 320 273.238H190C190 222.93 221.164 208.076 248.831 160.156Z" fill="#F98283"/>
        <circle cx="255.541" cy="272.594" r="56.5406" fill="#A05250"/>
        <path d="M251.5 175C254.675 169.5 255.825 169.5 259 175C268.815 192 312.081 222.635 312.081 272.594H199C199 224.635 241.396 192.5 251.5 175Z" fill="#A05250"/>
        <circle cx="255.216" cy="271.784" r="48.2162" fill="#C56662"/>
        <path d="M253 186C254.975 182.5 255 182.455 257 186C265.37 200.835 303.432 228.187 303.432 271.784H207C207 229.932 244.384 201.271 253 186Z" fill="#C56662"/>
        <rect x="270.922" y="236" width="17.5295" height="62.1154" rx="4" transform="rotate(45 270.922 236)" fill="#A6544E"/>
        <rect width="17.5295" height="62.1154" rx="4" transform="matrix(-0.707107 0.707107 0.707107 0.707107 239.395 236)" fill="#A6544E"/>
      </g>
      <defs>
        <filter id="filter0_ddd_24_174" x="-8" y="-5" width="528" height="528" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset/>
          <feGaussianBlur stdDeviation="0.25"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.18 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_24_174"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="3"/>
          <feGaussianBlur stdDeviation="4"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"/>
          <feBlend mode="normal" in2="effect1_dropShadow_24_174" result="effect2_dropShadow_24_174"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dx="1" dy="3"/>
          <feGaussianBlur stdDeviation="1.5"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"/>
          <feBlend mode="normal" in2="effect2_dropShadow_24_174" result="effect3_dropShadow_24_174"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect3_dropShadow_24_174" result="shape"/>
        </filter>
      </defs>
    </svg>
  );
}

function SelectingConfirmIcon() {
  return (
    <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <g filter="url(#filter0_ddd_29_401)">
        <rect width="512" height="512" fill="url(#pattern0_29_401)"/>
        <path opacity="0.9" d="M255.5 46.8906C370.712 46.8906 464.109 140.288 464.109 255.5C464.109 370.712 370.712 464.109 255.5 464.109C140.288 464.109 46.8906 370.712 46.8906 255.5C46.8906 140.288 140.288 46.8906 255.5 46.8906Z" fill="#F4DCB7" fill-opacity="0.5" stroke="#F4DCB7" stroke-width="11.7803"/>
        <circle opacity="0.8" cx="256" cy="256" r="171" fill="#F1B659" fill-opacity="0.8"/>
        <circle cx="255.5" cy="255.5" r="148.5" stroke="#F5CA7A" stroke-width="12"/>
        <path d="M166.935 166.935L123.363 179.702L179.702 123.363L166.935 166.935Z" fill="#F5CA7A"/>
        <path d="M344.388 344.388L387.96 331.622L331.621 387.96L344.388 344.388Z" fill="#F5CA7A"/>
        <path d="M166.935 345.065L179.702 388.636L123.363 332.298L166.935 345.065Z" fill="#F5CA7A"/>
        <path d="M344.388 167.612L331.621 124.04L387.96 180.378L344.388 167.612Z" fill="#F5CA7A"/>
        <g filter="url(#filter1_ddd_29_401)">
          <path d="M226 282.5C229.721 286.553 221.927 286.199 226 282.5L326 191.5C329.889 187.967 345.707 185.865 349.5 189.5L359 197.5C362.949 201.284 361.004 205.214 357.275 209.214L234.383 341.044C230.226 345.503 223.081 345.237 219.267 340.482L153.63 258.642C150.224 254.396 154.825 243.492 159 240L164 236.5C168.099 233.072 177.844 231.097 181.458 235.033L226 282.5Z" fill="#F0C97E"/>
        </g>
      </g>
      <defs>
        <filter id="filter0_ddd_29_401" x="-32" y="-20" width="576" height="576" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset/>
          <feGaussianBlur stdDeviation="1"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.18 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_29_401"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="12"/>
          <feGaussianBlur stdDeviation="16"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"/>
          <feBlend mode="normal" in2="effect1_dropShadow_29_401" result="effect2_dropShadow_29_401"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dx="4" dy="12"/>
          <feGaussianBlur stdDeviation="6"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"/>
          <feBlend mode="normal" in2="effect2_dropShadow_29_401" result="effect3_dropShadow_29_401"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect3_dropShadow_29_401" result="shape"/>
        </filter>
        <filter id="filter1_ddd_29_401" x="96.4443" y="149.603" width="320.73" height="268.622" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="0"/>
          <feGaussianBlur stdDeviation="28"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.24 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_29_401"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="0"/>
          <feGaussianBlur stdDeviation="9"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0"/>
          <feBlend mode="normal" in2="effect1_dropShadow_29_401" result="effect2_dropShadow_29_401"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="0"/>
          <feGaussianBlur stdDeviation="3"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.096 0"/>
          <feBlend mode="normal" in2="effect2_dropShadow_29_401" result="effect3_dropShadow_29_401"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect3_dropShadow_29_401" result="shape"/>
        </filter>
      </defs>
    </svg>
  );
}