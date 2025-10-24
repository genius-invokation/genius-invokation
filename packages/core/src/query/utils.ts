import type { EntityArea } from "../base/entity";
import type { ExEntityType } from "../builder/type";

export type IsExtends<T, U> = T extends U ? true : false;
export type Related<T, U> = T extends U ? true : U extends T ? true : false;
export type Computed<T, R = any> = {
  [K in keyof T]: T[K];
} extends infer O extends R
  ? O
  : never;

export type StrictlySuperTypeOf<T, U> = U extends T
  ? T extends U
    ? false
    : true
  : false;

/**
 * T is not a strictly super type of U.
 * That is, T is either:
 * - same as U
 * - a sub type of U
 * - not related to U
 */
export type NotStrictlySuperTypeOf<T, U> = StrictlySuperTypeOf<
  T,
  U
> extends true
  ? false
  : true;
export type PickingPropsNotStrictlySuperTypeOf<
  Meta,
  ConfigMeta extends Partial<HeterogeneousMetaBase>,
> = NotStrictlySuperTypeOf<
  Pick<Meta, keyof Meta & keyof ConfigMeta>,
  ConfigMeta
>;

export type StaticAssert<T extends true> = T;
export type NotFunctionPrototype = {
  /** @deprecated This object do not have function prototype */
  apply: never;
  /** @deprecated This object do not have function prototype */
  bind: never;
  /** @deprecated This object do not have function prototype */
  call: never;
  /** @deprecated This object do not have function prototype */
  arguments: never;
  /** @deprecated This object do not have function prototype */
  caller: never;
  /** @deprecated This object do not have function prototype */
  prototype: never;
  /** @deprecated This object do not have function prototype */
  toString: never;
  /** @deprecated This object do not have function prototype */
  length: never;
  /** @deprecated This object do not have function prototype */
  name: never;
};

export type Constructor<T = any> = new (...args: any[]) => T;

export type Expression = string | number | Expression[];

export const toExpression: unique symbol = Symbol("toExpression");
export const retMeta: unique symbol = Symbol("meta");

type RetMeta = typeof retMeta;

export interface IQuery<Meta extends MetaBase = MetaBase> {
  [retMeta]: Meta;
  [toExpression]: () => Expression;
}

export type InferResult<Q extends IQuery> = Computed<Q[RetMeta], MetaBase>;

export type HeterogeneousMetaBase = MetaBase & {
  returns: "identical" | MetaBase;
};
export type MetaBase = {
  type: ExEntityType;
  areaType: EntityArea["type"];
  who: "my" | "opp" | "all";
  definition: number;
  position: "active" | "prev" | "next" | "standby";
  defeated: "only" | "includes";
  id: number;
};

export type ReturnOfMeta<M extends MetaBase> = Computed<
  M extends HeterogeneousMetaBase
    ? M["returns"] extends "identical"
      ? Omit<M, "returns"> & { returns: "identical" }
      : M["returns"] extends MetaBase
        ? M["returns"]
        : never
    : M,
  MetaBase
>;

export type CharacterMetaReq = {
  type: "character";
  areaType: "characters";
};
export type EntityOnCharacterMetaReq = {
  type: "status" | "equipment";
  areaType: "characters";
};

export type UnaryOperator = "not" | "unaryHas" | "unaryAt" | "recentFrom";
export type BinaryOperator = "has" | "at" | "orElse" | "union" | "intersection";

export type CompositeOperator = UnaryOperator | BinaryOperator;

export type UnaryOperatorMetas = {
  not: {
    name: "not";
    operand: {};
    result: {};
  };
  unaryHas: {
    name: "has";
    operand: EntityOnCharacterMetaReq;
    result: CharacterMetaReq;
  };
  unaryAt: {
    name: "at";
    operand: CharacterMetaReq;
    result: EntityOnCharacterMetaReq;
  };
  recentFrom: {
    name: "recentFrom";
    operand: CharacterMetaReq;
    result: CharacterMetaReq;
  };
};

export type RelatedToMetaReq<
  Input extends MetaBase,
  Req extends Partial<MetaBase>,
> = Related<Pick<Input, keyof Req & keyof Input>, Req>;
