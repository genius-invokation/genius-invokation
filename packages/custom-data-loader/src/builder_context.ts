// Copyright (C) 2025 Guyutongxue
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import {
  card as cardOriginal,
  character as characterOriginal,
  combatStatus as combatStatusOriginal,
  extension as extensionOriginal,
  skill as skillOriginal,
  status as statusOriginal,
  summon as summonOriginal,
  type IRegistrationScope,
} from "@gi-tcg/core/builder";
import * as originalBuilderExport from "@gi-tcg/core/builder";

const DISABLED_BUILDER_METHODS = ["since", "until", "setVersionInfo"];

declare global {
  namespace GiTcg {
    export interface VersionMetadata {
      customData: {};
    }
  }
}

export class BuilderContext {
  constructor(
    private readonly registry: originalBuilderExport.Registry,
    private readonly options: {
      stepId: () => number;
      registerName: (id: number, name: string) => void;
      registerDescription: (id: number, desc: string) => void;
      registerImage: (id: number, url: string) => void;
    },
  ) {}

  private readonly withCustomBuilderMethods = <
    T extends object,
    RestArgs extends any[],
    U extends Record<string, (id: number, ...args: any[]) => void>,
  >(
    fn: (id: number, ...args: RestArgs) => T,
    extraSetters: U,
  ) => {
    return (name: string, ...args: RestArgs) => {
      const id = this.options.stepId();
      this.options.registerName(id, name);
      const builder: any = fn(id, ...args);

      if (builder.setVersionInfo) {
        builder.setVersionInfo("customData", {});
      }

      const extraSetters2: Record<string, (...args: any[]) => T> = {};
      for (const [key, value] of Object.entries(extraSetters)) {
        extraSetters2[key] = (...args: any[]) => {
          value(id, ...args);
          if (key in builder && typeof builder[key] === "function") {
            builder[key](...args);
          }
          return result;
        };
      }

      const result = new Proxy(builder, {
        get(target, prop) {
          if (DISABLED_BUILDER_METHODS.includes(prop as string)) {
            throw new Error(`Method ${String(prop)} is disabled`);
          }
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

  private scope: IRegistrationScope | null = null;

  beginRegistration() {
    this.scope = this.registry.begin();
    const commonSetter = {
      description: this.options.registerDescription,
      image: this.options.registerImage,
    };
    const card = this.withCustomBuilderMethods(cardOriginal, commonSetter);
    const character = this.withCustomBuilderMethods(
      characterOriginal,
      commonSetter,
    );
    const combatStatus = this.withCustomBuilderMethods(
      combatStatusOriginal,
      commonSetter,
    );
    const status = this.withCustomBuilderMethods(statusOriginal, commonSetter);
    const summon = this.withCustomBuilderMethods(summonOriginal, commonSetter);
    const skill = this.withCustomBuilderMethods(skillOriginal, commonSetter);
    const extension = this.withCustomBuilderMethods(
      extensionOriginal,
      commonSetter,
    );
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
    this.scope?.end();
    this.scope = null;
  }
}
