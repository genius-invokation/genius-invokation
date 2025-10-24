import { mixins } from "../utils";
import { BinaryMethods } from "./binary_methods";
import { HasAtMethods, PrimaryMethods } from "./primary_methods";
import {
  toExpression,
  type Computed,
  type Expression,
  type HeterogeneousMetaBase,
  type IQuery,
  type retMeta,
  type ReturnOfMeta,
  type UnaryOperator,
} from "./utils";

class PrimaryQueryImpl<Meta extends HeterogeneousMetaBase>
  implements IQuery<ReturnOfMeta<Meta>>
{
  declare [retMeta]: ReturnOfMeta<Meta>;

  constructor(private _leadingUnaryOp: UnaryOperator | null) {}

  [toExpression](): Expression {
    // TODO
    return [];
  }
}

const PrimaryQuery = mixins(PrimaryQueryImpl, [
  PrimaryMethods,
  HasAtMethods,
  BinaryMethods,
]) as any;

export const createPrimaryQuery = <Meta extends HeterogeneousMetaBase>(
  leadingUnaryOp: UnaryOperator | null = null,
): PrimaryQuery<Meta> => {
  return new PrimaryQuery(leadingUnaryOp);
};

export type PrimaryQuery<Meta extends HeterogeneousMetaBase> = Computed<
  PrimaryQueryImpl<Meta> &
    PrimaryMethods<Meta> &
    HasAtMethods<Meta> &
    // Forbidden subsequent binary operator that starts with unary shortcut;
    // E.g. `$.has.def(...).orElse($...)` does not make sense. Use `$.has($.def(...)).orElse($...)` instead.
    (Meta extends {
      returns: "identical";
    }
      ? BinaryMethods<ReturnOfMeta<Meta>>
      : {}),
  IQuery<ReturnOfMeta<Meta>>
>;
