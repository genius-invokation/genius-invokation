import { Expression, Node, ts } from "ts-morph";
import { EXTENSION_ID_OFFSET } from "@gi-tcg/core/builder/internal";

export interface Location {
  filename: string;
  line: number;
  column: number;
}

interface ChainCallEntry {
  fnName: string;
  args: readonly Node[];
  location: Location;
}

interface InitializerAnalyzeResult {
  ids: number[];
  chain: ChainCallEntry[];
}

interface EntityInfo {
  id: number;
}

const getLocation = (node: Node): Location => {
  return {
    filename: node.getSourceFile().getFilePath(),
    line: node.getStartLineNumber(),
    column: node.getStartLinePos(),
  };
};

export const ALLOWED_FACTORIES = [
  "character",
  "skill",
  "card",
  "status",
  "combatStatus",
  "summon",
  "support",
  "extension",
];

export type TcgEntityDeclaration = TcgDataDeclaration & { id: number };

export class TcgDataDeclaration {
  readonly entityInfo: EntityInfo | null = null;

  constructor(
    public readonly name: string,
    /** if declaration is array binding, provides name's index */
    nameIndex: number | null,
    readonly isExported: boolean,
    public readonly initializer?: Expression,
  ) {
    if (initializer) {
      const result = TcgDataDeclaration.#analyzeInitializer(initializer);
      if (result) {
        this.entityInfo = {
          id: result.ids[nameIndex ?? 0],
        };
      }
    }
  }

  static #analyzedInitializer = new Map<
    Expression,
    InitializerAnalyzeResult | null
  >();

  static #parseId(idArg: Node): number | null {
    if (idArg.isKind(ts.SyntaxKind.NumericLiteral)) {
      return idArg.getLiteralValue();
    } else {
      return null;
    }
  }
  static #analyzeInitializer(
    initializer: Expression,
  ): InitializerAnalyzeResult | null {
    if (this.#analyzedInitializer.has(initializer)) {
      return this.#analyzedInitializer.get(initializer)!;
    }
    let node: Node = initializer;

    const chainCalls: ChainCallEntry[] = [];
    const ids: number[] = [];
    while (true) {
      if (!node.isKind(ts.SyntaxKind.CallExpression)) {
        this.#analyzedInitializer.set(initializer, null);
        return null;
      }
      const callee = node.getExpression();
      const args = node.getArguments();
      if (callee.isKind(ts.SyntaxKind.PropertyAccessExpression)) {
        const name = callee.getNameNode();
        const text = name.getText();
        const expression = callee.getExpression();
        const location = getLocation(name);
        chainCalls.push({
          fnName: text,
          location: location,
          args,
        });
        if (text === "toStatus" || text === "toCombatStatus") {
          if (args.length < 1) {
            console.warn(
              `toStatus/toCombatStatus call without id in ${initializer
                .getSourceFile()
                .getFilePath()}:${initializer.getStartLineNumber()}`,
            );
          } else {
            const idArg = args[0];
            const idVal = this.#parseId(idArg);
            if (idVal !== null) {
              ids.unshift(idVal);
            } else {
              console.warn(
                `toStatus/toCombatStatus call with non-numeric id in ${initializer
                  .getSourceFile()
                  .getFilePath()}:${initializer.getStartLineNumber()}`,
              );
            }
          }
        }
        node = expression;
        continue;
      } else if (callee.isKind(ts.SyntaxKind.Identifier)) {
        const text = callee.getText();
        const location = getLocation(callee);
        chainCalls.push({
          fnName: text,
          location,
          args,
        });
        if (!ALLOWED_FACTORIES.includes(text)) {
          this.#analyzedInitializer.set(initializer, null);
          return null;
        }
        const isExtension = text === "extension";
        if (args.length < 1) {
          console.warn(
            `Factory call without id in ${initializer
              .getSourceFile()
              .getFilePath()}:${initializer.getStartLineNumber()}`,
          );
        } else {
          const idArg = args[0];
          let idVal = this.#parseId(idArg);
          if (idVal !== null) {
            if (isExtension) {
              idVal += EXTENSION_ID_OFFSET;
            }
            ids.unshift(idVal);
          } else {
            console.warn(
              `Factory call with non-numeric id in ${initializer
                .getSourceFile()
                .getFilePath()}:${initializer.getStartLineNumber()}`,
            );
          }
        }
        break;
      } else {
        this.#analyzedInitializer.set(initializer, null);
        return null;
      }
    }
    const result: InitializerAnalyzeResult = {
      ids,
      chain: chainCalls.toReversed(),
    };
    this.#analyzedInitializer.set(initializer, result);
    return result;
  }

  get id() {
    return this.entityInfo?.id ?? null;
  }
  isEntity(): this is TcgEntityDeclaration {
    return this.id !== null;
  }

  *referencingIdentifiers() {
    if (!this.initializer) {
      return;
    }
    for (const node of this.initializer?.getDescendants() ?? []) {
      if (node.isKind(ts.SyntaxKind.Identifier)) {
        yield node;
      }
    }
  }
}
