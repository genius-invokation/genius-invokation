import { mixins } from "../utils";
import { BinaryMethods } from "./binary_methods";
import {
  toExpression,
  type CompositeOperator,
  type Computed,
  type Expression,
  type IQuery,
  type MetaBase,
  type retMeta,
  type ReturnOfMeta,
} from "./utils";

type UnionMeta2<Meta1 extends MetaBase, Meta2 extends MetaBase> = {
  [K in keyof Meta1 & keyof Meta2]: Meta1[K] | Meta2[K];
};
export type UnionMeta<Metas extends MetaBase[]> = Computed<
  Metas extends [infer First extends MetaBase, ...infer Rest extends MetaBase[]]
    ? UnionMeta2<First, UnionMeta<Rest>>
    : never,
  MetaBase
>;

type IntersectionMeta2<Meta1 extends MetaBase, Meta2 extends MetaBase> = {
  [K in keyof Meta1 & keyof Meta2]: Meta1[K] & Meta2[K];
};
export type IntersectionMeta<Metas extends MetaBase[]> = Computed<
  Metas extends [infer First extends MetaBase, ...infer Rest extends MetaBase[]]
    ? IntersectionMeta2<First, IntersectionMeta<Rest>>
    : MetaBase,
  MetaBase
>;

class CompositeQueryImpl<Meta extends MetaBase>
  implements IQuery<ReturnOfMeta<Meta>>
{
  declare [retMeta]: ReturnOfMeta<Meta>;
  constructor(
    private readonly type: CompositeOperator,
    private readonly operands: IQuery[],
  ) {}
  [toExpression](): Expression {
    // TODO
    return [this.type];
  }
}

const CompositeQuery = mixins(CompositeQueryImpl, [BinaryMethods]) as any;
export const createCompositeQuery = <Meta extends MetaBase>(
  type: CompositeOperator,
  operands: IQuery[],
): CompositeQuery<Meta> => {
  return new CompositeQuery(type, operands);
};

export type CompositeQuery<Meta extends MetaBase> = Computed<
  CompositeQueryImpl<Meta> & BinaryMethods<Meta>,
  IQuery<ReturnOfMeta<Meta>>
>;
