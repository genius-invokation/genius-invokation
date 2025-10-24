import {
  createCompositeQuery,
  type CompositeQuery,
  type IntersectionMeta,
  type UnionMeta,
} from "./composite_query";
import {
  PRIMARY_METHODS,
  PrimaryMethods,
  type PrimaryMethodNames,
} from "./primary_methods";
import { createPrimaryQuery, type PrimaryQuery } from "./primary_query";
import type {
  HeterogeneousMetaBase,
  InferResult,
  IQuery,
  IsExtends,
  MetaBase,
  NotFunctionPrototype,
  RelatedToMetaReq,
  StaticAssert,
  UnaryOperator,
  UnaryOperatorMetas,
} from "./utils";

type DollarUnaryOperatorMethods = {
  [K in keyof UnaryOperatorMetas as UnaryOperatorMetas[K]["name"]]: {
    <T extends IQuery>(
      arg: RelatedToMetaReq<
        InferResult<T>,
        UnaryOperatorMetas[K]["operand"]
      > extends true
        ? T
        : never,
    ): PrimaryQuery<
      UnaryOperatorMetas[K]["result"] & MetaBase & { returns: "identical" }
    >;
  } & PrimaryQuery<
    MetaBase &
      UnaryOperatorMetas[K]["operand"] & {
        returns: UnaryOperatorMetas[K]["result"] & MetaBase;
      }
  > &
    NotFunctionPrototype;
};

class Dollar {
  intersection<A extends MetaBase, B extends MetaBase>(
    a: IQuery<A>,
    b: IQuery<B>,
  ): CompositeQuery<IntersectionMeta<[A, B]>>;
  intersection<A extends MetaBase, B extends MetaBase, C extends MetaBase>(
    a: IQuery<A>,
    b: IQuery<B>,
    c: IQuery<C>,
  ): CompositeQuery<IntersectionMeta<[A, B, C]>>;
  intersection<
    A extends MetaBase,
    B extends MetaBase,
    C extends MetaBase,
    D extends MetaBase,
  >(
    a: IQuery<A>,
    b: IQuery<B>,
    c: IQuery<C>,
    d: IQuery<D>,
  ): CompositeQuery<IntersectionMeta<[A, B, C, D]>>;
  intersection(...args: IQuery[]): CompositeQuery<any> {
    return createCompositeQuery<any>("intersection", args);
  }

  union<A extends MetaBase, B extends MetaBase>(
    a: IQuery<A>,
    b: IQuery<B>,
  ): CompositeQuery<UnionMeta<[A, B]>>;
  union<A extends MetaBase, B extends MetaBase, C extends MetaBase>(
    a: IQuery<A>,
    b: IQuery<B>,
    c: IQuery<C>,
  ): CompositeQuery<UnionMeta<[A, B, C]>>;
  union<
    A extends MetaBase,
    B extends MetaBase,
    C extends MetaBase,
    D extends MetaBase,
  >(
    a: IQuery<A>,
    b: IQuery<B>,
    c: IQuery<C>,
    d: IQuery<D>,
  ): CompositeQuery<UnionMeta<[A, B, C, D]>>;
  union(...args: IQuery[]): CompositeQuery<any> {
    return createCompositeQuery<any>("union", args);
  }
}

for (const [method, descriptor] of Object.entries<PropertyDescriptor>(
  PRIMARY_METHODS,
) as [PrimaryMethodNames, PropertyDescriptor][]) {
  if (descriptor.get) {
    Object.defineProperty(Dollar.prototype, method, {
      get() {
        return createPrimaryQuery(null)[method];
      },
    });
  } else if (descriptor.value) {
    Object.defineProperty(Dollar.prototype, method, {
      value(...args: unknown[]) {
        return (
          createPrimaryQuery(null)[method] as (...args: unknown[]) => unknown
        )(...args);
      },
    });
  }
}

const UNARY_OPS = {
  unaryHas: "has",
  unaryAt: "at",
  not: "not",
  recentFrom: "recentFrom",
} as const;

type _Check = StaticAssert<
  IsExtends<
    typeof UNARY_OPS,
    {
      [K in keyof UnaryOperatorMetas]: UnaryOperatorMetas[K]["name"];
    }
  >
>;

for (const [operator, name] of Object.entries(UNARY_OPS) as [
  UnaryOperator,
  string,
][]) {
  const chainForm = () => {
    const callingForm = (q: IQuery) => {
      return createPrimaryQuery(operator);
    };
    const returns = createPrimaryQuery(operator);
    Object.setPrototypeOf(callingForm, returns);
    return callingForm;
  };
  Object.defineProperty(Dollar.prototype, name, {
    get: chainForm,
    enumerable: true,
  });
}

type InitialPrimaryMeta = MetaBase & { returns: "identical" };

type IDollar = Dollar &
  PrimaryMethods<InitialPrimaryMeta> &
  DollarUnaryOperatorMethods;

const $ = new Dollar() as IDollar;

// test

$.equipment.at($.character);

$.not($.active.has($.tag("shield")));

$.has($.status);

const x = $.intersection(
  $.opp,
  $.union($.status, $.combatStatus, $.summon),
  $.union($.tag("barrier"), $.tag("shield")),
);

type X = InferResult<typeof x>;

const y = $.opp.next.orElse($.opp.active);
type Y = InferResult<typeof y>;

$.has($.status).orElse($.active);

const z = $.opp.union($.my).intersection($.active);
type Z = InferResult<typeof z>;
