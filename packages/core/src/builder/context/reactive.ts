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

import type {
  CharacterDefinition,
  CharacterState,
  GameData,
  GameState,
  PlayerState,
  StateSymbol,
} from "../..";
import type { ActionEventArg, ActionInfo } from "../../base/skill";
import type { Character, TypedCharacter } from "./character";
import type { ContextMetaBase } from "./skill";

type ReactiveClassMap<Meta extends ContextMetaBase> = {
  character: TypedCharacter<Meta>;
};

type Primitive = string | number | boolean | bigint | symbol | null | undefined;
type AtomicObject = Primitive | Date | RegExp | Function | Promise<any>;

type ReadonlyPair<T> = readonly [T, T];

type ApplyReactive<Meta extends ContextMetaBase, A> = A extends AtomicObject
  ? A
  : A extends {
        readonly [StateSymbol]: infer S extends keyof ReactiveClassMap<Meta>;
      }
    ? ApplyReactive<Meta, ReactiveClassMap<Meta>[S]>
    : A extends ReadonlyMap<infer K, infer V>
      ? ReadonlyMap<K, ApplyReactive<Meta, V>>
      : A extends ReadonlySet<infer V>
        ? ReadonlySet<ApplyReactive<Meta, V>>
        : A extends ReadonlyPair<infer E>
          ? ReadonlyPair<ApplyReactive<Meta, E>>
          : A extends readonly (infer E)[]
            ? readonly ApplyReactive<Meta, E>[]
            : A extends object
              ? {
                  readonly [K in keyof A]: ApplyReactive<Meta, A[K]>;
                } extends A
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

type Y = ApplyReactive<TestMeta, GameState>["players"];

// const applyReactive
