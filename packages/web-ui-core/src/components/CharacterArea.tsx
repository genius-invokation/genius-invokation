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
  DamageType,
  PbEquipmentType,
  Reaction,
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
  type Component,
  type ComponentProps,
} from "solid-js";
import { Image } from "./Image";
import type { CharacterInfo, DamageInfo, ReactionInfo } from "./Chessboard";
import { Damage } from "./Damage";
import { cssPropertyOfTransform } from "../ui_state";
import { StatusGroup } from "./StatusGroup";
import { ActionStepEntityUi } from "../action";
import { VariableDiff } from "./VariableDiff";
import { WithDelicateUi } from "../primitives/delicate_ui";
import { StrokedText } from "./StrokedText";
import DefeatedIcon from "../svg/DefeatedIcon.svg?component-solid";
import HealthIcon from "../svg/HealthIcon.svg?component-solid";
import EnergyIconEmpty from "../svg/EnergyIconEmpty.svg?component-solid";
import EnergyIconActive from "../svg/EnergyIconActive.svg?component-solid";
import EnergyIconActiveGain from "../svg/EnergyIconActiveGain.svg?component-solid";
import EnergyIconEmptyMavuika from "../svg/EnergyIconEmptyMavuika.svg?component-solid";
import EnergyIconActiveMavuika from "../svg/EnergyIconActiveMavuika.svg?component-solid";
import EnergyIconActiveGainMavuika from "../svg/EnergyIconActiveGainMavuika.svg?component-solid";
import EnergyIconExtraMavuika from "../svg/EnergyIconExtraMavuika.svg?component-solid";
import EnergyIconExtraGainMavuika from "../svg/EnergyIconExtraGainMavuika.svg?component-solid";
import SelectingConfirmIcon from "../svg/SelectingConfirmIcon.svg?component-solid";
import SelectingIcon from "../svg/SelectingIcon.svg?component-solid";
import SwitchActiveHistoryIcon from "../svg/SwitchActiveHistoryIcon.svg?component-solid";
import ArtifactIcon from "../svg/ArtifactIcon.svg?component-solid";
import WeaponIcon from "../svg/WeaponIcon.svg?component-solid";
import TalentIcon from "../svg/TalentIcon.svg?component-solid";
import CardFrameNormal from "../svg/CardFrameNormal.svg?component-solid";
import { Dynamic } from "solid-js/web";
import { reactionTextMap } from "./HistoryViewer";

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

    let damageDelay = damages[0]?.isAfterSkillMainDamage
      ? DAMAGE_TARGET_ANIMATION_DELAY
      : 0;
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
  const reaction = createMemo(
    () =>
      props.preview?.reactions.map(
        (r) => {
          const reactionElement = reactionTextMap[r.reactionType].element;
          const applyElement = r.incoming;
          const baseElement = reactionElement.find((e)=> e !== applyElement);
          return [baseElement, applyElement];
        },
      ),
  );
  const energy = createMemo(() => data().energy);
  const defeated = createMemo(() => data().defeated);

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
        class="h-6 w-21 flex relative justify-center overflow-visible data-[preview]:animate-[blink_4s_ease-in-out_infinite] z-10"
        bool:data-preview={props.preview?.newAura || props.preview?.reactions}
        style={{"--blink-opacity": 0.5}}
      >
        <div class="flex flex-row items-center gap-0.2 max-w-full">
          <Switch>
            {/* <Match when={getReaction()}>
              <ReactionAnimation reaction={getReaction() as ReactionInfo}/>
            </Match> */}
            <Match when={reaction() || aura()}>
              <For each={reaction()}>
                {(reaction) => (
                  <div class="h-5.1 flex flex-row items-center bg-black/60 rounded-full shrink-0">
                    <For each={reaction}>
                      {(e) => (
                        <Show when={e}>
                          <Image imageId={e!} class="h-5 w-5" />
                        </Show>
                      )}
                    </For>        
                  </div>
                )}
              </For>
              <For each={aura()}>
                {(aura) => (
                  <Show when={aura}>
                    <Image imageId={aura} class="h-5 w-5" />
                  </Show>
                )}
              </For>            
            </Match>
          </Switch>          
        </div>
      </div>
      <div class="h-36 w-21 relative z-9">
        <Show when={!defeated()}>
          <Health value={data().health} />
          <div class="absolute z-1 right-0.4 top-4 translate-x-50% flex flex-col gap-0 items-center">
            <EnergyBar
              current={energy()}
              preview={props.preview?.newEnergy ?? null}
              total={data().maxEnergy}
              specialEnergyName={data().specialEnergyName}
            />
            <Show when={technique()} keyed>
              {(et) => (
                <div
                  class="relative w-6 h-6 rounded-full"
                  bool:data-entering={et.animation === "entering"}
                  bool:data-disposing={et.animation === "disposing"}
                  bool:data-triggered={et.triggered}
                >
                  <Image
                    class="w-6 h-6"
                    imageId={et.data.definitionId}
                    type={"icon"}
                  />
                  <div
                    class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full data-[usable]:bg-white/30"
                    bool:data-usable={et.data.hasUsagePerRound}
                  />
                </div>
              )}
            </Show>
          </div>
          <Show when={props.preview && props.preview.newHealth !== null}>
            <VariableDiff
              class="absolute z-5 top-0.6 left-6"
              oldValue={data().health}
              newValue={props.preview!.newHealth!}
              direction={props.preview!.newHealthDirection}
              defeated={props.preview?.defeated}
              // revive={props.preview?.revive}
            />
          </Show>
          <div class="absolute z-3 hover:z-10 left-0 -translate-x-2.5 top-8 flex flex-col items-center justify-center">
            <Show when={weapon()} keyed>
              {(et) => (
                <div
                  class="relative w-6.5 h-6.5 rounded-full"
                  bool:data-entering={et.animation === "entering"}
                  bool:data-disposing={et.animation === "disposing"}
                  bool:data-triggered={et.triggered}
                >
                  <WeaponIcon class="w-7 h-7" />
                  <div
                    class="absolute top-0 w-7 h-7 rounded-full equipment-usage"
                    bool:data-usable={et.data.hasUsagePerRound}
                  />
                </div>
              )}
            </Show>
            <Show when={artifact()} keyed>
              {(et) => (
                <div
                  class="relative w-6.5 h-6.5 rounded-full"
                  bool:data-entering={et.animation === "entering"}
                  bool:data-disposing={et.animation === "disposing"}
                  bool:data-triggered={et.triggered}
                >
                  <ArtifactIcon class="w-7 h-7" />
                  <div
                    class="absolute top-0 w-7 h-7 rounded-full equipment-usage"
                    bool:data-usable={et.data.hasUsagePerRound}
                  />
                </div>
              )}
            </Show>
            <Key each={otherEquipments()} by="id">
              {(et) => (
                <div
                  class="relative w-6.5 h-6.5 rounded-full"
                  bool:data-entering={et().animation === "entering"}
                  bool:data-disposing={et().animation === "disposing"}
                  bool:data-triggered={et().triggered}
                >
                  <TalentIcon class="w-7 h-7" />
                  <div
                    class="absolute top-0 w-7 h-7 rounded-full equipment-usage"
                    bool:data-usable={et().data.hasUsagePerRound}
                  />
                </div>
              )}
            </Key>
          </div>
        </Show>
        <div
          class="h-full w-full rounded-1 data-[clickable]:cursor-pointer data-[clickable]:shadow-[#fdba7499_0_0_4px_4px,#fef9c366_0_0_5px_5px,inset_#fdba7499_0_0_1px_1px] transition-shadow data-[defeated]:brightness-50"
          bool:data-triggered={props.triggered}
          bool:data-clickable={
            props.clickStep && props.clickStep.ui >= ActionStepEntityUi.Outlined
          }
          bool:data-defeated={defeated()}
        >
          <Image
            imageId={data().definitionId}
            class="absolute inset-0 h-full w-full p-1px"
          />
          <CardFrameNormal class="absolute inset-0 h-full w-full pointer-events-none" />
        </div>
        <StatusGroup
          class="absolute z-3 left-0.5 bottom-0 h-5.5 w-20"
          statuses={statuses()}
        />
        <Show when={defeated()}>
          <DefeatedIcon class="absolute z-5 top-[50%] left-0 w-full text-center text-5xl font-bold translate-y-[-50%] font-[var(--font-emoji)]" />
        </Show>
        <Show when={props.preview?.active}>
          <div class="z-6 absolute inset-0 backface-hidden flex items-center justify-center">
            <SwitchActiveHistoryIcon class="cursor-pointer h-18 w-18" />            
          </div>
        </Show>        
        <Switch>
          <Match when={props.clickStep?.ui === ActionStepEntityUi.Selected}>
            <div class="z-6 absolute inset-0 backface-hidden flex items-center justify-center">
              <SelectingConfirmIcon class="cursor-pointer h-20 w-20" />
            </div>
          </Match>
          <Match when={props.selecting}>
            <div class="z-6 absolute inset-0 backface-hidden flex items-center justify-center">
              <SelectingIcon class="w-21 h-21" />
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
  specialEnergyName?: string | undefined;
}

function EnergyBar(props: EnergyBarProps) {
  type EnergyState =
    | "empty"
    | "active"
    | "overflow"
    | "activeGain"
    | "overflowGain";
  type EnergyIconKey = `${string}_${EnergyState}`;
  const ENERGY_MAP: Partial<Record<EnergyIconKey, Component>> = {
    energy_empty: EnergyIconEmpty,
    energy_active: EnergyIconActive,
    energy_activeGain: EnergyIconActiveGain,
    energy_overflow: EnergyIconActive,
    energy_overflowGain: EnergyIconActive,
    fightingSpirit_empty: EnergyIconEmptyMavuika,
    fightingSpirit_active: EnergyIconActiveMavuika,
    fightingSpirit_activeGain: EnergyIconActiveGainMavuika,
    fightingSpirit_overflow: EnergyIconExtraMavuika,
    fightingSpirit_overflowGain: EnergyIconExtraGainMavuika,
  };
  const STAGE_1 = {
    0: "empty",
    1: "activeGain",
    2: "active",
  } as const;
  const STAGE_2 = {
    0: "active",
    1: "overflowGain",
    2: "overflow",
  } as const;
  const energyStates = (current: number, preview: number): EnergyState[] => {
    // preview must not less then current
    preview = Math.max(preview, current);
    const total = props.total;
    const length = Math.max(current, preview, total);
    const all = Array.from(
      { length },
      (_, i) => (+(current > i) + +(preview > i)) as 0 | 1 | 2,
    );
    return [
      ...all.slice(total).map((v) => STAGE_2[v]),
      ...all.slice(length - total, total).map((v) => STAGE_1[v]),
    ];
  };
  const energyComponents = createMemo(() => {
    const energyType = props.specialEnergyName ?? "energy";
    const current = props.current;
    const preview = props.preview ?? current;
    return energyStates(current, preview).map(
      (state) => ENERGY_MAP[`${energyType}_${state}`],
    );
  });
  return (
    <>
      <For each={energyComponents()}>
        {(comp) => (
          <Dynamic<Component<ComponentProps<"div">>>
            component={comp}
            class="w-5.8 h-4"
          />
        )}
      </For>
    </>
  );
}

function Health(props: { value: number }) {
  return (
    <div class="absolute z-1 left-1.8 top-3 h-9.8 w-9.8 -translate-x-50% -translate-y-50% children-h-full">
      <HealthIcon class="w-full h-full" />
      <div class="absolute inset-0 h-full w-full pt-1.2 flex items-center justify-center">
        <StrokedText
          text={String(props.value)}
          class="line-height-none text-white font-bold"
          strokeWidth={2}
          strokeColor="#000000B0"
        />
      </div>
    </div>
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
        <div class="absolute inset-0 pointer-events-none children-absolute children-inset-1/2 children--translate-x-1/2 children--translate-y-1/2 children-h-92% children-w-full children-scale-125%">
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
