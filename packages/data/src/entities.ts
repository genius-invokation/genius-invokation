import { CharacterContext } from "./characters";

interface EntityBaseContext<InfoT, HandleT, Writable extends boolean = false> {
  readonly entityId: number;
  readonly id: HandleT;
  readonly info: InfoT;

  readonly master: CharacterContext<Writable> | null;
  isMine(): boolean;

  readonly usage: number;
  readonly value: number;
}

interface EntityActionContext<InfoT, HandleT> extends EntityBaseContext<InfoT, HandleT, true> {
  setUsage(value: number): number;
  setValue(value: number): number;
  dispose(): void;
}

export type EntityContext<InfoT, HandleT, Writable extends boolean> = Writable extends true
  ? EntityActionContext<InfoT, HandleT>
  : EntityBaseContext<InfoT, HandleT>;
