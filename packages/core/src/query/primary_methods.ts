import type { CardTag, CharacterTag, EntityTag, EntityType } from "..";
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
import type { PrimaryQuery } from "./primary_query";
import type {
  CharacterMetaReq,
  Computed,
  Constructor,
  EntityOnCharacterMetaReq,
  HeterogeneousMetaBase,
  InferResult,
  IQuery,
  IsExtends,
  MetaBase,
  PickingPropsNotStrictlySuperTypeOf,
  RelatedToMetaReq,
  StaticAssert,
  StrictlySuperTypeOf,
} from "./utils";

type PositionPatch<T extends MetaBase["position"]> = {
  type: "character";
  areaType: "characters";
  position: T;
};

type DefPatch<T extends HandleT<ExEntityType>> = (T extends EquipmentHandle
  ? {
      type: "equipment";
      areaType: "characters";
    }
  : T extends SupportHandle
    ? {
        type: "support";
        areaType: "supports";
      }
    : T extends StatusHandle
      ? {
          type: "status";
          areaType: "characters";
        }
      : T extends SummonHandle
        ? {
            type: "summon";
            areaType: "summons";
          }
        : T extends CharacterHandle
          ? {
              type: "character";
              areaType: "characters";
            }
          : T extends CardHandle
            ? {
                type: "card";
                areaType: "hands" | "pile";
              }
            : {}) & {
  definition: T & { readonly _defSpecified: unique symbol };
};

type TagOfImpl<Ty extends ExEntityType> = Ty extends EntityType
  ? EntityTag
  : Ty extends "character"
    ? CharacterTag
    : Ty extends "card"
      ? CardTag
      : never;

type TagOf<Meta extends HeterogeneousMetaBase> = {
  [K in Meta["type"]]: TagOfImpl<K>;
}[Meta["type"]];

type Assign<
  T extends HeterogeneousMetaBase,
  Patch extends Partial<HeterogeneousMetaBase> = {},
> = PrimaryQuery<Computed<T & Patch, HeterogeneousMetaBase>>;

class PrimaryMethodsImpl<Meta extends HeterogeneousMetaBase> {
  private get _self(): any {
    return this;
  }
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
  tag(...tags: TagOf<Meta>[]): Assign<Meta> {
    return this._self;
  }
  tagOf(type: unknown, query: unknown): Assign<Meta> {
    return this._self;
  }
}

type PrimaryMethodRestrictionConfig = {
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

type _Check = StaticAssert<
  IsExtends<
    PrimaryMethodRestrictionConfig,
    {
      [K in keyof PrimaryMethodRestrictionConfig]: Partial<HeterogeneousMetaBase>;
    }
  >
>;

type PrimaryMethodsOmit<Meta extends HeterogeneousMetaBase> = {
  [K in PrimaryMethodNames]: K extends keyof PrimaryMethodRestrictionConfig
    ? PickingPropsNotStrictlySuperTypeOf<
        Meta,
        PrimaryMethodRestrictionConfig[K]
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

export const PrimaryMethods = PrimaryMethodsImpl as Constructor<
  PrimaryMethods<any>
>;
export type PrimaryMethods<Meta extends HeterogeneousMetaBase> = Omit<
  PrimaryMethodsImpl<Meta>,
  PrimaryMethodsOmit<Meta>
>;

export type PrimaryMethodNames = keyof PrimaryMethodsImpl<any> & {};

export const PRIMARY_METHODS = Object.getOwnPropertyDescriptors(
  PrimaryMethodsImpl.prototype,
) as {
  [K in PrimaryMethodNames]: PropertyDescriptor;
} & {
  ["constructor"]?: PropertyDescriptor;
};
delete PRIMARY_METHODS.constructor;

type HasAtConfig = {
  has: {
    subject: CharacterMetaReq;
    object: EntityOnCharacterMetaReq;
  };
  at: {
    subject: EntityOnCharacterMetaReq;
    object: CharacterMetaReq;
  };
};
type HasAtMethodNames = keyof HasAtConfig & {};

type AllHasAtMethods<Meta extends HeterogeneousMetaBase> = {
  [K in HasAtMethodNames]: <Q extends IQuery>(
    object: RelatedToMetaReq<
      InferResult<Q>,
      HasAtConfig[K]["object"]
    > extends true
      ? Q
      : never,
  ) => Assign<Meta, HasAtConfig[K]["subject"]>;
};

type HasAtMethodsOmit<Meta extends HeterogeneousMetaBase> = {
  [K in HasAtMethodNames]: RelatedToMetaReq<
    Meta,
    HasAtConfig[K]["subject"]
  > extends true
    ? never
    : K;
}[HasAtMethodNames];

export type HasAtMethods<Meta extends HeterogeneousMetaBase> = Omit<
  AllHasAtMethods<Meta>,
  HasAtMethodsOmit<Meta>
>;

const HAS_AT_METHODS = ["has", "at"] as const;

class HasAtMethodsImpl {}
for (const methodName of HAS_AT_METHODS) {
  Object.defineProperty(HasAtMethodsImpl.prototype, methodName, {
    value: function (this: any, object: IQuery) {
      // TODO
      return this;
    }
  });
}
export const HasAtMethods = HasAtMethodsImpl as Constructor<HasAtMethods<any>>;
