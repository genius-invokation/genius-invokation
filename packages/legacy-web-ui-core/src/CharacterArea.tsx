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

import {
  DamageType,
  type ModifyEntityVarEM,
  type PbCharacterState,
} from "@gi-tcg/typings";
import { Image } from "./Image";
import { Status } from "./Entity";
import { For, Index, onCleanup, onMount, Show } from "solid-js";
import { useEventContext } from "./Chessboard";
import { DICE_COLOR } from "./Dice";
import { Interactive } from "./Interactive";
import { Key } from "@solid-primitives/keyed";

export interface CharacterAreaProps {
  data: PbCharacterState;
}

interface EnergyBarProps {
  current: number;
  total: number;
}

function EnergyBar(props: EnergyBarProps) {
  return (
    <>
      <Index each={Array(props.total).fill(0)}>
        {(_, i) => (
          <svg // 能量点
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
          >
            <path
              d="M538.112 38.4c-15.36-44.544-39.936-44.544-55.296 0l-84.992 250.88c-14.848 44.544-64 93.184-108.032 108.544L40.448 482.816c-44.544 15.36-44.544 39.936 0 55.296l247.808 86.016c44.544 15.36 93.184 64.512 108.544 108.544l86.528 251.392c15.36 44.544 39.936 44.544 55.296 0l84.48-249.856c14.848-44.544 63.488-93.184 108.032-108.544l252.928-86.528c44.544-15.36 44.544-39.936 0-54.784l-248.832-83.968c-44.544-14.848-93.184-63.488-108.544-108.032-1.536-0.512-88.576-253.952-88.576-253.952z"
              fill={i < props.current ? "yellow" : "white"}
              stroke="black"
              stroke-width="40"
            />
          </svg>
        )}
      </Index>
    </>
  );
}

function WaterDrop() {
  return (
    <svg // 水滴
      viewBox="0 0 1024 1024"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      width="30"
      height="40"
    >
      <path
        d="M926.2 609.8c0 227.2-187 414.2-414.2 414.2S97.8 837 97.8 609.8c0-226.2 173.3-395 295.7-552C423.5 19.3 467.8 0 512 0s88.5 19.3 118.5 57.8c122.4 157 295.7 325.8 295.7 552z"
        fill="#ffffff"
        stroke="black"
        stroke-width="30"
      />
    </svg>
  );
}

export function CharacterArea(props: CharacterAreaProps) {
  const { allDamages, previewData } = useEventContext();
  const damaged = () => allDamages().find((d) => d.targetId === props.data.id);

  const aura = (): [number, number] => {
    const aura =
      previewData().flatMap(({ mutation }) =>
        mutation?.$case === "modifyEntityVar" &&
        mutation.value.entityId === props.data.id &&
        mutation.value.variableName === "aura"
          ? [mutation.value.variableValue]
          : [],
      )[0] ?? props.data.aura;
    return [aura & 0xf, (aura >> 4) & 0xf];
  };
  const energy = () =>
    previewData().flatMap(({ mutation }) =>
      mutation?.$case === "modifyEntityVar" &&
      mutation.value.entityId === props.data.id &&
      mutation.value.variableName === "energy"
        ? [mutation.value.variableValue]
        : [],
    )[0] ?? props.data.energy;
  const defeated = () =>
    previewData().some(
      ({ mutation }) =>
        mutation?.$case === "modifyEntityVar" &&
        mutation.value.entityId === props.data.id &&
        mutation.value.variableName === "alive" &&
        mutation.value.variableValue === 0,
    ) || props.data.defeated;

  const previewHealthDiff = () => {
    const previewHealth = previewData().flatMap(({ mutation }) =>
      mutation?.$case === "modifyEntityVar" &&
      mutation.value.entityId === props.data.id &&
      mutation.value.variableName === "health"
        ? [mutation.value.variableValue]
        : [],
    )[0];
    if (typeof previewHealth === "undefined") {
      return null;
    }
    if (previewHealth < props.data.health) {
      return `- ${props.data.health - previewHealth}`;
    } else {
      return `+ ${previewHealth - props.data.health}`;
    }
  };

  const statuses = () =>
    props.data.entity.filter((et) => typeof et.equipment === "undefined");
  const weapon = () =>
    props.data.entity.find((et) => et.equipment === 1 /* weapon */);
  const artifact = () =>
    props.data.entity.find((et) => et.equipment === 2 /* artifact */);
  const technique = () =>
    props.data.entity.find((et) => et.equipment === 3 /* technique */);
  const otherEquipments = () =>
    props.data.entity.filter((et) => et.equipment === 0 /* other */);
  return (
    <div class="flex flex-col gap-1 items-center">
      <div class="h-5 flex flex-row items-end gap-2">
        <For each={aura()}>
          {(aura) => (
            <Show when={aura}>
              <Image imageId={aura} class="h-5 w-5" />
            </Show>
          )}
        </For>
      </div>
      <div class="h-40 relative">
        <div class="absolute z-1 left-[-15px] top-[-20px] flex items-center justify-center">
          <WaterDrop />
          <div class="absolute">{props.data.health}</div>
        </div>
        <div class="absolute z-1 right-[-10px] top-0 flex flex-col gap-2">
          <EnergyBar current={energy()} total={props.data.maxEnergy} />
          <Show when={technique()}>
            {(et) => (
              <Interactive
                class="w-6 h-6 rounded-3 text-center bg-yellow-50 data-[highlight=true]bg-yellow-200 border-solid border-1 border-yellow-800"
                id={et().id}
                definitionId={et().definitionId}
                dataHighlight={et().hasUsagePerRound}
              >
                &#129668;
              </Interactive>
            )}
          </Show>
        </div>
        <Show when={previewHealthDiff()}>
          {(diff) => {
            return (
              <div class="absolute z-2 top-5 left-50% translate-x--50% bg-white opacity-80 p-2 rounded-md">
                {diff()}
              </div>
            );
          }}
        </Show>
        <div class="absolute z-3 hover:z-10 left--3 top-[20px] flex flex-col items-center justify-center gap-2">
          <Show when={weapon()}>
            {(et) => (
              <Interactive
                class="w-6 h-6 rounded-3 text-center bg-yellow-50 data-[highlight=true]bg-yellow-200 border-solid border-1 border-yellow-800"
                id={et().id}
                definitionId={et().definitionId}
                dataHighlight={et().hasUsagePerRound}
              >
                &#x1F5E1;
              </Interactive>
            )}
          </Show>
          <Show when={artifact()}>
            {(et) => (
              <Interactive
                class="w-6 h-6 rounded-3 text-center bg-yellow-50 data-[highlight=true]bg-yellow-200 border-solid border-1 border-yellow-800"
                id={et().id}
                definitionId={et().definitionId}
                dataHighlight={et().hasUsagePerRound}
              >
                &#x1F451;
              </Interactive>
            )}
          </Show>
          <Key each={otherEquipments()} by="id">
            {(et) => (
              <Interactive
                class="w-6 h-6 rounded-3 text-center bg-yellow-50 data-[highlight=true]bg-yellow-200 border-solid border-1 border-yellow-800"
                id={et().id}
                definitionId={et().definitionId}
                dataHighlight={et().hasUsagePerRound}
              >
                &#x2728;
              </Interactive>
            )}
          </Key>
        </div>
        <Interactive
          class="h-full w-full rounded-xl"
          id={props.data.id}
          definitionId={props.data.definitionId}
        >
          <Image
            imageId={props.data.definitionId}
            class="h-full rounded-xl"
            classList={{
              "brightness-50": props.data.defeated,
            }}
          />
        </Interactive>
        <div class="absolute z-3 hover:z-10 left-0 bottom-0 h-6 flex flex-row">
          <Key each={statuses()} by="id">
            {(st) => <Status data={st()} />}
          </Key>
        </div>
        <Show when={defeated()}>
          <div class="absolute z-5 top-[50%] left-0 w-full text-center text-5xl font-bold translate-y-[-50%] font-[var(--font-emoji)]">
            &#9760;
          </div>
        </Show>
        <Show when={damaged()}>
          {(damaged) => (
            <div
              class="absolute z-5 top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] rounded-999 w-20 h-20 bg-white b-2 b-dashed text-5xl flex items-center justify-center"
              style={{
                "border-color": `var(--c-${DICE_COLOR[damaged().damageType]})`,
                color: `var(--c-${DICE_COLOR[damaged().damageType]})`,
              }}
            >
              {damaged().damageType === DamageType.Heal ? "+" : "-"}
              {damaged().value}
            </div>
          )}
        </Show>
      </div>
    </div>
  );
}
