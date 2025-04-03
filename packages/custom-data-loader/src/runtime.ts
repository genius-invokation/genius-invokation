import * as originalBuilderExport from "@gi-tcg/core/builder";

type ProxiedBuilderKey =
  | "card"
  | "character"
  | "combatStatus"
  | "status"
  | "summon"
  | "skill"
  | "extension";

type ProxiedBuilderEntry<Args extends unknown[], Ret extends object> = (
  name: string,
  ...args: Args
) => Ret & ProxiedBuilderRet;

interface ProxiedBuilderRet {
  description(rawDescription: string): this;
  image(url: string): this;
}

export type OriginalBuilderContext = typeof originalBuilderExport;

type OriginalBuilderEntry = Pick<OriginalBuilderContext, ProxiedBuilderKey>;

type BuilderContextType = {
  [K in keyof OriginalBuilderContext]: K extends ProxiedBuilderKey
    ? OriginalBuilderEntry[K] extends ((
        id: number,
        ...args: infer Args extends unknown[]
      ) => infer Ret extends object)
      ? ProxiedBuilderEntry<Args, Ret>
      : never
    : OriginalBuilderContext[K];
};

declare global {
  var BuilderContext: BuilderContextType;
}
