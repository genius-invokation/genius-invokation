import { Project, SourceFile } from "ts-morph";
import { TcgDataSourceFile } from "./source_file";

export class TcgDataProject {
  
  readonly files = new Map<SourceFile, TcgDataSourceFile>();
  constructor(readonly project: Project) {}

  addFile(source: SourceFile) {
    const tcgFile = new TcgDataSourceFile(this, source);
    this.files.set(source, tcgFile);
  }
}
