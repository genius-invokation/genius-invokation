type Expression = string | number | ExpressionArray;
interface ExpressionArray extends Array<Expression> {}

const toExpression: unique symbol = Symbol("toExpression");

interface IQuery {
  [toExpression]: () => Expression;
}

class PrimaryMethods<RetT = unknown> {
  #self: RetT = this as unknown as RetT;
  // who
  get my(): RetT {
    return this.#self;
  }
  get opp(): RetT {
    return this.#self;
  }
  get all(): RetT {
    return this.#self;
  }
  // type/area
  get character(): RetT {
    return this.#self;
  }
  get equipment(): RetT {
    return this.#self;
  }
  get status(): RetT {
    return this.#self;
  }
  get summon(): RetT {
    return this.#self;
  }
  get support(): RetT {
    return this.#self;
  }
  get hand(): RetT {
    return this.#self;
  }
  get pile(): RetT {
    return this.#self;
  }
  get card(): RetT {
    return this.#self;
  }
  // position
  get active(): RetT {
    return this.#self;
  }
  get prev(): RetT {
    return this.#self;
  }
  get next(): RetT {
    return this.#self;
  }
  get standby(): RetT {
    return this.#self;
  }
  // defeated
  get onlyDefeated(): RetT {
    return this.#self;
  }
  get includesDefeated(): RetT {
    return this.#self;
  }
  // with
  // TODO
  var(...args: unknown[]): RetT {
    return this.#self;
  }
  id(id: number): RetT {
    return this.#self;
  }
  def(id: number): RetT {
    return this.#self;
  }
  tag(...tags: string[]): RetT {
    return this.#self;
  }
  tagOf(type: unknown, query: unknown): RetT {
    return this.#self;
  }
}

type PrimaryMethodNames = keyof PrimaryMethods & {};

const PRIMARY_METHODS = Object.getOwnPropertyDescriptors(
  PrimaryMethods.prototype,
) as {
  [K in PrimaryMethodNames]: PropertyDescriptor;
} & {
  ["constructor"]?: unknown;
};
delete PRIMARY_METHODS.constructor;

const PRIMARY_METHOD_NAMES = Object.keys(PRIMARY_METHODS) as PrimaryMethodNames[];

type Dollar = PrimaryMethods<PrimaryQuery>;

class PrimaryQuery extends PrimaryMethods<PrimaryQuery> implements IQuery {
  constructor() {
    super();
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

$.my.my.my;
