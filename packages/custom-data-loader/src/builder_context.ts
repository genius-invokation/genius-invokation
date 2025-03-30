import {
  beginRegistration,
  endRegistration,
  card as cardOriginal,
  character as characterOriginal,
  combatStatus as combatStatusOriginal,
  extension as extensionOriginal,
  skill as skillOriginal,
  status as statusOriginal,
  summon as summonOriginal,
} from "@gi-tcg/core/builder";
import * as originalBuilderExport from "@gi-tcg/core/builder";

export class BuilderContext {
  constructor(private readonly stepId: () => number) {}

  private withCustomBuilderMethods = <
    T extends object,
    RestArgs extends any[],
    U extends Record<string, (...args: any[]) => void>,
  >(
    fn: (id: number, ...args: RestArgs) => T,
    extraSetters: U,
  ) => {
    return (name: string, ...args: RestArgs) => {
      const id = this.stepId();
      const builder = fn(id, ...args);

      const extraSetters2: Record<string, (...args: any[]) => T> = {};
      for (const [key, value] of Object.entries(extraSetters)) {
        extraSetters2[key] = (...args: any[]) => {
          value(builder, ...args);
          return result;
        };
      }

      const result = new Proxy(builder, {
        get(target, prop) {
          if (Reflect.has(extraSetters2, prop)) {
            return Reflect.get(extraSetters2, prop);
          } else {
            return Reflect.get(target, prop);
          }
        },
      });
      return result;
    };
  };

  beginRegistration() {
    beginRegistration();
    const card = this.withCustomBuilderMethods(cardOriginal, {
      description: () => {},
    });
    const character = this.withCustomBuilderMethods(characterOriginal, {});
    const combatStatus = this.withCustomBuilderMethods(
      combatStatusOriginal,
      {},
    );
    const status = this.withCustomBuilderMethods(statusOriginal, {});
    const summon = this.withCustomBuilderMethods(summonOriginal, {});
    const skill = this.withCustomBuilderMethods(skillOriginal, {});
    const extension = this.withCustomBuilderMethods(extensionOriginal, {});
    return {
      ...originalBuilderExport,
      card,
      character,
      combatStatus,
      status,
      summon,
      skill,
      extension,
    };
  }
  endRegistration() {
    return endRegistration();
  }
}
