import {
  ImportDeclaration,
  SourceFile,
  ts,
  VariableDeclaration,
} from "ts-morph";
import { TcgDataDeclaration, TcgEntityDeclaration } from "./declaration";
import { TcgDataProject } from "./project";
import { TcgDataImportDecl } from "./imports";

export class TcgDataSourceFile {
  imports = new Map<string, TcgDataImportDecl>();
  varDecls = new Map<string, TcgDataDeclaration>();

  constructor(
    public readonly project: TcgDataProject,
    public readonly file: SourceFile,
  ) {
    for (const stmt of file.getStatements()) {
      if (stmt.isKind(ts.SyntaxKind.ImportDeclaration)) {
        this.#addImport(stmt);
      } else if (stmt.isKind(ts.SyntaxKind.VariableStatement)) {
        for (const decl of stmt.getDeclarations()) {
          this.#addDeclaration(decl);
        }
      }
    }
  }

  #addImport(importDecl: ImportDeclaration) {
    const moduleSpec = importDecl.getModuleSpecifierSourceFile();
    if (!moduleSpec) {
      return;
    }
    if (importDecl.getDefaultImport()) {
      console.warn(
        `Default import in ${this.file.getFilePath()}:${importDecl.getStartLineNumber()} is not supported`,
      );
    }
    for (const namedImport of importDecl.getNamedImports()) {
      const srcName = namedImport.getName();
      const name = namedImport.getAliasNode()?.getText() ?? srcName;
      const tcgImport = new TcgDataImportDecl(name, srcName, importDecl);
      this.imports.set(srcName, tcgImport);
    }
  }

  #addDeclaration(decl: VariableDeclaration) {
    const name = decl.getNameNode();
    if (name.isKind(ts.SyntaxKind.Identifier)) {
      const tcgDecl = new TcgDataDeclaration(name.getText(), null, decl);
      this.varDecls.set(tcgDecl.name, tcgDecl);
    } else if (name.isKind(ts.SyntaxKind.ArrayBindingPattern)) {
      const arrayElements = name.getElements();
      for (let i = 0; i < arrayElements.length; i++) {
        const element = arrayElements[i];
        if (element.isKind(ts.SyntaxKind.OmittedExpression)) {
          continue;
        }
        const elementName = element.getNameNode();
        if (elementName.isKind(ts.SyntaxKind.Identifier)) {
          const tcgDecl = new TcgDataDeclaration(
            elementName.getText(),
            i,
            decl,
          );
          this.varDecls.set(tcgDecl.name, tcgDecl);
        } else {
          console.warn(
            `Unsupported nesting array binding pattern in ${this.file.getFilePath()}:${element.getStartLineNumber()}`,
          );
        }
      }
    } else {
      console.warn(
        `Unsupported variable declaration kind ${name.getKindName()} in ${this.file.getFilePath()}:${name.getStartLineNumber()}`,
      );
    }
  }

  #referenceCache = new Map<TcgDataDeclaration, Set<TcgEntityDeclaration>>();
  getReferencesOfDecl(
    decl: TcgDataDeclaration,
    from: TcgDataDeclaration[] = [],
  ): Set<TcgEntityDeclaration> {
    if (this.#referenceCache.has(decl)) {
      return this.#referenceCache.get(decl)!;
    }
    let result = new Set<TcgEntityDeclaration>();
    for (const name of decl.referencingIdentifiers()) {
      const text = name.getText();
      const varDecl = this.varDecls.get(text);
      if (varDecl) {
        if (from.includes(varDecl)) {
          continue;
        }
        if (varDecl.isEntity()) {
          result.add(varDecl);
        } else {
          result = result.union(
            this.getReferencesOfDecl(varDecl, [...from, decl]),
          );
        }
        continue;
      }
      const importDecl = this.imports.get(text);
      if (importDecl) {
        const file = importDecl.getSource();
        const tcgFile = this.project.files.get(file);
        if (!tcgFile) {
          continue;
        }
        const thatDecl = tcgFile.getExportedDeclFromName(text);
        if (!thatDecl) {
          console.warn(
            `Cannot find exported declaration ${text} in ${file.getFilePath()}`,
          );
          continue;
        }
        if (thatDecl.isEntity()) {
          result.add(thatDecl);
        } else {
          result = result.union(
            tcgFile.getReferencesOfDecl(thatDecl, [...from, decl]),
          );
        }
        continue;
      }
    }
    this.#referenceCache.set(decl, result);
    return result;
  }

  getExportedDeclFromName(name: string): TcgDataDeclaration | null {
    const varDecl = this.varDecls.get(name);
    if (varDecl?.isExported) {
      return varDecl;
    }
    return null;
  }

  getPath() {
    return this.file.getFilePath();
  }
}
