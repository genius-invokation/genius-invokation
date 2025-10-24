import {
  type CompositeQuery,
  createCompositeQuery,
  type IntersectionMeta,
  type UnionMeta,
} from "./composite_query";
import type {
  BinaryOperator,
  CharacterMetaReq,
  Constructor,
  EntityOnCharacterMetaReq,
  InferResult,
  IQuery,
  MetaBase,
  RelatedToMetaReq,
  ReturnOfMeta,
} from "./utils";

type BinaryOperatorMetas = {
  has: {
    lhs: CharacterMetaReq;
    rhs: EntityOnCharacterMetaReq;
  };
  at: {
    lhs: EntityOnCharacterMetaReq;
    rhs: CharacterMetaReq;
  };
  orElse: {
    lhs: {};
    rhs: {};
  };
  union: {
    lhs: {};
    rhs: {};
  };
  intersection: {
    lhs: {};
    rhs: {};
  };
};

type BinaryOperatorResult<LMeta extends MetaBase, RMeta extends MetaBase> = {
  has: LMeta;
  at: LMeta;
  orElse: UnionMeta<[LMeta, RMeta]>;
  union: UnionMeta<[LMeta, RMeta]>;
  intersection: IntersectionMeta<[LMeta, RMeta]>;
};

const BINARY_OPS = ["has", "at", "orElse", "union", "intersection"] as const;

export type AllBinaryMethods<Meta extends MetaBase> = {
  [K in keyof BinaryOperatorMetas]: <QueryR extends IQuery>(
    rhs: RelatedToMetaReq<
      InferResult<QueryR>,
      BinaryOperatorMetas[K]["rhs"]
    > extends true
      ? QueryR
      : never,
  ) => CompositeQuery<BinaryOperatorResult<Meta, InferResult<QueryR>>[K]>;
};

export type OmitBinaryMethodNames<Meta extends MetaBase> = {
  [K in keyof BinaryOperatorMetas]: RelatedToMetaReq<
    ReturnOfMeta<Meta>,
    BinaryOperatorMetas[K]["lhs"]
  > extends true
    ? never
    : K;
}[BinaryOperator];

export type BinaryMethods<Meta extends MetaBase> = Omit<
  AllBinaryMethods<Meta>,
  OmitBinaryMethodNames<Meta>
>;

const BinaryMethodsImpl: Function = function () {};
for (const methodName of BINARY_OPS) {
  Object.defineProperty(BinaryMethodsImpl.prototype, methodName, {
    value: function (this: IQuery, rhs: IQuery) {
      return createCompositeQuery(methodName, [this, rhs]);
    },
  });
}
export const BinaryMethods = BinaryMethodsImpl as Constructor<
  BinaryMethods<MetaBase>
>;
