import { ImportDeclaration, SourceFile } from "ts-morph";

export class TcgDataImportDecl {
  constructor(
    public readonly importName: string,
    public readonly sourceName: string,
    public readonly decl: ImportDeclaration,
  ) {}

  getSource(): SourceFile {
    return this.decl.getModuleSpecifierSourceFileOrThrow();
  }
}
