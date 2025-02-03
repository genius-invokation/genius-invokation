
import type { PlayerIO } from "./io";

export interface PlayerConfig {
  alwaysOmni: boolean;
  allowTuningAnyDice: boolean;
}

const DEFAULT_PLAYER_IO: PlayerIO = {
  notify: () => {},
  rpc: async () => {
    throw new Error("Not implemented");
  }
}
const DEFAULT_PLAYER_CONFIG: PlayerConfig = {
  alwaysOmni: false,
  allowTuningAnyDice: false,
}

export class Player {
  public io: PlayerIO = { ...DEFAULT_PLAYER_IO };
  public config: PlayerConfig = { ...DEFAULT_PLAYER_CONFIG };
  constructor() {
    Object.seal(this);
  }
}
