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
