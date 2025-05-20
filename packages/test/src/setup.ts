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
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import getData from "@gi-tcg/data";
import { JSX } from "#jsx/jsx-runtime";
import {
  GameData,
  CharacterDefinition,
  GameState,
  PhaseType,
  PlayerState,
  CharacterState,
  EntityState,
  CardState,
  Version,
  CharacterVariables,
  ExtensionState,
  CardDefinition,
} from "@gi-tcg/core";
import {
  Aura,
  CardHandle,
  CharacterHandle,
  CombatStatusHandle,
  DiceType,
  EquipmentHandle,
  StatusHandle,
  SummonHandle,
  SupportHandle,
} from "@gi-tcg/core/builder";
import { TestController } from "./controller";

let _nextId = -5000000;
function nextId() {
  return _nextId--;
}

export class Ref {
  #_marker = null;
  readonly id: number;
  constructor() {
    this.id = nextId();
  }
}

export function ref(): Ref {
  return new Ref();
}

export interface CommonEntityJsxProp {
  my?: boolean;
  opp?: boolean;
  v?: Record<string, number>;
  ref?: Ref;
}

export namespace Character {
  export interface Prop extends CommonEntityJsxProp {
    active?: boolean;
    def?: CharacterHandle;
    health?: number;
    energy?: number;
    maxHealth?: number;
    aura?: Aura;
    alive?: 0 | 1;
    children?: JSX.Element[] | JSX.Element;
  }
}
export function Character(props: Character.Prop): JSX.Element {
  return { comp: Character, prop: props };
}

export interface EntityProp extends CommonEntityJsxProp {
  usage?: number;
  usagePerRound?: number;
  shield?: number;
  duration?: number;
}

export namespace Summon {
  export interface Prop extends EntityProp {
    def?: SummonHandle;
  }
}
export function Summon(props: Summon.Prop): JSX.Element {
  return { comp: Summon, prop: props };
}

export namespace CombatStatus {
  export interface Prop extends EntityProp {
    def?: CombatStatusHandle;
  }
}
export function CombatStatus(props: CombatStatus.Prop): JSX.Element {
  return { comp: CombatStatus, prop: props };
}

export namespace Status {
  export interface Prop extends EntityProp {
    def?: StatusHandle;
  }
}
export function Status(props: Status.Prop): JSX.Element {
  return { comp: Status, prop: props };
}
export namespace Equipment {
  export interface Prop extends EntityProp {
    def?: EquipmentHandle;
  }
}
export function Equipment(props: Equipment.Prop): JSX.Element {
  return { comp: Equipment, prop: props };
}

export namespace Support {
  export interface Prop extends EntityProp {
    def?: SupportHandle;
  }
}
export function Support(props: Support.Prop): JSX.Element {
  return { comp: Support, prop: props };
}
export namespace Card {
  export interface Prop extends CommonEntityJsxProp {
    def?: CardHandle;
    pile?: boolean;
    /** 并非来自初始牌堆 */
    notInitial?: boolean;
  }
}
export function Card(props: Card.Prop): JSX.Element {
  return { comp: Card, prop: props };
}

export namespace DeclaredEnd {
  export interface Prop {
    my?: boolean;
    opp?: boolean;
  }
}
export function DeclaredEnd(props: DeclaredEnd.Prop): JSX.Element {
  return { comp: DeclaredEnd, prop: props };
}

export namespace State {
  export interface Prop {
    dataVersion?: Version;
    enableRoll?: boolean;
    phase?: PhaseType;
    currentTurn?: "my" | "opp";
    roundNumber?: number;
    random?: number;

    children?: JSX.Element[] | JSX.Element;
  }
}
export function State(props: State.Prop): JSX.Element {
  return { comp: State, prop: props };
}

function childrenToArray(
  children?: JSX.Element[] | JSX.Element,
): JSX.Element[] {
  if (typeof children === "undefined") {
    return [];
  }
  if (Array.isArray(children)) {
    return children;
  }
  return [children];
}

type Draft<T> = import("immer").Draft<T>;

function emptyPlayerState(): Draft<PlayerState> {
  return {
    initialPile: [],
    pile: [],
    dice: [],
    activeCharacterId: 0,
    characters: [],
    combatStatuses: [],
    summons: [],
    supports: [],
    hands: [],
    removedEntities: [],
    declaredEnd: false,
    canCharged: false,
    canPlunging: false,
    hasDefeated: false,
    legendUsed: false,
    skipNextTurn: false,
    roundSkillLog: new Map(),
  };
}

function defaultCharacterDefs(data: GameData) {
  // 迪卢克，凯亚，砂糖
  const DEFAULT_CH_IDS = [1301, 1103, 1501];
  return DEFAULT_CH_IDS.map((id) => data.characters.get(id)!);
}

export function setup(state: JSX.Element): TestController {
  if (state.comp !== State) {
    throw new Error("The root element must be State");
  }
  const stateProp = state.prop as State.Prop;
  const data = getData(stateProp.dataVersion);
  const players: Draft<[PlayerState, PlayerState]> = [
    emptyPlayerState(),
    emptyPlayerState(),
  ];
  const playerDefaultCharacters = [
    defaultCharacterDefs(data),
    defaultCharacterDefs(data),
  ];
  for (const { comp, prop } of childrenToArray(stateProp.children)) {
    if (comp === DeclaredEnd) {
      if (prop.my) {
        players[0].declaredEnd = true;
      }
      if (prop.opp) {
        players[1].declaredEnd = true;
      }
      continue;
    }
    let who: 0 | 1;
    if (prop.my) {
      who = 0;
    } else if (prop.opp) {
      who = 1;
    } else {
      throw new Error(
        `An entity of type ${comp.name} in global state neither have 'my' or 'opp'`,
      );
    }
    delete prop.my;
    delete prop.opp;
    type OmitProp<T> = Omit<T, "my" | "opp">;
    type AllEntityProp =
      | CombatStatus.Prop
      | Summon.Prop
      | Support.Prop
      | Status.Prop
      | Equipment.Prop;
    const player = players[who];
    switch (comp) {
      case Character: {
        const { ref, children, def, active, v, ...namedV } =
          prop as OmitProp<Character.Prop>;
        const id = ref?.id ?? nextId();
        let definition: CharacterDefinition;
        if (def) {
          const value = data.characters.get(def);
          if (!value) {
            throw new Error(`Character ${def} not found`);
          }
          definition = value;
        } else {
          definition = playerDefaultCharacters[who].shift()!;
        }
        const variables = {
          ...Object.fromEntries(
            Object.entries(definition.varConfigs).map(([k, v]) => [
              k,
              v.initialValue,
            ]),
          ),
          ...v,
          ...namedV,
        } as CharacterVariables;

        const entities: Draft<EntityState>[] = [];
        for (const child of childrenToArray(children)) {
          if (!([Status, Equipment] as Function[]).includes(child.comp)) {
            throw new Error(
              `An entity of type ${comp.name} can only have Status or Equipment`,
            );
          }
          const { def, ref, v, ...namedV } =
            child.prop as OmitProp<AllEntityProp>;
          const id = ref?.id ?? nextId();
          if (!def) {
            throw new Error(
              `An entity of type ${comp.name} must have a def prop`,
            );
          }
          const definition = data.entities.get(def);
          if (!definition) {
            throw new Error(`Entity ${def} not found`);
          }
          const variables = {
            ...Object.fromEntries(
              Object.entries(definition.varConfigs).map(([k, v]) => [
                k,
                v.initialValue,
              ]),
            ),
            ...v,
            ...namedV,
          };
          const state: EntityState = {
            id,
            definition,
            variables,
          };
          entities.push(state as Draft<EntityState>);
        }

        const state: CharacterState = {
          id,
          definition,
          variables,
          entities,
        };
        player.characters.push(state as Draft<CharacterState>);
        if (active) {
          if (player.activeCharacterId !== 0) {
            throw new Error(`Player ${who} already has an active character`);
          }
          player.activeCharacterId = id;
        }
        break;
      }
      case Card: {
        const { ref, def, pile, notInitial } = prop as OmitProp<Card.Prop>;
        const id = ref?.id ?? nextId();
        if (!def) {
          throw new Error(
            `An entity of type ${comp.name} must have a def prop`,
          );
        }
        const definition = data.cards.get(def);
        if (!definition) {
          throw new Error(`Card ${def} not found`);
        }
        const state: CardState = {
          id,
          definition,
          variables: {},
        };
        const area = pile ? "pile" : "hands";
        player[area].push(state as Draft<CardState>);
        if (!notInitial) {
          player.initialPile.push(definition as Draft<CardDefinition>);
        }
        break;
      }
      case CombatStatus:
      case Summon:
      case Support: {
        const { ref, def, v, ...namedV } = prop as OmitProp<AllEntityProp>;
        const id = ref?.id ?? nextId();
        if (!def) {
          throw new Error(
            `An entity of type ${comp.name} must have a def prop`,
          );
        }
        const definition = data.entities.get(def);
        if (!definition) {
          throw new Error(`Entity ${def} not found`);
        }
        const variables = {
          ...Object.fromEntries(
            Object.entries(definition.varConfigs).map(([k, v]) => [
              k,
              v.initialValue,
            ]),
          ),
          ...v,
          ...namedV,
        };
        const state: EntityState = {
          id,
          definition,
          variables,
        };
        const area =
          comp === CombatStatus
            ? "combatStatuses"
            : comp === Summon
              ? "summons"
              : "supports";
        player[area].push(state as Draft<EntityState>);
        break;
      }
      default: {
        throw new Error(
          `An entity of type ${comp.name} is not allowed in global state`,
        );
      }
    }
  }
  for (const who of [0, 1] as const) {
    const player = players[who];
    for (let i = player.characters.length; i < 3; i++) {
      const definition = playerDefaultCharacters[who].shift()!;
      const state: CharacterState = {
        id: nextId(),
        definition,
        variables: Object.fromEntries(
          Object.entries(definition.varConfigs).map(([k, v]) => [
            k,
            v.initialValue,
          ]),
        ) as CharacterVariables,
        entities: [],
      };
      player.characters.push(state as Draft<CharacterState>);
    }
    if (player.activeCharacterId === 0) {
      player.activeCharacterId = player.characters[0].id;
    }
    player.dice = Array.from({ length: 8 }, () => DiceType.Omni);
  }

  const extensions = data.extensions
    .values()
    .map(
      (def): ExtensionState => ({
        definition: def,
        state: def.initialState,
      }),
    )
    .toArray();
  const gameState: GameState = {
    data,
    config: {
      initialDiceCount: 8,
      initialHandsCount: 5,
      maxDiceCount: 16,
      maxHandsCount: 10,
      maxRoundsCount: 15,
      maxSummonsCount: 4,
      maxSupportsCount: 4,
      randomSeed: 0,
    },
    iterators: {
      random: stateProp.random ?? 0,
      id: nextId(),
    },
    phase: stateProp.phase ?? "action",
    currentTurn: stateProp.currentTurn === "opp" ? 1 : 0,
    extensions,
    roundNumber: stateProp.roundNumber ?? 1,
    winner: null,
    players,
    delayingEventArgs: [],
  };
  const c = new TestController(gameState);
  c._start();
  return c;
}
