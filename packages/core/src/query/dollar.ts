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
  InferResult,
  IQuery,
  MetaBase,
  NotFunctionPrototype,
  RelatedToMetaReq,
  UnaryOperatorMetas,
} from "./utils";

type DollarUnaryOperatorMethods = {
  [K in keyof UnaryOperatorMetas]: {
    <T extends IQuery>(
      arg: RelatedToMetaReq<
        InferResult<T>,
        UnaryOperatorMetas[K]["operand"]
      > extends true
        ? T
        : never,
    ): PrimaryQuery<UnaryOperatorMetas[K]["result"] & InitialPrimaryMeta>;
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

const UNARY_OPS = ["has", "at", "not", "recentFrom"] as const;

for (const name of UNARY_OPS) {
  const chainForm = () => {
    const callingForm = (q: IQuery) => {
      return createPrimaryQuery(name);
    };
    const returns = createPrimaryQuery(name);
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

export const $ = new Dollar() as IDollar;
