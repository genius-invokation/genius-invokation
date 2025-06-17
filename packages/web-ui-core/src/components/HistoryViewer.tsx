// Copyright (C) 2024-2025 Guyutongxue
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

import type { AssetsManager } from "@gi-tcg/assets-manager";
import {
  DamageType,
  DiceType,
  flattenPbOneof,
  PbRemoveCardReason,
  PbSkillType,
  Reaction,
  type PbReactionType,
} from "@gi-tcg/typings";
import {
  createEffect,
  createSignal,
  createContext,
  useContext,
  For,
  Match,
  on,
  Show,
  Switch,
  type JSX,
  untrack,
  createResource
} from "solid-js";
import { useUiContext } from "../hooks/context";
import {
  type CardHistoryChildren,
  type CharacterHistoryChildren,
  type CreateEntityHistoryChild,
  type EnergyHistoryChild,
  type HistoryBlock,
  type HistoryChildren,
  type HistoryDetailBlock,
  type HistoryHintBlock,
  type RemoveEntityHistoryChild,
} from "../history";
import { Image } from "./Image";
import { DICE_COLOR, DiceIcon } from "./Dice";
import type { ActionCardRawData, CharacterRawData, EntityRawData, KeywordRawData, SkillRawData } from "@gi-tcg/static-data";
import TunningIcon from "../svg/TunningIcon.svg?component-solid";
import DefeatedPreviewIcon from "../svg/DefeatedPreviewIcon.svg?component-solid";
import RevivePreviewIcon from "../svg/RevivePreviewIcon.svg?component-solid";
import SwitchActiveIcon from "../svg/SwitchActiveIcon.svg?component-solid";
import { CardFace } from "./Card";
import { StrokedText } from "./StrokedText";

const reactionTextMap: Record<number, renderReactionProps> = {
  [Reaction.Melt]: { element: [DamageType.Cryo, DamageType.Pyro], name: "融化" },
  [Reaction.Vaporize]: { element: [DamageType.Hydro, DamageType.Pyro], name: "蒸发" },
  [Reaction.Overloaded]: { element: [DamageType.Electro, DamageType.Pyro], name: "超载" },
  [Reaction.Superconduct]: { element: [DamageType.Cryo, DamageType.Electro], name: "超导" },
  [Reaction.ElectroCharged]: { element: [DamageType.Electro, DamageType.Hydro], name: "感电" },
  [Reaction.Frozen]: { element: [DamageType.Cryo, DamageType.Hydro], name: "冻结" },
  [Reaction.SwirlCryo]: { element: [DamageType.Cryo, DamageType.Anemo], name: "扩散" },
  [Reaction.SwirlHydro]: { element: [DamageType.Hydro, DamageType.Anemo], name: "扩散" },
  [Reaction.SwirlPyro]: { element: [DamageType.Pyro, DamageType.Anemo], name: "扩散" },
  [Reaction.SwirlElectro]: { element: [DamageType.Electro, DamageType.Anemo], name: "扩散" },
  [Reaction.CrystallizeCryo]: { element: [DamageType.Cryo, DamageType.Geo], name: "结晶" },
  [Reaction.CrystallizeHydro]: { element: [DamageType.Hydro, DamageType.Geo], name: "结晶" },
  [Reaction.CrystallizePyro]: { element: [DamageType.Pyro, DamageType.Geo], name: "结晶" },
  [Reaction.CrystallizeElectro]: { element: [DamageType.Electro, DamageType.Geo], name: "结晶" },
  [Reaction.Burning]: { element: [DamageType.Dendro, DamageType.Pyro], name: "燃烧" },
  [Reaction.Bloom]: { element: [DamageType.Dendro, DamageType.Hydro], name: "绽放" },
  [Reaction.Quicken]: { element: [DamageType.Dendro, DamageType.Electro], name: "激化" },
};

const diceTypeTextMap: Record<number, string> = {
  [DiceType.Void]: "未知元素骰",
  [DiceType.Cryo]: "冰元素",
  [DiceType.Hydro]: "水元素",
  [DiceType.Pyro]: "火元素",
  [DiceType.Electro]: "雷元素",
  [DiceType.Anemo]: "风元素",
  [DiceType.Geo]: "岩元素",
  [DiceType.Dendro]: "草元素",
  [DiceType.Omni]: "万能元素",
};

const damageTypeTextMap: Record<number, string> = {
  [DamageType.Physical]: "物理",
  [DamageType.Cryo]: "冰元素",
  [DamageType.Hydro]: "水元素",
  [DamageType.Pyro]: "火元素",
  [DamageType.Electro]: "雷元素",
  [DamageType.Anemo]: "风元素",
  [DamageType.Geo]: "岩元素",
  [DamageType.Dendro]: "草元素",
  [DamageType.Piercing]: "穿透",
};

interface renderReactionProps {
  element: DamageType[];
  name: string;
}

interface childHealthChange {
  type: "damage" | "heal";
  value: number;
  special: boolean;
}

interface renderHistoryChildProps {
  opp: boolean;
  imageId: number | undefined | "tuning";
  imageType: "cardFace" | "icon" | "unspecified" | undefined;
  title: string | undefined;
  healthChange?: childHealthChange;
  content: JSX.Element;
}

export const WhoContext = createContext<() => 0 | 1>(() => 0 as 0 | 1);
export function useWho() {
  return useContext(WhoContext);
}

const renderHistoryChild = (
  child: HistoryChildren,
) => {
  const who = useWho();
  const { assetsManager } = useUiContext();
  let result: renderHistoryChildProps;
  const opp = (historyOwner: 0 | 1) => (historyOwner !== who());
  const subject = (opp: boolean) => (opp ? "对方" : "我方");

  const createEntityTextMap: Record<string, string> = {
    combatStatus: "生成出战状态",
    status: "附属状态：",
    equipment: "附属装备：",
    summon: "生成召唤物",
  };
  const removeEntityTextMap: Record<string, string> = {
    combatStatus: "出战状态消失",
    status: "失去状态：",
    equipment: "失去装备：",
    summon: "卡牌弃置",
    support: "卡牌弃置",
  };
  const createCardTextMap: Record<string, string> = {
    pile: "生成卡牌, 并将其置入牌库",
    hands: "获得手牌",
  };
  const TransformTextMap: Record<string, string> = {
    old: "转换形态···",
    new: "转换形态完成",
  };

  const renderReaction = (reaction: Reaction, apply: DamageType) => {
    const { element, name } = reactionTextMap[reaction];
    const base = element.find((e) => e !== apply)! as DamageType;
    return (
      <>
        <span>{`（`}</span>
        <Image
          imageId={base}
          class="h-3.5 w-3.5"
        />
        <Image
          imageId={apply}
          class="h-3.5 w-3.5"
        />
        <span>
          {`${name}`}
        </span>
        <span>{`）`}</span>
      </>
    );
  };

  switch (child.type) {
    case "switchActive": {
      result = {
        opp: opp(child.who),
        imageId: child.characterDefinitionId,
        imageType: "cardFace",
        title: assetsManager.getNameSync(child.characterDefinitionId),
        content:
          <>
            <span>
              {`角色出战`}
            </span>
            <span>
              {`（${child.isOverloaded ? `超载` : `卡牌效果`}）`}
            </span>
          </>,
      };
      break;
    }
    case "triggered": {
      result = {
        opp: opp(child.who),
        imageId: child.callerDefinitionId,
        imageType: undefined,
        title: assetsManager.getNameSync(child.callerDefinitionId),
        content:
          <>
            <span>
              {`触发效果`}
            </span>
          </>,
      };
      break;
    }
    case "drawCard": {
      result = {
        opp: opp(child.who),
        imageId: child.callerDefinitionId,
        imageType: undefined,
        title: assetsManager.getNameSync(child.callerDefinitionId),
        content:
          <>
            <span>
              {`${subject(opp(child.who))}`}
            </span>
            <span>
              {`抓${child.drawCardsCount}张牌`}
            </span>
          </>,
      };
      break;
    }
    case "stealHand": {
      result = {
        opp: opp(child.who),
        imageId: child.cardDefinitionId,
        imageType: "cardFace",
        title: assetsManager.getNameSync(child.cardDefinitionId),
        content:
          <>
            <span>
              {`${subject(opp(child.who))}`}
            </span>
            <span>
              {`夺取${subject(!opp(child.who))}手牌`}
            </span>
          </>,
      };
      break;
    }
    case "createEntity": {
      if (child.entityType === "status" || child.entityType === "equipment") {
        result = {
          opp: opp(child.who),
          imageId: child.masterDefinitionId,
          imageType: "cardFace",
          title: child.masterDefinitionId ? assetsManager.getNameSync(child.masterDefinitionId) : "???",
          content:
            <>
              <span>
                {`${createEntityTextMap[child.entityType]}`}
              </span>
              <Image
                imageId={child.entityDefinitionId}
                type="icon"
                class="h-3.5 w-3.5"
              />
              <span>
                {`${assetsManager.getNameSync(child.entityDefinitionId)}`}
              </span>
            </>,
        };
      } else { // child.entityType === "combatStatus" | "summon"
        result = {
          opp: opp(child.who),
          imageId: child.entityDefinitionId,
          imageType: undefined,
          title: assetsManager.getNameSync(child.entityDefinitionId),
          content:
            <>
              <span>
                {`${subject(opp(child.who))}`}
              </span>
              <span>
                {`${createEntityTextMap[child.entityType]}`}
              </span>
            </>,
        };
      }
      break;
    }
    case "generateDice": {
      result = {
        opp: opp(child.who),
        imageId: child.callerDefinitionId,
        imageType: undefined,
        title: assetsManager.getNameSync(child.callerDefinitionId),
        content:
          <>
            <span>
              {`${subject(opp(child.who))}`}
            </span>
            <span>
              {`生成${child.diceCount}个`}
            </span>
            <Show when={child.diceType > 0}>
              <DiceIcon
                size={14}
                type={child.diceType}
                selected={false}
              />
            </Show>  
            <span>
              {`${diceTypeTextMap[child.diceType]}`}
            </span>
          </>,
      };
      break;
    }
    case "absorbDice": {
      result = {
        opp: opp(child.who),
        imageId: child.callerDefinitionId,
        imageType: undefined,
        title: assetsManager.getNameSync(child.callerDefinitionId),
        content:
          <>
            <span>
              {`${subject(opp(child.who))}`}
            </span>
            <span>
              {`弃置了${child.diceCount}个元素骰`}
            </span>
          </>,
      };
      break;
    }
    case "createCard": {
      result = {
        opp: opp(child.who),
        imageId: child.cardDefinitionId,
        imageType: "cardFace",
        title: assetsManager.getNameSync(child.cardDefinitionId),
        content:
          <>
            <span>
              {`${subject(opp(child.who))}`}
            </span>
            <span>
              {`${createCardTextMap[child.target]}`}
            </span>
          </>,
      };
      break;
    }
    case "damage": {
      result = {
        opp: opp(child.who),
        imageId: child.characterDefinitionId,
        imageType: "cardFace",
        title: assetsManager.getNameSync(child.characterDefinitionId),
        healthChange: {
          type: "damage",
          value: child.damageValue,
          special: child.causeDefeated,
        },
        content:
          <>
            <span>
              {`受到${child.damageValue}点`}
            </span>
            <Show when={child.damageType <= 7}>
              <Image
                imageId={child.damageType}
                zero="physic"
                class="h-3.5 w-3.5"
              />
            </Show>
            <span style={(child.damageType >= 1 && child.damageType <=7) ? { color: `var(--c-${DICE_COLOR[child.damageType]})` } : undefined}>
              {`${damageTypeTextMap[child.damageType]}伤害`}
            </span>
            <Show when={child.reaction}>
              {(reaction) => renderReaction(reaction(), child.damageType)}
            </Show>
            <span>
              {`，生命值${child.oldHealth}→${child.newHealth}`}
            </span>
            <span>
              {child.causeDefeated ? `，被击倒` : ``}
            </span>
          </>,
      };
      break;
    }
    case "heal":{
      result = {
        opp: opp(child.who),
        imageId: child.characterDefinitionId,
        imageType: "cardFace",
        title: assetsManager.getNameSync(child.characterDefinitionId),
        healthChange: {
          type: "heal",
          value: child.healValue,
          special: (child.healType !== "normal"),
        },
        content:
          <>
            <Switch >
              <Match when={child.healType === "revive"}>
                <span>
                  {`复苏，并`}
                </span>
              </Match>
              <Match when={child.healType === "immuneDefeated"}>
                <span>
                  {`角色免于被击倒，并`}
                </span>
              </Match>
            </Switch>
            <span>
              {`受到${child.healValue}点治疗`}
            </span>
            <span>
              {`，生命值${child.oldHealth}→${child.newHealth}`}
            </span>
          </>,
      };
      break;
    }
    case "apply":{
      result = {
        opp: opp(child.who),
        imageId: child.characterDefinitionId,
        imageType: "cardFace",
        title: assetsManager.getNameSync(child.characterDefinitionId),
        content:
          <>
            <span>
              {`附着`}
            </span>
            <Image
              imageId={child.elementType}
              class="h-3.5 w-3.5"
            />
            <span style={{ color: `var(--c-${DICE_COLOR[child.elementType]})` }}>
              {`${damageTypeTextMap[child.elementType]}`}
            </span>
            <Show when={child.reaction}>
              {(reaction) => renderReaction(reaction(), child.elementType)}
            </Show>
          </>,
      };
      break;
    }
    case "increaseMaxHealth":{
      const increaseValue = child.newMaxHealth - child.oldMaxHealth;
      result = {
        opp: opp(child.who),
        imageId: child.characterDefinitionId,
        imageType: "cardFace",
        title: assetsManager.getNameSync(child.characterDefinitionId),
        content:
          <>
            <span>
              {`获得${increaseValue}点最大生命值`}
            </span>
            <span>
              {`，最大生命值${child.oldMaxHealth}→${child.newMaxHealth}`}
            </span>
          </>,
      };
      break;
    }
    case "energy": {
      const energyValue = child.newEnergy - child.oldEnergy;
      result = {
        opp: opp(child.who),
        imageId: child.characterDefinitionId,
        imageType: "cardFace",
        title: assetsManager.getNameSync(child.characterDefinitionId),
        content:
          <>
            <span>
              {`${energyValue>0 ? "获得" : "消耗"}`}
            </span>
            <span>
              {`${Math.abs(energyValue)}点充能`}
            </span>
            <span>
              {`，充能值${child.oldEnergy}→${child.newEnergy}`}
            </span>
          </>,
      };
      break;
    }
    case "disposeCard":{
      result = {
        opp: opp(child.who),
        imageId: child.cardDefinitionId,
        imageType: "cardFace",
        title: assetsManager.getNameSync(child.cardDefinitionId),
        content:
          <>
            <span>
              {`${subject(opp(child.who))}`}
            </span>
            <span>
              {`舍弃手牌`}
            </span>
          </>,
      };
      break;
    }
    case "variableChange":{
      result = {
        opp: opp(child.who),
        imageId: child.cardDefinitionId,
        imageType: undefined,
        title: assetsManager.getNameSync(child.cardDefinitionId),
        content:
          <>
            <span>
              {`${child.variableName}：`}
            </span>
            <span>
              {`${child.oldValue}→${child.newValue}`}
            </span>
          </>,
      };
      break;
    }
    case "removeEntity":{
      if (child.entityType === "status" || child.entityType === "equipment") {
        result = {
          opp: opp(child.who),
          imageId: child.masterDefinitionId,
          imageType: "cardFace",
          title: child.masterDefinitionId ? assetsManager.getNameSync(child.masterDefinitionId) : "???",
          content:
            <>
              <span>
                {`${removeEntityTextMap[child.entityType]}`}
              </span>
              <Image
                imageId={child.entityDefinitionId}
                type="icon"
                class="h-3.5 w-3.5"
              />
              <span>
                {`${assetsManager.getNameSync(child.entityDefinitionId)}`}
              </span>
            </>,
        };
      } else { // child.entityType === "combatStatus" | "summon" | "support"
        result = {
          opp: opp(child.who),
          imageId: child.entityDefinitionId,
          imageType: undefined,
          title: assetsManager.getNameSync(child.entityDefinitionId),
          content:
            <>
              <span>
                {`${removeEntityTextMap[child.entityType]}`}
              </span>
            </>,
        };
      }
      break;
    }
    case "convertDice":{
      result = {
        opp: opp(child.who),
        imageId: (
          child.isTunning
            ? "tuning"
            : child.callerDefinitionId
        ),
        imageType: undefined,
        title: (
          child.isTunning
            ? "元素调和"
            : child.callerDefinitionId
              ? assetsManager.getNameSync(child.callerDefinitionId)
              : "???"
        ),
        content:
          <>
            <span>
              {`${subject(opp(child.who))}`}
            </span>
            <span>
              {`将1个元素骰转换为`}
            </span>
            <Show when={child.diceType > 0}>
              <DiceIcon
                size={14}
                type={child.diceType}
                selected={false}
              />              
            </Show>
            <span>
              {`${diceTypeTextMap[child.diceType]}`}
            </span>
          </>,
      };
      break;
    }
    case "forbidCard":{
      result = {
        opp: opp(child.who),
        imageId: child.cardDefinitionId,
        imageType: "cardFace",
        title: assetsManager.getNameSync(child.cardDefinitionId),
        content:
          <>
            <span>
              {`遭到反制，未能生效`}
            </span>
          </>,
      };
      break;
    }
    case "transformDefinition":{
      result = {
        opp: opp(child.who),
        imageId: child.cardDefinitionId,
        imageType: undefined,
        title: assetsManager.getNameSync(child.cardDefinitionId),
        content:
          <>
            <span>
              {`${TransformTextMap[child.stage]}`}
            </span>
          </>,
      };
      break;
    }
    default:{
      result = {
        opp: false,
        imageId: undefined,
        imageType: undefined,
        title: "",
        content: <></>,
      };
      break;
    }
  }
  return result;
};

interface renderHistoryHintProps {
  type: "changePhase" | "action";
  opp?: boolean;
  content: string;
}

const renderHistoryHint = (
  block: HistoryHintBlock,
) => {
  const who = useWho();
  let result: renderHistoryHintProps;
  const opp = (historyOwner: 0 | 1) => (historyOwner !== who());
  const subject = (opp: boolean) => (opp ? "对方" : "我方");

  switch (block.type) {
    case "changePhase":{
      switch (block.newPhase) {
        case "initHands":
          result = {
            type: block.type,
            content: `替换起始手牌`,
          };
          break;
        case "initActives":
          result = {
            type: block.type,
            content: `选择初始出战角色`,
          };
          break;
        case "action":
          result = {
            type: block.type,
            content: `回合${block.roundNumber} 开始`,
          };
          break;
        case "end":
          result = {
            type: block.type,
            content: `结束阶段`,
          };
          break;
        default:
          result = {
            type: block.type,
            content: `???`,
          };
          break;
      }
      break;
    }
    case "action":{
      switch (block.actionType) {
        case "action":
          result = {
            type: block.type,
            opp: opp(block.who),
            content: `${subject(opp(block.who))}行动`,
          };
          break;
        case "declareEnd":
          result = {
            type: block.type,
            opp: opp(block.who),
            content: `${subject(opp(block.who))}宣布回合结束`,
          };
          break;
      }
      break;
    }
  }
  return result;
};

function getOrCreateCharacterSummary(
  charMap: Map<string, CharacterSummary>,
  c: {
    characterDefinitionId: number;
    who: 0 | 1;
  }
): CharacterSummary {
  const charId = c.characterDefinitionId;
  const who = c.who;
  const key = `${charId}:${who}`;
  if (!charMap.has(key)) {
    charMap.set(key, {
      characterDefinitionId: charId,
      who: who,
      healthChange: 0,
      switchActive: false,
      elemental: [],
      status: [],
      combatStatus: [],
      children: [],
    });
  }
  return charMap.get(key)!;
}

function getOrCreateCardSummary(
  cardMap: Map<string, CardSummary>,
  c: {
    cardDefinitionId: number;
    who: 0 | 1;
  }
): CardSummary {
  const charId = c.cardDefinitionId;
  const who = c.who;
  const key = `${charId}:${who}`;
  if (!cardMap.has(key)) {
    cardMap.set(key, {
      cardDefinitionId: charId,
      who: who,
      type: [],
      children: [],
    });
  }
  return cardMap.get(key)!;
}

function buildSummary(children: HistoryChildren[]): HistoryChildrenSummary {
  const charMap = new Map<string, CharacterSummary>();
  const cardMap = new Map<string, CardSummary>();

  let summary: CharacterSummary | CardSummary | undefined;

  children.forEach((c) => {
    if (c.type === "damage" || c.type === "heal") {
      summary = getOrCreateCharacterSummary(charMap, c);
      summary.children.push(c);
      const delta = (c.newHealth ?? 0) - (c.oldHealth ?? 0);
      summary.healthChange += delta;
      if (c.type === "damage") {
        if (c.reaction) {
          summary.elemental.push(reactionTextMap[c.reaction].element as DamageType[]);
        } else {
          summary.elemental.push([c.damageType]);
        }
      }
    } else if (c.type === "switchActive") {
      summary = getOrCreateCharacterSummary(charMap, c);
      summary.children.push(c);
      summary.switchActive = true;
    } else if (c.type === "apply") {
      summary = getOrCreateCharacterSummary(charMap, c);
      summary.children.push(c);
      if (c.reaction) {
        summary.elemental.push(reactionTextMap[c.reaction].element as DamageType[]);
      } else {
        summary.elemental.push([c.elementType]);
      }
    } else if (c.type === "createEntity") {
      if (c.entityType === "status") {
        summary = getOrCreateCharacterSummary(charMap, { characterDefinitionId: c.masterDefinitionId!, who: c.who });
        summary.children.push(c as Extract<CreateEntityHistoryChild, { entityType: "state" }>);
        summary.status.push(c.entityDefinitionId);
      } else if (c.entityType === "combatStatus") {
        summary = getOrCreateCharacterSummary(charMap, { characterDefinitionId: c.masterDefinitionId!, who: c.who });
        summary.children.push(c as Extract<CreateEntityHistoryChild, { entityType: "combatStatus" }>);
        summary.combatStatus.push(c.entityDefinitionId);
      } else if (c.entityType === "summon") {
        summary = getOrCreateCardSummary(cardMap, { cardDefinitionId: c.entityDefinitionId, who: c.who });
        summary.children.push(c as Extract<CreateEntityHistoryChild, { entityType: "summon" }>);
        summary.type.push(c.type);
      }
    } else if (c.type === "disposeCard") {
      summary = getOrCreateCardSummary(cardMap, c)
      summary.children.push(c);
      summary.type.push(c.type);
    } else if (c.type === "removeEntity") {
      if (c.entityType === "summon") {
        summary = getOrCreateCardSummary(cardMap, { cardDefinitionId: c.entityDefinitionId, who: c.who })
        summary.children.push(c as Extract<CreateEntityHistoryChild, { entityType: "summon" }>);
        summary.type.push(c.type);
      } else if (c.entityType === "support") {
        summary = getOrCreateCardSummary(cardMap, { cardDefinitionId: c.entityDefinitionId, who: c.who })
        summary.children.push(c as Extract<CreateEntityHistoryChild, { entityType: "support" }>);
        summary.type.push("disposeCard");
      }
    }
  });
  return {
    characterSummary: Array.from(charMap.values()),
    cardSummary: Array.from(cardMap.values()),
  };
}

interface HistoryChildrenSummary {
  characterSummary: CharacterSummary[];
  cardSummary: CardSummary[];
}
interface CharacterSummary {
  characterDefinitionId: number;
  who: 0 | 1;
  healthChange: number;
  switchActive: boolean;
  elemental: DamageType[][];
  status: number[]
  combatStatus: number[];
  children: CharacterHistoryChildren[];
}
interface CardSummary {
  cardDefinitionId: number;
  who: 0 | 1;
  type: ("disposeCard" | "removeEntity" | "createEntity")[];
  children: CardHistoryChildren[];
}
interface SummaryShot {
  size: "normal" | "summon";
  who: 0 | 1 | "both";
  cardface: number[];
  aura: DamageType[] | "more" | undefined;
  inner: "damage" | "heal" | "switch" | "defeated" | undefined;
  innerValue?: number | "more";
  status: number[] | "more" | undefined;
  combat: number[] | "more" | undefined;
}

function renderSummary(children: HistoryChildren[]): SummaryShot[] {
  const { characterSummary, cardSummary } = buildSummary(children);
  type shotType = "damage" | "heal" | "apply" | "switch" | "status" | "dispose" | "create" | "remove";
  const shotGroups: Record<shotType, (CharacterSummary | CardSummary)[]> = {
    damage: [] as CharacterSummary[],
    heal: [] as CharacterSummary[],
    apply: [] as CharacterSummary[],
    switch: [] as CharacterSummary[],
    status: [] as CharacterSummary[],
    dispose: [] as CardSummary[],
    create: [] as CardSummary[],
    remove: [] as CardSummary[],
  };

  characterSummary.forEach((c) => {
    if (c.healthChange < 0) {
      shotGroups.damage.push(c);
    } else if (c.healthChange > 0) {
      shotGroups.heal.push(c);
    } else if (c.elemental.length > 0) {
      shotGroups.apply.push(c);
    } else if (c.switchActive) {
      shotGroups.switch.push(c);
    } else if (c.status.length > 0) {
      shotGroups.status.push(c);
    } else if (c.combatStatus.length > 0) {
      shotGroups.status.push(c);
    }
  });
  cardSummary.forEach((c) => {
    if (c.type.length === 1) {
      if (c.type[0] === "disposeCard") {
        shotGroups.dispose.push(c);
      } else if (c.type[0] === "createEntity") {
        shotGroups.create.push(c);
      } else if (c.type[0] === "removeEntity") {
        shotGroups.remove.push(c);
      }
    }
  });

  const makeAura = (l: CharacterSummary[]) =>
    l.length === 1
      ? l[0].elemental.length === 0
        ? undefined
        : l[0].elemental.length === 1
          ? l[0].elemental[0]
          : "more"
      : l.some((c) => c.elemental.length)
        ? "more"
        : undefined;
  const makeStatus = (l: CharacterSummary[]) =>
    l.length === 1
      ? l[0].status.length === 0
        ? undefined
        : l[0].status
      : l.some((c) => c.status.length)
        ? "more"
        : undefined;
  const makeCombat = (l: CharacterSummary[]) =>
    l.length === 1
      ? l[0].combatStatus.length === 0
        ? undefined
        : l[0].combatStatus
      : l.some((c) => c.combatStatus.length)
        ? "more"
        : undefined;

  const summaryShot: SummaryShot[] = [];
  (Object.keys(shotGroups) as shotType[]).forEach((type) => {
    const list = shotGroups[type];
    if (!list.length) return;
    const uniqueWhos = new Set(list.map(c => c.who));
    const shot: SummaryShot = {
      size:
        (type === "remove" || type === "create")
          ? "summon"
          : "normal",
      who:
        uniqueWhos.size === 1
          ? [...uniqueWhos][0]
          : "both",
      cardface:
        (type === "remove" || type === "create" || type === "dispose")
          ? list.map((c) => (c as CardSummary).cardDefinitionId)
          : list.map((c) => (c as CharacterSummary).characterDefinitionId),
      aura:
        (type === "remove" || type === "create" || type === "dispose")
          ? undefined
          : makeAura(list as CharacterSummary[]),
      inner:
        type === "damage"
          ? "damage"
          : type === "heal"
            ? "heal"
            : type === "switch"
              ? "switch"
              : (type === "remove" || type === "dispose")
                ? "defeated"
                : undefined,
      innerValue:
        (type === "damage" || type === "heal")
          ? list.length === 1
            ? (list[0] as CharacterSummary).healthChange
            : "more"
          : undefined,
      status:
        (type === "remove" || type === "create" || type === "dispose")
          ? undefined
          : makeStatus(list as CharacterSummary[]),
      combat: 
        (type === "remove" || type === "create" || type === "dispose")
          ? undefined
          : makeCombat(list as CharacterSummary[]),
    };
    summaryShot.push(shot);
  });
  return summaryShot;
}

const CardDescriptionPart = (props: { cardDefinitionId: number }) => {
  const { assetsManager } = useUiContext();
  const [data] = createResource(() => props.cardDefinitionId, (id) => assetsManager.getData(id));
  return (
    <Switch>
      <Match when={data.loading}>加载中···</Match>
      <Match when={data.error}>加载失败</Match>
      <Match when={data()}>
        {(data) => <p class="whitespace-pre-wrap">{(data() as ActionCardRawData | EntityRawData).description}</p>}
      </Match>
    </Switch>
  );
}

interface renderHistoryBlockProps {
  type: "switchActive" | "useSkill" | "triggered" | "playingCard" | "selectCard" | "elementalTunning";
  opp: boolean;
  title: string;
  imageId: number | undefined;
  energyChange: blockEnergyProps | undefined;
  content: blockDetailProps;
  summary: SummaryShot[];
}

interface blockDetailProps {
  opp: boolean;
  imageId: number | undefined;
  name: string | undefined;
  content: JSX.Element;
}

interface blockEnergyProps {
  oldEnergy: number;
  newEnergy: number;
  energyValue: number;
  how: "gain" | "loss";
  maxEnergy: number;
}

const renderHistoryBlock = (
  block: HistoryDetailBlock,
) => {
  const who = useWho();
  const { assetsManager } = useUiContext();
  let result: renderHistoryBlockProps;
  const opp = (historyOwner: 0 | 1) => (historyOwner !== who());
  const subject = (opp: boolean) => (opp ? "对方" : "我方");
  const switchActiveTextMap: Record<string, string> = {
    init: "初始出战角色",
    switch: "切换角色",
    select: "选择出战角色",
  };

  function extractBlockEnergyProps(block: {
    characterDefinitionId: number;
    children: HistoryChildren[];
  }, maxEnergy: number): blockEnergyProps | undefined {
    const energyChildren = block.children.filter(
      (c): c is EnergyHistoryChild =>
        c.type === "energy" && c.characterDefinitionId === block.characterDefinitionId
    );
    if (energyChildren.length === 0) return undefined;
    const first = energyChildren[0];
    const last = energyChildren[energyChildren.length - 1];
    const energyValue = last.newEnergy - first.oldEnergy;
    return {
      oldEnergy: first.oldEnergy,
      newEnergy: last.newEnergy,
      energyValue,
      how: energyValue >= 0 ? "gain" : "loss",
      maxEnergy: maxEnergy,
    };
  }

  switch (block.type) {
    case "switchActive":{
      result = {
        type: block.type,
        opp: opp(block.who),
        title: `${subject(opp(block.who))}${switchActiveTextMap[block.how]}`,
        imageId: block.characterDefinitionId,
        energyChange: extractBlockEnergyProps(block, 0), // 可填写maxEnergy
        content: {
          opp: opp(block.who),
          imageId: block.characterDefinitionId,
          name: assetsManager.getNameSync(block.characterDefinitionId),
          content:
            <>
              <span class="text-3 text-#d4bc8e">
                {`角色出战`}
              </span>
            </>,
        },
        summary: renderSummary(block.children),
      };
      break;
    }
    case "useSkill":{
      result = {
        type: block.type,
        opp: opp(block.who),
        title: `${subject(opp(block.who))}${block.skillType === "technique" ? "使用特技" : "使用技能"}`,
        imageId: block.callerDefinitionId,
        energyChange:
          block.skillType === "technique"
            ? undefined
            : extractBlockEnergyProps(
              {
                characterDefinitionId: block.callerDefinitionId,
                children: block.children
              },
              0, // 可填写maxEnergy
            ),
        content: {
          opp: opp(block.who),
          imageId: block.callerDefinitionId,
          name: assetsManager.getNameSync(block.callerDefinitionId),
          content:
            <>
              <div class="flex flex-col gap-1">
                <div class="text-3 text-#d4bc8e">
                  {`${block.skillType === "technique" ? "使用特技" : "使用技能"}`}
                </div>
                <div class="flex flex-row items-center gap-1">
                  <div class="h-8 w-8 rounded-full b-1 b-white/30 flex items-center justify-center">
                    <Image
                      imageId={block.skillDefinitionId}
                      type="icon"
                      class="h-7 w-7"
                    />
                  </div>
                  <span class="text-#fff3e0/98 text-3">
                    {`${assetsManager.getNameSync(block.skillDefinitionId)}`}
                  </span>
                </div>
              </div>

            </>,
        },
        summary: renderSummary(block.children),
      };
      break;
    }
    case "triggered":{
      result = {
        type: block.type,
        opp: opp(block.who),
        title: "触发效果",
        imageId: block.masterOrCallerDefinitionId,
        energyChange:
          extractBlockEnergyProps(
            {
              characterDefinitionId: block.masterOrCallerDefinitionId,
              children: block.children
            },
            0, // 可填写maxEnergy
          ),
        content: {
          opp: opp(block.who),
          imageId: block.masterOrCallerDefinitionId,
          name: assetsManager.getNameSync(block.masterOrCallerDefinitionId),
          content:
            block.callerOrSkillDefinitionId === block.masterOrCallerDefinitionId
              ? (
                <>
                  <div>
                    <CardDescriptionPart cardDefinitionId={block.masterOrCallerDefinitionId} />
                  </div>
                </>
              ) : (
                <>
                  <div class="flex flex-col gap-1">
                    <div class="text-3 text-#d4bc8e">
                      {`触发效果`}
                    </div>
                    <div class="flex flex-row items-center gap-1">
                      <div class="h-8 w-8 rounded-full b-1 b-white/30 flex items-center justify-center">
                        <Image
                          imageId={block.callerOrSkillDefinitionId}
                          type="icon"
                          class="h-7 w-7"
                        />
                      </div>
                      <span class="text-#fff3e0/98 text-3">
                        {`${assetsManager.getNameSync(block.callerOrSkillDefinitionId)}`}
                      </span>
                    </div>
                  </div>
                </>),
        },
        summary: renderSummary(block.children),
      };
      break;
    }
    case "playingCard":{
      result = {
        type: block.type,
        opp: opp(block.who),
        title: `${subject(opp(block.who))}打出手牌`,
        imageId: block.cardDefinitionId,
        energyChange: undefined,
        content: {
          opp: opp(block.who),
          imageId: block.cardDefinitionId,
          name: assetsManager.getNameSync(block.cardDefinitionId),
          content:
            <>
              <div>
                <CardDescriptionPart cardDefinitionId={block.cardDefinitionId} />
              </div>
            </>
        },
        summary: renderSummary(block.children),
      };
      break;
    }
    case "selectCard":{
      result = {
        type: block.type,
        opp: opp(block.who),
        title: `${subject(opp(block.who))}执行挑选`,
        imageId: opp(block.who) ? undefined : block.cardDefinitionId,
        energyChange: undefined,
        content: {
          opp: opp(block.who),
          imageId: opp(block.who) ? undefined : block.cardDefinitionId,
          name: opp(block.who) ? undefined : assetsManager.getNameSync(block.cardDefinitionId),
          content:
            <>
              <span class="text-3 text-#d4bc8e">
                {`${subject(opp(block.who))}`}
              </span>
              <span class="text-3 text-#d4bc8e">
                {`触发挑选效果`}
              </span>
            </>
        },
        summary: renderSummary(block.children),
      };
      break;
    }
    case "elementalTunning":{
      result = {
        type: block.type,
        opp: opp(block.who),
        title: `${subject(opp(block.who))}进行「元素调和」`,
        imageId: opp(block.who) ? undefined : block.cardDefinitionId,
        energyChange: undefined,
        content: {
          opp: opp(block.who),
          imageId: opp(block.who) ? undefined : block.cardDefinitionId,
          name: opp(block.who) ? undefined : assetsManager.getNameSync(block.cardDefinitionId),
          content:
            opp(block.who)
              ? (
                <>
                  <span>
                    {`???`}
                  </span>
                </>
              ) : (
                <>
                  <div>
                    <CardDescriptionPart cardDefinitionId={block.cardDefinitionId} />
                  </div>
                </>)
        },
        summary: renderSummary(block.children),
      };
      break;
    }
    default:{
      result = {
        type: "playingCard",
        opp: false,
        title: "",
        imageId: undefined,
        energyChange: undefined,
        content: {
          opp: false,
          imageId: undefined,
          name: undefined,
          content: <></>,
        },
        summary: [],
      };
      break;
    }
  }
  return result;
};

function HistoryChildBox(props: { data: renderHistoryChildProps }) {
  return (
    <div class="w-full h-11 flex flex-row shrink-0 bg-white/4 gap-2 justify-center">
      <div 
      class="w-1 h-full shrink-0 bg-#806440 data-[opp]:bg-#48678b"
      bool:data-opp={props.data.opp}
      />
      <div class="w-5 h-full shrink-0 items-center justify-center flex">
        <Switch>
          <Match when={props.data.imageId === undefined}>
            <div class="w-5 h-8.6 bg-gray-600 rounded-0.75 b-gray-700 b-1 shrink-0"/>
          </Match>
          <Match when={props.data.imageId === "tuning"}>
            <div class="w-5 h-5">
              <TunningIcon />
            </div>
          </Match>
          <Match when={true}>
            <Image
              imageId={props.data.imageId as number}
              type={props.data.imageType}
              class="w-5 h-auto rounded-0.75"
            />
          </Match>
        </Switch>
      </div>
      <div class="w-full h-full flex flex-col justify-center gap-1">
        <div class="flex flex-row gap-1">
          <div class="text-2.8 text-white/95 text-stroke-0.2 text-stroke-op-70">
            {props.data.title}
          </div>
          <Show when={props.data.healthChange}>
            {(healthChange) => (
              <div 
                class="h-4 px-3 min-w-12 flex flex-row items-center justify-center text-white text-3 rounded-full b-1 b-black bg-#d14f51 data-[increase]:bg-#6e9b3a"
                bool:data-increase={healthChange().type==="heal"}
              >
                <Show when={healthChange().special}>
                  <div class="h-5 w-5 flex-shrink-0 -translate-x-1">
                    <Switch>
                      <Match when={healthChange().type==="heal"}>
                        <RevivePreviewIcon class="h-5 w-5" />
                      </Match>
                      <Match when={healthChange().type==="damage"}>
                        <DefeatedPreviewIcon class="h-5 w-5" />
                      </Match>
                    </Switch>
                  </div>  
                </Show>
                <StrokedText 
                  text={`${healthChange().type==="heal" ? "+" : "-"}${healthChange().value}`} 
                  strokeWidth={1.5} 
                  strokeColor="black"
                />
              </div>
            )}
          </Show>
        </div>
        <div class="flex flex-row text-2.5 text-#b2afa8 font-bold">
          {props.data.content}
        </div>
      </div>
    </div>
  );
}

function More() {
  return(
    <img
      class="h-3 w-3"
      // TODO: replace this with an API endpoint
      src="https://assets.gi-tcg.guyutongxue.site/assets/UI_Gcg_Buff_Common_More.webp"
    />
  );
}

function HistorySummaryShot(props: { data: SummaryShot }) {
  return (
    <div class="h-24 flex flex-col">
      <div class="h-3 w-10.5 flex flex-row items-center justify-center">
        <Switch>
          <Match when={props.data.aura === "more"}>
            <More />
          </Match>
          <Match when={props.data.aura !== undefined}>
            <For each={props.data.aura as DamageType[]}>
              {(damageType) => (
                <Image
                  imageId={damageType}
                  class="h-3 w-3"
                />                
              )}
            </For>
          </Match>
        </Switch>
      </div>
      <div 
      class="h-18 relative"
      style={{width: `${2.375 + props.data.cardface.length * 0.25}rem`}}
      >
        <Switch>
          <Match when={props.data.size==="normal"}>
            <For each={props.data.cardface.reverse()}>
              {(imageId, index)=>(
                <div 
                  class="absolute w-10.5 h-18 top-50% -translate-y-50%"
                  style={{
                    right: `${index() * 0.25}rem`,
                  }}
                >
                  <CardFace definitionId={imageId} />
                </div>
              )}
            </For>
          </Match>
          <Match when={props.data.size==="summon"}>
            <For each={props.data.cardface.reverse()}>
              {(imageId, index)=>(
                <div 
                  class="absolute w-10.5 h-12.375 rounded-1 b-#ded4c4 b-1.5 overflow-hidden top-50% -translate-y-50%"
                  style={{
                    right: `${index() * 0.25}rem`,
                  }}
                >
                  <Image
                    imageId={imageId}
                    class="absolute w-10.5 h-18 top-50% -translate-y-50%"
                  />
                </div>
              )}
            </For>
          </Match>
        </Switch>
        <div class="h-8 w-8 absolute top-50% left-5.25 -translate-x-50% -translate-y-50%">
          <Switch>
            <Match when={props.data.inner==="switch"}>
              <SwitchActiveIcon class="h-full w-full"/>
            </Match>
            <Match when={props.data.inner==="defeated"}>
              <DefeatedPreviewIcon class="h-full w-full"/>
            </Match>
          </Switch>
        </div>
        <div class="h-4 w-12 absolute top-50% left-5.25 -translate-x-50% -translate-y-50%">
          <Switch>
            <Match when={props.data.inner==="damage"}>
              <div class="h-4 w-12 flex items-center justify-center text-white text-3 rounded-full b-1 b-black bg-#d14f51">
                <StrokedText 
                  text={props.data.innerValue === "more" ? "···" : `${props.data.innerValue}`} 
                  strokeWidth={1.5} 
                  strokeColor="black"
                />
              </div>
            </Match>
            <Match when={props.data.inner==="heal"}>
              <div class="h-4 w-12 flex items-center justify-center text-white text-3 rounded-full b-1 b-black bg-#6e9b3a">
                <StrokedText 
                  text={props.data.innerValue === "more" ? "···" : `+${props.data.innerValue}`} 
                  strokeWidth={1.5} 
                  strokeColor="black"
                />
              </div>
            </Match>
          </Switch>
        </div>
        <div class="absolute bottom-0.5 left-0.5 h-3 w-9.5 flex flex-row items-center">
          <Switch>
            <Match when={props.data.status === "more"}>
              <More />
            </Match>
            <Match when={props.data.status !== undefined}>
              <For each={props.data.status as number[]}>
                {(status) => (
                  <Image
                    imageId={status}
                    type="icon"
                    class="h-3 w-3"
                  />                
                )}
              </For>
            </Match>
          </Switch>
        </div>
      </div>
      <div class="h-3 w-10.5 flex flex-row items-center">
        <Switch>
          <Match when={props.data.combat === "more"}>
            <More />
          </Match>
          <Match when={props.data.combat !== undefined}>
            <For each={props.data.combat as number[]}>
              {(combat) => (
                <Image
                  imageId={combat}
                  type="icon"
                  class="h-3 w-3"
                />                
              )}
            </For>
          </Match>
        </Switch>
      </div>
    </div>
  );
}

function HistoryBlockBox(
  props: { 
    data: renderHistoryBlockProps, 
    isSelected: boolean;
    onClick: () => void;
  }) {
  const blockStyle = () => {
    if (props.isSelected && props.data.opp) return "block-opp-selected";
    if (props.isSelected && !props.data.opp) return "block-my-selected";
    if (!props.isSelected && props.data.opp) return "block-opp-normal";
    return "block-my-normal";
  };
  return (
    <div
      class={`w-full h-30 flex flex-col rounded-0.6 shrink-0 cursor-pointer ${blockStyle()} bg-[var(--bg-color)] border-[var(--bd-color)] b-1.5`}
      onClick={() => props.onClick()}
    >
      <div class="w-full h-6 bg-[var(--title-color)] rounded-t-0.6 flex items-center">
        <div 
          class="text-#e5aa5f data-[opp]:text-#7eb5ff text-2.8 font-bold ml-1.5"
          bool:data-opp={props.data.opp}
        >
          {props.data.title}
        </div>        
      </div>
      <div class="flex flex-row items-center justify-center h-24 gap-1.5">
        <div class="h-24 flex flex-col">
          <div class="h-3"/>
          <div class="w-10.5 h-18 relative">
            <Show 
              when={props.data.imageId}
              fallback={
                <div class="w-10.5 h-18 bg-gray-600 rounded-1.5 b-gray-700 b-2 shrink-0"/>
              }
            >
              {(imageId) => ( 
                <div class="relative w-10.5 h-18">
                  <CardFace definitionId={imageId()} />
                </div>
              )}
            </Show>
            <div class="h-8 w-8 absolute top-50% left-50% -translate-x-50% -translate-y-50%">
              <Switch>
                <Match when={props.data.type==="switchActive"}>
                  <SwitchActiveIcon class="h-full w-full"/>
                </Match>
                <Match when={props.data.type==="triggered"}>
                  <SwitchActiveIcon class="h-full w-full"/>
                </Match>
                <Match when={props.data.type==="elementalTunning"}>
                  <TunningIcon class="h-full w-full"/>
                </Match>
              </Switch>              
            </div>
          </div>
          <div class="h-3"/>
        </div>
        <Show when={props.data.summary.length}>
          <div class="h-24 w-4 flex items-center justify-center font-bold text-white text-5 text-stroke-1">→</div>
          <For each={props.data.summary.slice(0, 3)}>
            {(summary) => (
              <HistorySummaryShot data={summary} />
            )}
          </For>
          <Show when={props.data.summary.length > 3}>
            <div class="h-24 w-4 flex items-center justify-center font-bold text-4 text-white/60 text-3">···</div>
          </Show>
        </Show>
      </div>
    </div>
  );
}

function HistoryHintBox(props: { data: renderHistoryHintProps }) {
  return (
    <Switch>
      <Match when={props.data.type === "changePhase"}>
        <div class="w-full h-6 text-center bg-#212933 rounded-0.5 shrink-0 flex  items-center justify-center">
          <div class="text-#b1ada8 text-3.2 font-bold">
            {props.data.content}
          </div>
        </div>
      </Match>
      <Match when={props.data.type === "action"}>
        <div 
          class="w-full h-6 text-center bg-#885e2e data-[opp]:bg-#3e69a8 rounded-0.5 shrink-0 flex  items-center justify-center"
          bool:data-opp={props.data.opp}
        >
          <div 
            class="text-#efb264 data-[opp]:text-#9bc6ff text-3.2 font-bold"
            bool:data-opp={props.data.opp}
          >
            {props.data.content}
          </div>
        </div>
      </Match>
    </Switch>
  );
}

export interface HistoryPanelProps {
  who: 0 | 1;
  history: HistoryBlock[];
}

export interface HistoryToggleButtonProps {
  onClick?: () => void;
}

export function HistoryToggleButton(props: HistoryToggleButtonProps) {
  return (
    <button
      class="h-8 w-8 flex items-center justify-center rounded-full b-yellow-800 b-1 bg-yellow-50 hover:bg-yellow-100 active:bg-yellow-200 text-yellow-800 transition-colors line-height-none cursor-pointer"
      onClick={() => {
        props.onClick?.();
      }}
    >
      &#8801;
    </button>
  );
}

export function HistoryPanel(props: HistoryPanelProps) {
  const [selectedBlock, setSelectedBlock] = createSignal<HistoryBlock | null>(null);
  const [showBackToBottom, setShowBackToBottom] = createSignal(false);
  let scrollRef: HTMLDivElement | undefined;

  const scrollToBottom = () => {
    scrollRef?.scrollTo({ top: scrollRef.scrollHeight, behavior: "smooth" });
  };

  const handleScroll = () => {
    if (!scrollRef) return;
    const distance = scrollRef.scrollHeight - scrollRef.scrollTop - scrollRef.clientHeight;
    setShowBackToBottom(distance > 100);
  };

  const who = () => props.who;

  createEffect(
    () => {
      scrollToBottom();
    },
  );

  return (
    <WhoContext.Provider value={who}>
      <div class="fixed inset-0 z-0" onClick={() => setSelectedBlock(null)} />
      <div class="fixed right-0 top-0 bottom-0 w-70 shadow-lg bg-[linear-gradient(to_bottom,_#2f333bff_30%,_#2f333bdd_100%)]">
        <div class="w-full h-12"/>
        <div
          class="h-[calc(100%-4.5rem)] overflow-y-auto py-2 pl-2 pr-1.2 space-y-1.5 relative flex flex-col history-scrollbar history-scrollbar-simply"
          ref={el => (scrollRef = el)}
          onScroll={handleScroll}
        >
          <For each={props.history}>
            {(block, index) =>
              <Switch>
                <Match when={block.type === "changePhase" || block.type === "action"}>
                  <HistoryHintBox data={renderHistoryHint(block as HistoryHintBlock)} />
                </Match>
                <Match when={true}>
                  <HistoryBlockBox
                    data={renderHistoryBlock(block as HistoryDetailBlock)}
                    isSelected={selectedBlock() === block}
                    onClick={() => {
                      if (block.type !== "changePhase" && block.type !== "action")
                        setSelectedBlock(block);
                    }}
                  />
                </Match>
              </Switch>
            }
          </For>
        </div>
        <Show when={showBackToBottom()}>
          <button
            class="absolute w-66 h-6 bottom-3 right-2 bg-#e9e2d3 opacity-80 text-#3b4255 text-3 font-bold rounded-full hover:bg-#e9e2d3 hover:shadow-[inset_0_0_16px_rgba(216,212,204,1),0_0_8px_rgba(255,255,255,0.2)] hover:b-white hover:b-2 hover:opacity-100"
            onClick={scrollToBottom}
          >
            跳转至最新
          </button>
        </Show>
        <Show when={selectedBlock()}>
          {(block) =>
            <div class="fixed right-70 inset-0 z--0.1" onClick={() => setSelectedBlock(null)}>
              <HistoryBlockDetailPanel
                block={block() as HistoryDetailBlock}
                onClose={() => setSelectedBlock(null)}
              />
            </div>
          }
        </Show>
      </div>
    </WhoContext.Provider>
  );
}

function HistoryBlockDetailPanel(props: { block: HistoryDetailBlock; onClose: () => void }) {
  let panelRef: HTMLDivElement | undefined;
  const blockDescription = () => renderHistoryBlock(props.block).content;
  return (
    <div
      class={`fixed right-71 w-90 p-3 max-h-120 bg-#2f333b/98 b-#404a56 b-1 rounded-1 shadow-xl overflow-hidden
      top-1/2 -translate-y-1/2`}
      onClick={e => e.stopPropagation()}
    >
      <div ref={el => (panelRef = el)} class="overflow-y-auto max-h-114 history-scrollbar history-scrollbar-simply">
        <div class="relative w-full min-h-22 bg-#2d333a rounded-t-1.5 flex flex-row b-2 b-white/4">
          <div 
            class="absolute top-1px left-1px w-3.5 h-3.5 rounded-lt-1 bg-#806440 data-[opp]:bg-#48678b history-card-hint"
            bool:data-opp={blockDescription().opp}
          />
          <div class="w-14.5 h-22 p-2">
            <Show 
              when={blockDescription().imageId}
              fallback={
                <div class="w-10.5 h-18 bg-gray-600 rounded-1.5 b-gray-700 b-2 shrink-0"/>
              }
            >
              {(imageId) => ( 
                <div class="relative w-10.5 h-18">
                  <CardFace definitionId={imageId()} />
                </div>
              )}
            </Show>
          </div>
          <div class="w-full min-h-22 py-1.5 pr-2 flex flex-col">
            <div class="text-3.5 text-#fff3e0/98 font-bold">
              {blockDescription().name ? blockDescription().name : "???"}
            </div>
            <div class="flex text-2.5 text-#b2afa8 font-bold">
              {blockDescription().content}
            </div>
          </div>
        </div>
        <div class="space-y-0.5">
          <For each={(props.block as HistoryDetailBlock).children}>
            {(child) =>
              <HistoryChildBox
                data={renderHistoryChild(child)}
              />}
          </For>
        </div>
      </div>
    </div>
  );
}
