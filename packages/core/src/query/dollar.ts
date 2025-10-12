

type Expression = string | number | ExpressionArray;
interface ExpressionArray extends Array<Expression> {}

const toExpression: unique symbol = Symbol("toExpression");

abstract class Query {
  protected abstract readonly type: string;
  abstract [toExpression](): Expression;
}

class PrimaryQuery extends Query {
  protected readonly type: "primary";
  constructor() {
    super();
    this.type = "primary";
  }

  get my() {
    return this;
  }
  get opp() {
    return this;
  }
  [toExpression](): Expression {
    // TODO
    return [];
  }
}

type CompositeOperator = "not" | "recentFrom" | "has" | "at" | "orElse" | "union" | "intersection"

class CompositeQuery extends Query {
  protected readonly type: CompositeOperator;
  constructor(type: CompositeOperator) {
    super();
    this.type = type;
  }
  [toExpression](): Expression {
    // TODO
    return [this.type];
  }
}

const $ = new PrimaryQuery();

$.my;
