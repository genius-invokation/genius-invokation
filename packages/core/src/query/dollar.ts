import type { EntityArea } from "../base/entity";
import type {
  CardHandle,
  CharacterHandle,
  EquipmentHandle,
  ExEntityType,
  HandleT,
  StatusHandle,
  SummonHandle,
  SupportHandle,
} from "../builder/type";

type IsExtends<T, U> = T extends U ? true : false;
type Related<T, U> = T extends U ? true : U extends T ? true : false;
type Computed<T> = { [K in keyof T]: T[K] } extends infer O ? O : never;
type StaticAssert<T extends true> = T;
type NotFunctionPrototype = {
  /** @deprecated This object do not have function prototype */
  apply: never;
  /** @deprecated This object do not have function prototype */
  bind: never;
  /** @deprecated This object do not have function prototype */
  call: never;
  /** @deprecated This object do not have function prototype */
  arguments: never;
  /** @deprecated This object do not have function prototype */
  caller: never;
  /** @deprecated This object do not have function prototype */
  prototype: never;
  /** @deprecated This object do not have function prototype */
  toString: never;
  /** @deprecated This object do not have function prototype */
  length: never;
  /** @deprecated This object do not have function prototype */
  name: never;
};

type Expression = string | number | ExpressionArray;
interface ExpressionArray extends Array<Expression> {}

const toExpression: unique symbol = Symbol("toExpression");
const meta: unique symbol = Symbol("meta");

type MetaSymbol = typeof meta;

interface IQuery {
  [meta]: MetaBase;
  [toExpression]: () => Expression;
}

type InferResult<Q extends IQuery> = ReturnOfMeta<Q[MetaSymbol]>;

type MetaBase = {
  type: ExEntityType;
  areaType: EntityArea["type"];
  who: "my" | "opp" | "all";
  definition: number;
  position: "active" | "prev" | "next" | "standby";
  defeated: "only" | "includes";
  id: number;
  returns: "identical" | MetaBase;
};

type ReturnOfMeta<M extends MetaBase> = M["returns"] extends "identical"
  ? Computed<M>
  : M["returns"] extends MetaBase
    ? ReturnOfMeta<M["returns"]>
    : never;

type PositionPatch<T extends MetaBase["position"]> = {
  type: "character";
  areaType: "characters";
  position: T;
};

type DefPatch<T extends HandleT<ExEntityType>> = (T extends EquipmentHandle
  ? {
      type: "equipment";
      area: "characters";
    }
  : T extends SupportHandle
    ? {
        type: "support";
        area: "supports";
      }
    : T extends StatusHandle
      ? {
          type: "status";
          area: "characters";
        }
      : T extends SummonHandle
        ? {
            type: "summon";
            area: "summons";
          }
        : T extends CharacterHandle
          ? {
              type: "character";
              area: "characters";
            }
          : T extends CardHandle
            ? {
                type: "card";
              }
            : {}) & {
  definition: T & { readonly _defSpecified: unique symbol };
};

type Assign<
  T extends MetaBase,
  Patch extends Partial<MetaBase> = {},
> = RestrictedPrimaryQuery<
  Computed<T & Patch> extends MetaBase ? Computed<T & Patch> : never
>;

class PrimaryMethods<Meta extends MetaBase> {
  private _self: any = this;
  // who
  get my(): Assign<Meta, { who: "my" }> {
    return this._self;
  }
  get opp(): Assign<Meta, { who: "opp" }> {
    return this._self;
  }
  get all(): Assign<Meta, { who: "all" }> {
    return this._self;
  }
  // type/area
  get character(): Assign<Meta, { type: "character"; areaType: "characters" }> {
    return this._self;
  }
  get equipment(): Assign<Meta, { type: "equipment"; areaType: "characters" }> {
    return this._self;
  }
  get status(): Assign<Meta, { type: "status"; areaType: "characters" }> {
    return this._self;
  }
  get combatStatus(): Assign<
    Meta,
    { type: "combatStatus"; areaType: "combatStatuses" }
  > {
    return this._self;
  }
  get summon(): Assign<Meta, { type: "summon"; areaType: "summons" }> {
    return this._self;
  }
  get support(): Assign<Meta, { type: "support"; areaType: "supports" }> {
    return this._self;
  }
  get hand(): Assign<Meta, { type: "card"; areaType: "hands" }> {
    return this._self;
  }
  get pile(): Assign<Meta, { type: "card"; areaType: "pile" }> {
    return this._self;
  }
  get card(): Assign<Meta, { type: "card"; areaType: "hands" | "pile" }> {
    return this._self;
  }
  // position
  get active(): Assign<Meta, PositionPatch<"active">> {
    return this._self;
  }
  get prev(): Assign<Meta, PositionPatch<"prev">> {
    return this._self;
  }
  get next(): Assign<Meta, PositionPatch<"next">> {
    return this._self;
  }
  get standby(): Assign<Meta, PositionPatch<"standby">> {
    return this._self;
  }
  // defeated
  get onlyDefeated(): Assign<
    Meta,
    { type: "character"; areaType: "characters"; defeated: "only" }
  > {
    return this._self;
  }
  get includesDefeated(): Assign<
    Meta,
    { type: "character"; areaType: "characters"; defeated: "includes" }
  > {
    return this._self;
  }
  // with
  // TODO
  var(...args: unknown[]): Assign<Meta> {
    return this._self;
  }
  id<Id extends number>(
    id: Id,
  ): Assign<Meta, { id: Id & { readonly _idSpecified: unique symbol } }> {
    return this._self;
  }
  def<T extends HandleT<Meta["type"]>>(id: T): Assign<Meta, DefPatch<T>>;
  def<T extends number>(id: number extends T ? number : never): Meta;
  def(id: number): unknown {
    return this._self;
  }
  tag(...tags: string[]): Assign<Meta> {
    return this._self;
  }
  tagOf(type: unknown, query: unknown): Assign<Meta> {
    return this._self;
  }
}

type PrimaryMethodNames = keyof PrimaryMethods<any> & {};

const PRIMARY_METHODS = Object.getOwnPropertyDescriptors(
  PrimaryMethods.prototype,
) as {
  [K in PrimaryMethodNames]: PropertyDescriptor;
} & {
  ["constructor"]?: PropertyDescriptor;
};
delete PRIMARY_METHODS.constructor;

type CharacterMetaReq = {
  type: "character";
  areaType: "characters";
};
type EntityOnCharacterMetaReq = {
  type: "status" | "equipment";
  areaType: "characters";
};

type UnaryOperator = "not" | "unaryHas" | "unaryAt" | "recentFrom";
type BinaryOperator = "has" | "at" | "orElse" | "union" | "intersection";

type CompositeOperator = UnaryOperator | BinaryOperator;

type UnaryOperatorMetas = {
  not: {
    name: "not";
    operand: {};
    result: {};
  };
  unaryHas: {
    name: "has";
    operand: EntityOnCharacterMetaReq;
    result: CharacterMetaReq;
  };
  unaryAt: {
    name: "at";
    operand: CharacterMetaReq;
    result: EntityOnCharacterMetaReq;
  };
  recentFrom: {
    name: "recentFrom";
    operand: CharacterMetaReq;
    result: CharacterMetaReq;
  };
};

type RelatedToMetaReq<
  Input extends MetaBase,
  Req extends Partial<MetaBase>,
> = Related<Pick<Input, keyof Req & keyof Input>, Req>;

type DollarUnaryOperatorMethods = {
  [K in keyof UnaryOperatorMetas as UnaryOperatorMetas[K]["name"]]: {
    <T extends IQuery>(
      arg: RelatedToMetaReq<
        T[MetaSymbol],
        UnaryOperatorMetas[K]["operand"]
      > extends true
        ? T
        : never,
    ): RestrictedPrimaryQuery<UnaryOperatorMetas[K]["result"] & InitialMeta>;
  } & RestrictedPrimaryQuery<
    Omit<InitialMeta & UnaryOperatorMetas[K]["operand"], "returns"> & {
      returns: UnaryOperatorMetas[K]["result"] & InitialMeta;
    }
  > &
    NotFunctionPrototype;
};

class PrimaryQuery<Meta extends MetaBase>
  extends PrimaryMethods<Meta>
  implements IQuery
{
  declare [meta]: Meta;

  constructor(private _leadingUnaryOp: UnaryOperator | null) {
    super();
  }

  [toExpression](): Expression {
    // TODO
    return [];
  }
}

type RestrictionConfig = {
  my: { who: "my" };
  opp: { who: "opp" };
  all: { who: "all" };
  character: { type: "character"; areaType: "characters" };
  equipment: { type: "equipment"; areaType: "characters" };
  status: { type: "status"; areaType: "characters" };
  combatStatus: { type: "combatStatus"; areaType: "combatStatuses" };
  summon: { type: "summon"; areaType: "summons" };
  support: { type: "support"; areaType: "supports" };
  hand: { type: "card"; areaType: "hands" };
  pile: { type: "card"; areaType: "pile" };
  card: { type: "card" };
  active: { type: "character"; position: "active" };
  prev: { type: "character"; position: "prev" };
  next: { type: "character"; position: "next" };
  standby: { type: "character"; position: "standby" };
  onlyDefeated: { type: "character"; defeated: "only" };
  includesDefeated: { type: "character"; defeated: "includes" };
};

type _Check1 = StaticAssert<
  IsExtends<
    RestrictionConfig,
    {
      [K in keyof RestrictionConfig]: Partial<MetaBase>;
    }
  >
>;

type StrictlySuperTypeOf<T, U> = U extends T
  ? T extends U
    ? false
    : true
  : false;

/**
 * T is not a strictly super type of U.
 * That is, T is either:
 * - same as U
 * - a sub type of U
 * - not related to U
 */
type NotStrictlySuperTypeOf<T, U> = StrictlySuperTypeOf<T, U> extends true
  ? false
  : true;
type PickingPropsNotStrictlySuperTypeOf<
  Meta,
  ConfigMeta extends Partial<MetaBase>,
> = NotStrictlySuperTypeOf<
  Pick<Meta, keyof Meta & keyof ConfigMeta>,
  ConfigMeta
>;

type OmittedMethods<Meta extends MetaBase> = {
  [K in PrimaryMethodNames]: K extends keyof RestrictionConfig
    ? PickingPropsNotStrictlySuperTypeOf<
        Meta,
        RestrictionConfig[K]
      > extends true
      ? K
      : never
    : K extends "id"
      ? StrictlySuperTypeOf<number, Meta["id"]> extends true
        ? K
        : never
      : K extends "def"
        ? StrictlySuperTypeOf<number, Meta["definition"]> extends true
          ? K
          : never
        : never;
}[PrimaryMethodNames];

type RestrictedPrimaryQuery<Meta extends MetaBase> = Omit<
  PrimaryQuery<Meta>,
  OmittedMethods<Meta>
>;

class CompositeQuery implements IQuery {
  declare [meta]: MetaBase; // TODO
  constructor(private readonly type: CompositeOperator) {}
  [toExpression](): Expression {
    // TODO
    return [this.type];
  }
}

class Dollar {
  // get has() {
  //   return new PrimaryQuery<EntityOnCharacterMetaBase>("unaryHas");
  // }
  // get at() {
  //   return new PrimaryQuery<CharacterMetaBase>("unaryAt");
  // }
  // get not() {
  //   return new PrimaryQuery<MetaBase>(`not`);
  // }
  // get recentFrom() {
  //   return new PrimaryQuery<CharacterMetaBase>("recentFrom");
  // }
}

for (const [method, descriptor] of Object.entries<PropertyDescriptor>(
  PRIMARY_METHODS,
) as [PrimaryMethodNames, PropertyDescriptor][]) {
  if (descriptor.get) {
    Object.defineProperty(Dollar.prototype, method, {
      get() {
        return new PrimaryQuery(null)[method];
      },
    });
  } else if (descriptor.value) {
    Object.defineProperty(Dollar.prototype, method, {
      value(...args: unknown[]) {
        return (
          new PrimaryQuery(null)[method] as (...args: unknown[]) => unknown
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

type _Check2 = StaticAssert<
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
      return new CompositeQuery(operator);
    };
    const returns = new PrimaryQuery(operator);
    Object.setPrototypeOf(callingForm, returns);
    return callingForm;
  };
  Object.defineProperty(Dollar.prototype, name, {
    get: chainForm,
    enumerable: true,
  });
}

type InitialMeta = Computed<
  Omit<MetaBase, "returns"> & { returns: "identical" }
>;

type IDollar = Dollar &
  PrimaryMethods<InitialMeta> &
  DollarUnaryOperatorMethods;

const $ = new Dollar() as IDollar;

const x = $.my.active;

type X = InferResult<typeof x>;
