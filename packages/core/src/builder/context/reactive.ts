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
  StateSymbol,
  type CharacterState,
  type EntityState,
  type GameState,
  type StateKind,
} from "../../base/state";
import type { ActionEventArg, ActionInfo } from "../../base/skill";
import { Card, type TypedCard } from "./card";
import { Character, type TypedCharacter } from "./character";
import { Entity, type TypedEntity } from "./entity";
import type { ContextMetaBase, SkillContext } from "./skill";

type ReactiveClassMap<Meta extends ContextMetaBase> = {
  character: TypedCharacter<Meta>;
  entity: TypedEntity<Meta>;
  card: TypedCard<Meta>;
};
type ReactiveClassCtor = new (
  skillContext: SkillContext<any>,
  id: number,
) => ReactiveStateBase;
const REACTIVE_CLASS_MAP: Partial<Record<StateKind, ReactiveClassCtor>> = {
  character: Character,
  entity: Entity,
  card: Card,
};

export const ReactiveStateSymbol: unique symbol = Symbol("ReactiveState");
export type ReactiveStateSymbol = typeof ReactiveStateSymbol;

export abstract class ReactiveStateBase {
  abstract get [ReactiveStateSymbol](): StateKind;
  cast<K extends StateKind>(): this & {
    readonly [ReactiveStateSymbol]: K;
  } {
    return this as any;
  }
}

// interface ReactiveState<Meta extends ContextMetaBase, State extends {}> extends State {};

type ReactiveState<Meta extends ContextMetaBase, State> = State extends {
  readonly [StateSymbol]: infer S extends keyof ReactiveClassMap<Meta>;
}
  ? State & ReactiveClassMap<Meta>[S]
  : never;

type Primitive = string | number | boolean | bigint | symbol | null | undefined;
type AtomicObject = Primitive | Date | RegExp | Function | Promise<any>;

type ReadonlyPair<T, U> = readonly [T, U];

export type ApplyReactive<Meta extends ContextMetaBase, A> = A extends AtomicObject
  ? A
  : A extends {
        readonly [StateSymbol]: keyof ReactiveClassMap<Meta>;
      }
    ? ReactiveState<Meta, A>
    : A extends ReadonlyMap<infer K, infer V>
      ? A // ReadonlyMap<K, ApplyReactive<Meta, V>>
      : A extends ReadonlySet<infer V>
        ? A // ReadonlySet<ApplyReactive<Meta, V>>
        : A extends ReadonlyPair<infer E1, infer E2>
          ? ReadonlyPair<ApplyReactive<Meta, E1>, ApplyReactive<Meta, E2>>
          : A extends readonly (infer E)[]
            ? readonly ApplyReactive<Meta, E>[]
            : A extends object
              ? A extends {
                  readonly [K in keyof A]: ApplyReactive<Meta, A[K]>;
                }
                ? A
                : {
                    [K in keyof A]: ApplyReactive<Meta, A[K]>;
                  }
              : A;

type TestMeta = {
  readonly: false;
  eventArgType: unknown;
  callerVars: never;
  callerType: "status";
  associatedExtension: never;
  shortcutReceiver: unknown;
};

type X = (ApplyReactive<TestMeta, ActionEventArg<ActionInfo>>["action"] & {
  type: "useSkill";
})["skill"]["caller"];

type XX = ApplyReactive<TestMeta, CharacterState | EntityState>;

type Y = ApplyReactive<TestMeta, GameState>["players"][0]["characters"][0];

declare let x: X;

export function applyReactive<Meta extends ContextMetaBase, T>(
  skillContext: SkillContext<Meta>,
  value: T,
): ApplyReactive<Meta, T> {
  if (value === null) {
    return null as ApplyReactive<Meta, T>;
  }
  if (typeof value !== "object") {
    return value as ApplyReactive<Meta, T>;
  }
  if (
    value instanceof Date ||
    value instanceof RegExp ||
    value instanceof Promise
  ) {
    return value as ApplyReactive<Meta, T>;
  }
  if (value instanceof Map || value instanceof Set) {
    return value as ApplyReactive<Meta, T>;
  }
  if (
    StateSymbol in value &&
    typeof value[StateSymbol] === "string" &&
    value[StateSymbol] in REACTIVE_CLASS_MAP &&
    "id" in value &&
    typeof value.id === "number"
  ) {
    const Ctor = REACTIVE_CLASS_MAP[value[StateSymbol] as StateKind]!;
    const instance = new Ctor(skillContext, value.id);
    return new Proxy(value, {
      get(target, prop, receiver) {
        if (prop in Ctor.prototype) {
          return Reflect.get(instance, prop, instance);
        } else {
          return Reflect.get(target, prop, receiver);
        }
      },
      set(target, prop, value, receiver) {
        if (prop in Ctor.prototype) {
          return Reflect.set(instance, prop, value, instance);
        } else {
          return Reflect.set(target, prop, value, receiver);
        }
      },
    }) as ApplyReactive<Meta, T>;
  }
  return new Proxy(value, {
    get(target, prop, receiver) {
      return applyReactive(skillContext, Reflect.get(target, prop, receiver));
    },
  }) as ApplyReactive<Meta, T>;
}
