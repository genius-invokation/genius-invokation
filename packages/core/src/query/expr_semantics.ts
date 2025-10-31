import type { IsExtends, StaticAssert } from "./utils";

interface Rule {
  use?: NonTerminalName;

  enum?: [string, ...string[]];
  // arbitrary primitive values
  arbitrary?: "number" | "string";

  // (<leading> <args> ...<restArgs>)
  leading?: string;
  args?: Argument[];
  restArgs?: Argument;

  description?: string;
}

interface Argument extends Rule {
  name: string;
}

interface NonTerminalConfig {
  rules: [Rule, ...Rule[]];
  description?: string;
}

const defineNonTerminal = <const T extends NonTerminalConfig>(config: T): T =>
  config;

class NonTerminalsConfig {
  Query = defineNonTerminal({
    rules: [{ use: "UnorderedQuery" }, { use: "OrderedQuery" }],
  });
  UnorderedQuery = defineNonTerminal({
    rules: [{ use: "PrimaryQuery" }, { use: "CompositeQuery" }],
  });
  OrderedQuery = defineNonTerminal({
    rules: [
      {
        leading: "orderBy",
        args: [{ name: "orderingSpec", use: "UnorderedQuery" }],
      },
      {
        leading: "orderBy",
        args: [
          { name: "orderingSpec", use: "UnorderedQuery" },
          { name: "limit", arbitrary: "number" },
        ],
      },
    ],
  });

  PrimaryQuery = defineNonTerminal({
    rules: [
      {
        leading: "who",
        args: [{ name: "whoSpec", enum: ["my", "opp"] }],
      },
      {
        leading: "type",
        args: [
          {
            name: "typeSpec",
            enum: [
              "character",
              "equipment",
              "status",
              "combatStatus",
              "summon",
              "support",
              "card",
            ],
          },
        ],
      },
      {
        leading: "area",
        args: [
          {
            name: "areaSpec",
            enum: [
              "characters",
              "combatStatuses",
              "summons",
              "supports",
              "hands",
              "pile",
            ],
          },
        ],
      },
      {
        leading: "position",
        args: [
          { name: "positionSpec", enum: ["active", "standby", "prev", "next"] },
        ],
      },
      {
        leading: "defeated",
        args: [{ name: "defeatedSpec", enum: ["only", "ignore"] }],
      },
      {
        leading: "variables",
        args: [], // TODO
      },
      {
        leading: "id",
        args: [{ name: "idValue", arbitrary: "number" }],
      },
      {
        leading: "definition",
        args: [{ name: "definitionId", arbitrary: "number" }],
      },
      {
        leading: "tag",
        args: [{ name: "tagValue", arbitrary: "string" }],
      },
      {
        leading: "tagOf",
        args: [
          { name: "tagType", enum: ["element", "weapon"] },
          { name: "referencedQuery", use: "UnorderedQuery" },
        ],
      },
    ],
  });
  CompositeQuery = defineNonTerminal({
    rules: [
      {
        leading: "intersection",
        restArgs: { name: "operands", use: "UnorderedQuery" },
      },
      {
        leading: "union",
        restArgs: { name: "operands", use: "UnorderedQuery" },
      },
      {
        leading: "orElse",
        args: [
          { name: "lhs", use: "UnorderedQuery" },
          { name: "rhs", use: "UnorderedQuery" },
        ],
      },
      {
        leading: "not",
        args: [{ name: "operand", use: "UnorderedQuery" }],
      },
      {
        leading: "has",
        args: [{ name: "operand", use: "UnorderedQuery" }],
      },
      {
        leading: "at",
        args: [{ name: "operand", use: "UnorderedQuery" }],
      },
      {
        leading: "recentFrom",
        args: [{ name: "operand", use: "UnorderedQuery" }],
      },
    ],
  });
}

type NonTerminalName = keyof NonTerminalsConfig;

type InferRule<R extends Rule> = R extends { use: infer U }
  ? U extends NonTerminalName
    ? InferNonTerminal<U>
    : never
  : R extends { enum: infer E extends string[] }
    ? E[number]
    : R extends { arbitrary: infer A extends string | number }
      ? A
      : R extends {
            leading: infer L extends string;
            args: infer Args extends Argument[];
          }
        ? InferExpr<L, Args, undefined>
        : R extends {
              leading: infer L extends string;
              args: infer Args extends Argument[];
              restArgs: infer RestArgs extends Argument;
            }
          ? InferExpr<L, Args, RestArgs>
          : R extends {
                leading: infer L extends string;
                restArgs: infer RestArgs extends Argument;
              }
            ? InferExpr<L, undefined, RestArgs>
            : never;

type InferExpr<
  L extends string,
  Args extends Argument[] | undefined,
  RestArgs extends Argument | undefined,
> = [
  L,
  ...(Args extends Argument[] ? InferArguments<Args> : []),
  ...(RestArgs extends Argument ? InferArgument<RestArgs>[] : []),
];

type InferArguments<Args extends Argument[]> = Args extends [
  infer First extends Argument,
  ...infer Rest extends Argument[],
]
  ? [InferArgument<First>, ...InferArguments<Rest>]
  : [];

type InferArgument<Arg extends Argument> = InferRule<Arg>;

type InferNonTerminal<N extends NonTerminalName> = InferRules<NonTerminalsConfig[N]["rules"][number]>;

type InferRules<R extends Rule> = InferRule<R>;
