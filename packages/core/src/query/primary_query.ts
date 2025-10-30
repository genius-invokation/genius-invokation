import { mixins } from "../utils";
import { BinaryMethods } from "./binary_methods";
import { HasAtMethods, PrimaryMethods } from "./primary_methods";
import { stringifySExpr } from "./s_expr";
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

type DefeatedKeyword = "defeatedOnly" | "noDefeated" | "all";

export class PrimaryMethodsInternal {
  private _constraints: Expression[] = [];
  private _defeatedKeyword: DefeatedKeyword = "noDefeated";
  setDefeatedConstraint(kw: "defeatedOnly" | "all"): void {
    this._defeatedKeyword = kw;
  }
  addConstraint(...constraints: Expression[]): void {
    this._constraints.push(...constraints);
  }
  [toExpression](): Expression {
    const defeatedConstraint: Expression[] =
      this._defeatedKeyword === "all"
        ? []
        : this._defeatedKeyword === "defeatedOnly"
          ? [["defeated", "only"]]
          : [["defeated", "ignore"]];
    return ["intersection", [], ...this._constraints];
  }
}

class PrimaryQueryImpl<Meta extends HeterogeneousMetaBase>
  implements IQuery<ReturnOfMeta<Meta>>
{
  declare [retMeta]: ReturnOfMeta<Meta>;
  private _internal: PrimaryMethodsInternal;

  constructor(private _leadingUnaryOp: UnaryOperator | null) {
    this._internal = new PrimaryMethodsInternal();
  }

  [toExpression](): Expression {
    if (this._leadingUnaryOp !== null) {
      return [this._leadingUnaryOp, this._internal[toExpression]()];
    }
    return this._internal[toExpression]();
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
