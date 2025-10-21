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
type Computed<T> = { [K in keyof T]: T[K] } extends infer O ? O : never;
type StaticAssert<T extends true> = T;

type Expression = string | number | ExpressionArray;
interface ExpressionArray extends Array<Expression> {}

const toExpression: unique symbol = Symbol("toExpression");

interface IQuery {
  [toExpression]: () => Expression;
}

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
  ? M
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
            : {}) & { definition: T };

type Assign<
  T extends MetaBase,
  Patch extends Partial<MetaBase> = {},
> = RestrictedPrimaryQuery<
  Computed<T & Patch> extends MetaBase ? Computed<T & Patch> : never
>;

class PrimaryMethods<Meta extends MetaBase> {
  #self: any = this;
  // who
  get my(): Assign<Meta, { who: "my" }> {
    return this.#self;
  }
  get opp(): Assign<Meta, { who: "opp" }> {
    return this.#self;
  }
  get all(): Assign<Meta, { who: "all" }> {
    return this.#self;
  }
  // type/area
  get character(): Assign<Meta, { type: "character"; areaType: "characters" }> {
    return this.#self;
  }
  get equipment(): Assign<Meta, { type: "equipment"; areaType: "characters" }> {
    return this.#self;
  }
  get status(): Assign<Meta, { type: "status"; areaType: "characters" }> {
    return this.#self;
  }
  get combatStatus(): Assign<
    Meta,
    { type: "combatStatus"; areaType: "combatStatuses" }
  > {
    return this.#self;
  }
  get summon(): Assign<Meta, { type: "summon"; areaType: "summons" }> {
    return this.#self;
  }
  get support(): Assign<Meta, { type: "support"; areaType: "supports" }> {
    return this.#self;
  }
  get hand(): Assign<Meta, { type: "card"; areaType: "hands" }> {
    return this.#self;
  }
  get pile(): Assign<Meta, { type: "card"; areaType: "pile" }> {
    return this.#self;
  }
  get card(): Assign<Meta, { type: "card"; areaType: "hands" | "pile" }> {
    return this.#self;
  }
  // position
  get active(): Assign<Meta, PositionPatch<"active">> {
    return this.#self;
  }
  get prev(): Assign<Meta, PositionPatch<"prev">> {
    return this.#self;
  }
  get next(): Assign<Meta, PositionPatch<"next">> {
    return this.#self;
  }
  get standby(): Assign<Meta, PositionPatch<"standby">> {
    return this.#self;
  }
  // defeated
  get onlyDefeated(): Assign<
    Meta,
    { type: "character"; areaType: "characters"; defeated: "only" }
  > {
    return this.#self;
  }
  get includesDefeated(): Assign<
    Meta,
    { type: "character"; areaType: "characters"; defeated: "includes" }
  > {
    return this.#self;
  }
  // with
  // TODO
  var(...args: unknown[]): Assign<Meta> {
    return this.#self;
  }
  id(id: number): Assign<Meta, { id: number }> {
    return this.#self;
  }
  def<T extends HandleT<Meta["type"]>>(id: T): Assign<Meta, DefPatch<T>>;
  def<T extends number>(id: number extends T ? number : never): Meta;
  def(id: number): unknown {
    return this.#self;
  }
  tag(...tags: string[]): Assign<Meta> {
    return this.#self;
  }
  tagOf(type: unknown, query: unknown): Assign<Meta> {
    return this.#self;
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

type CharacterMetaBase = MetaBase & {
  type: "character";
  areaType: "characters";
};
type EntityOnCharacterMetaBase = MetaBase & {
  type: "status" | "equipment";
  areaType: "characters";
};

type UnaryOperator = "not" | "unaryHas" | "unaryAt" | "recentFrom";
type BinaryOperator = "has" | "at" | "orElse" | "union" | "intersection";

type CompositeOperator = UnaryOperator | BinaryOperator;

type UnaryOperatorMetas = {
  not: {
    operand: MetaBase;
    result: MetaBase;
  };
  unaryHas: {
    operand: EntityOnCharacterMetaBase;
    result: CharacterMetaBase;
  };
  unaryAt: {
    operand: CharacterMetaBase;
    result: EntityOnCharacterMetaBase;
  };
  recentFrom: {
    operand: CharacterMetaBase;
    result: CharacterMetaBase;
  };
};

type DollarUnaryOperatorMethods = {
  [K in keyof UnaryOperatorMetas]: {
    (arg: /* TODO */ unknown): PrimaryQuery<UnaryOperatorMetas[K]["result"]>;
  };
};

class PrimaryQuery<Meta extends MetaBase>
  extends PrimaryMethods<Meta>
  implements IQuery
{
  constructor(private leadingUnaryOp: UnaryOperator | null) {
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

/**
 * T is not a strictly super type of U.
 * That is, T is either:
 * - same as U
 * - a sub type of U
 * - not related to U
 */
type NotStrictlySuperTypeOf<T, U> = U extends T
  ? T extends U
    ? true
    : false
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
    : never;
}[PrimaryMethodNames];

type RestrictedPrimaryQuery<Meta extends MetaBase> = Omit<
  PrimaryQuery<Meta>,
  OmittedMethods<Meta>
>;

type X = OmittedMethods<{ who: "opp" } & MetaBase>;

class CompositeQuery implements IQuery {
  constructor(private readonly type: CompositeOperator) {}
  [toExpression](): Expression {
    // TODO
    return [this.type];
  }
}

class Dollar {
  get has() {
    return new PrimaryQuery<EntityOnCharacterMetaBase>("unaryHas");
  }
  get at() {
    return new PrimaryQuery<CharacterMetaBase>("unaryAt");
  }
  get not() {
    return new PrimaryQuery<MetaBase>(`not`);
  }
  get recentFrom() {
    return new PrimaryQuery<CharacterMetaBase>("recentFrom");
  }
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

type IDollar = Dollar & PrimaryMethods<MetaBase>;

const $ = new Dollar() as IDollar;

console.log($.my);
