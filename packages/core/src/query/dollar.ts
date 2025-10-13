type Expression = string | number | ExpressionArray;
interface ExpressionArray extends Array<Expression> {}

const toExpression: unique symbol = Symbol("toExpression");

interface IQuery {
  [toExpression]: () => Expression;
}

class PrimaryMethods {
  get my() {
    return this;
  }
  get opp() {
    return this;
  }
}

class Dollar extends PrimaryMethods {}

class PrimaryQuery extends PrimaryMethods implements IQuery {
  protected readonly type: "primary";
  constructor() {
    super();
    this.type = "primary";
  }

  [toExpression](): Expression {
    // TODO
    return [];
  }
}

type CompositeOperator =
  | "not"
  | "recentFrom"
  | "has"
  | "at"
  | "orElse"
  | "union"
  | "intersection";

class CompositeQuery implements IQuery {
  constructor(private readonly type: CompositeOperator) {}
  [toExpression](): Expression {
    // TODO
    return [this.type];
  }
}

declare const $: Dollar;

$.my;
