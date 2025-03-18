import { AssetsManager } from "./manager";

const ASSETS_MANAGER: unique symbol = Symbol('ASSETS_MANAGER');

export function getDefaultManager() {
  const global = globalThis as any;
  if (!global[ASSETS_MANAGER]) {
    global[ASSETS_MANAGER] = new AssetsManager();
  }
  return global[ASSETS_MANAGER];
}
