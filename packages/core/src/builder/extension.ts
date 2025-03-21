import type { Draft } from "immer";
import type { GameState } from "../base/state";
import type {
  EventArgOf,
  EventNames,
  SkillDescription,
  TriggeredSkillDefinition,
} from "../base/skill";
import { SkillContext } from "./context/skill";
import { registerExtension, builderWeakRefs, createDIS, createSkillDIS } from "./registry";
import { wrapSkillInfoWithExt, type WritableMetaOf } from "./skill";
import type { ExtensionHandle } from "./type";
import { DEFAULT_VERSION_INFO } from "../base/version";
import type { DefinitionIdStr } from "@gi-tcg/utils";

type ExtensionBuilderMeta<
  ExtStateType extends object,
  Event extends EventNames,
> = {
  callerType: "character";
  callerVars: never;
  eventArgType: EventArgOf<Event>;
  associatedExtension: ExtensionHandle<ExtStateType>;
};

export class ExtensionBuilder<ExtStateType extends object> {
  private _skillNo = 0;
  private _skillList: TriggeredSkillDefinition[] = [];
  private _description = "";

  constructor(
    public readonly id: DefinitionIdStr,
    private readonly initialState: ExtStateType,
  ) {
    builderWeakRefs.add(new WeakRef(this));
  }

  description(description: string) {
    this._description = description;
    return this;
  }

  private generateSkillId() {
    const thisSkillNo = ++this._skillNo;
    return createSkillDIS(this.id, thisSkillNo);
  }

  mutateWhen<E extends EventNames>(
    event: E,
    operation: (
      extensionState: Draft<ExtStateType>,
      eventArg: EventArgOf<E>,
      currentGameState: GameState,
    ) => void,
  ) {
    const extId = this.id;
    const action: SkillDescription<any> = (state, skillInfo, arg) => {
      const ctx = new SkillContext<
        WritableMetaOf<ExtensionBuilderMeta<ExtStateType, E>>
      >(state, wrapSkillInfoWithExt(skillInfo, extId), arg);
      ctx.setExtensionState((st) => operation(st, arg, state));
      return ctx._terminate();
    };
    const def: TriggeredSkillDefinition = {
      type: "skill",
      initiativeSkillConfig: null,
      id: this.generateSkillId(),
      ownerType: "extension",
      triggerOn: event,
      filter: () => true,
      action,
      usagePerRoundVariableName: null,
    };
    this._skillList.push(def);
    return this;
  }

  done(): ExtensionHandle<ExtStateType> {
    registerExtension({
      __definition: "extensions",
      type: "extension",
      id: this.id,
      description: this._description,
      version: DEFAULT_VERSION_INFO,
      initialState: this.initialState,
      skills: this._skillList,
    });
    return this.id as ExtensionHandle<ExtStateType>;
  }
}

export function extension<ExtStateType extends object>(
  idHint: number,
  initialState: ExtStateType,
) {
  return new ExtensionBuilder(createDIS(idHint + 50_000_000), initialState);
}
