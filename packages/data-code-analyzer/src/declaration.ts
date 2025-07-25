import * as ts from "typescript";

export class Declaration {
  constructor(
    public readonly name: string,
    public readonly id: number | null,
    public readonly initializer: ts.Expression,
  ) {}
}
