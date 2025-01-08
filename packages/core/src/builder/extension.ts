import { Draft } from "immer";
import { GameState } from "../base/state";
import {
  EventArgOf,
  EventNames,
  SkillDescription,
  TriggeredSkillDefinition,
} from "../base/skill";
import { SkillContext } from "./context/skill";
import { registerExtension } from "./registry";
import { wrapSkillInfoWithExt, WritableMetaOf } from "./skill";
import { ExtensionHandle } from "./type";
import { DEFAULT_VERSION_INFO } from "../base/version";

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
  public readonly id: number;
  private _description = "";

  constructor(
    idHint: number,
    private readonly initialState: ExtStateType,
  ) {
    this.id = idHint + 50_000_000;
  }

  description(description: string) {
    this._description = description;
    return this;
  }

  private generateSkillId() {
    const thisSkillNo = ++this._skillNo;
    return this.id + thisSkillNo / 100;
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
      >(
        state,
        wrapSkillInfoWithExt(skillInfo, extId),
        arg,
      );
      ctx.setExtensionState((st) => operation(st, arg, state));
      return [ctx.state, ctx.events] as const;
    };
    const def: TriggeredSkillDefinition = {
      type: "skill",
      initiativeSkillConfig: null,
      id: this.generateSkillId(),
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
  return new ExtensionBuilder(idHint, initialState);
}
