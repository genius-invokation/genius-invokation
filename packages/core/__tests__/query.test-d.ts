import { expectAssignable, expectDeprecated, expectError } from "tsd";
import { $ } from "../src/query/dollar";
import type { IQuery, InferResult } from "../src/query/utils";
import { SummonHandle } from "../src/builder";

declare const infer: <Q extends IQuery>(q: Q) => InferResult<Q>;

// basic entity types
expectAssignable<{ type: "equipment" }>(infer($.equipment));
expectAssignable<{ type: "status" }>(infer($.status));
expectAssignable<{ type: "combatStatus" }>(infer($.combatStatus));
expectAssignable<{ type: "summon" }>(infer($.summon));
expectAssignable<{ type: "support" }>(infer($.support));

expectAssignable<{ type: "card" }>(infer($.hand));
expectAssignable<{ type: "card" }>(infer($.pile));

expectAssignable<{ type: "character" }>(infer($.character));
expectAssignable<{ type: "character" }>(infer($.active));
expectAssignable<{ type: "character" }>(infer($.prev));
expectAssignable<{ type: "character" }>(infer($.next));

// @ts-expect-error
expectError(infer($.status.support));

// combining who
expectAssignable<{ who: "my" }>(infer($.my));
expectAssignable<{ who: "my" }>(infer($.my.combatStatus));
expectAssignable<{ who: "my" }>(infer($.my.support));
expectAssignable<{ who: "opp" }>(infer($.opp.pile));
expectAssignable<{ who: "opp" }>(infer($.opp.equipment));
// @ts-expect-error
expectError(infer($.my.my));
// @ts-expect-error
expectError(infer($.my.opp));

// specifying id/def
declare const summonId: SummonHandle;
expectAssignable<{ type: "summon" }>(infer($.def(summonId)));
// @ts-expect-error
expectError(infer($.support.def(summonId)));
// @ts-expect-error
expectError(infer($.def(summonId).status));
// @ts-expect-error
expectError(infer($.id(1).id(2)));

// unary operators
expectAssignable<{ type: "character" }>(infer($.recentFrom($.opp.active)));
expectAssignable<{ type: "character" }>(infer($.has($.status)));
expectAssignable<{ type: "character" }>(infer($.has.status));
expectAssignable<{ type: "character" }>(infer($.has.equipment));
expectAssignable<{ type: "equipment" | "status" }>(infer($.at.my.active));
// @ts-expect-error
expectError(infer($.has($.character)));
// @ts-expect-error
expectError(infer($.has($.support)));
// @ts-expect-error
expectError(infer($.at($.summon)));
// @ts-expect-error
expectError(infer($.recentFrom($.support)));
// using Function.prototype
expectDeprecated($.has.call);
expectDeprecated($.at.name);

// hasAt method
expectAssignable<{ type: "character" }>(infer($.character.has($.equipment)));
expectAssignable<{ type: "status" }>(infer($.status.at($.my)));
// @ts-expect-error
expectError(infer($.equipment.at($.summon)));

// binary operator
expectAssignable<{
  who: "opp";
  type: "character";
  position: "active" | "next";
}>(infer($.opp.next.orElse($.opp.active)));

// complex example
// Lisp style
expectAssignable<{ who: "opp"; type: "status" | "combatStatus" | "summon" }>(
  infer(
    $.intersection(
      $.opp,
      $.union($.status, $.combatStatus, $.summon),
      $.union($.tag("barrier"), $.tag("shield")),
    ),
  ),
);
// Java style
expectAssignable<{ who: "opp"; type: "status" | "combatStatus" | "summon" }>(
  infer(
    $.opp
      .intersection($.status.union($.combatStatus).union($.summon))
      .intersection($.tag("barrier").union($.tag("shield"))),
  ),
);
