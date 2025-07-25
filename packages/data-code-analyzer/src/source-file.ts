import { Project, ts } from "ts-morph"

export class SourceFile {
  constructor(
    public readonly project: Project,
    public readonly filename: string,
    public readonly file: ts.SourceFile,
  ) {}
}
