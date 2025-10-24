import {
  type CompositeQuery,
  createCompositeQuery,
  type IntersectionMeta,
  type UnionMeta,
} from "./composite_query";
import type { BinaryOperator, Constructor, IQuery, MetaBase } from "./utils";

type BinaryOperatorResult<LMeta extends MetaBase, RMeta extends MetaBase> = {
  orElse: UnionMeta<[LMeta, RMeta]>;
  union: UnionMeta<[LMeta, RMeta]>;
  intersection: IntersectionMeta<[LMeta, RMeta]>;
};

const BINARY_OPS = ["orElse", "union", "intersection"] as const;

export type BinaryMethods<LMeta extends MetaBase> = {
  [K in BinaryOperator]: <RMeta extends MetaBase>(
    rhs: IQuery<RMeta>,
  ) => CompositeQuery<BinaryOperatorResult<LMeta, RMeta>[K]>;
};

class BinaryMethodsImpl {
  static {
    for (const methodName of BINARY_OPS) {
      Object.defineProperty(BinaryMethodsImpl.prototype, methodName, {
        value: function (this: IQuery, rhs: IQuery) {
          return createCompositeQuery(methodName, [this, rhs]);
        },
      });
    }
  }
}
export const BinaryMethods = BinaryMethodsImpl as Constructor<
  BinaryMethods<MetaBase>
>;
