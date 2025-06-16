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
  const energyDirectionTextMap: Record<string, string> = {
    gain: "获得",
    loss: "消耗",
  };

  const renderReaction = (reaction: Reaction, apply: DamageType) => {
    const { element, name } = reactionTextMap[reaction];
    const base = element.find((e) => e !== apply)! as DamageType;
    return (
      <>
        <span>{`（`}</span>
        <Image
          imageId={base}
          class="h-3 w-3"
        />
        <Image
          imageId={apply}
          class="h-3 w-3"
        />
        <span>
          {`${name}`}
        </span>
        <span>{`）`}</span>
      </>
    );
  };

  switch (child.type) {
    case "switchActive":
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
    case "triggered":
      result = {
        opp: opp(child.who),
        imageId: child.effectDefinitionId,
        imageType: undefined,
        title: assetsManager.getNameSync(child.effectDefinitionId),
        content:
          <>
            <span>
              {`触发效果`}
            </span>
          </>,
      };
      break;
    case "drawCard":
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
    case "stealHand":
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
    case "createEntity":
      if (child.entityType === "status" || child.entityType === "equipment") {
        result = {
          opp: opp(child.who),
          imageId: child.characterDefinitionId,
          imageType: "cardFace",
          title: child.characterDefinitionId ? assetsManager.getNameSync(child.characterDefinitionId) : "???",
          content:
            <>
              <span>
                {`${createEntityTextMap[child.entityType]}`}
              </span>
              <Image
                imageId={child.entityDefinitionId}
                type="icon"
                class="h-3 w-3"
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
    case "generateDice":
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
            <DiceIcon
              size={12}
              type={child.diceType}
              selected={false}
            />
            <span>
              {`${diceTypeTextMap[child.diceType]}`}
            </span>
          </>,
      };
      break;
    case "createCard":
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
    case "damage":
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
                class="h-3 w-3"
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
    case "heal":
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
    case "apply":
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
              class="h-3 w-3"
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
    case "energy":
      result = {
        opp: opp(child.who),
        imageId: child.characterDefinitionId,
        imageType: "cardFace",
        title: assetsManager.getNameSync(child.characterDefinitionId),
        content:
          <>
            <span>
              {`${energyDirectionTextMap[child.how]}`}
            </span>
            <span>
              {`${child.energyValue}点充能`}
            </span>
            <span>
              {`，充能值${child.oldEnergy}→${child.newEnergy}`}
            </span>
          </>,
      };
      break;
    case "disposeCard":
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
    case "variableChange":
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
    case "removeEntity":
      if (child.entityType === "status" || child.entityType === "equipment") {
        result = {
          opp: opp(child.who),
          imageId: child.characterDefinitionId,
          imageType: "cardFace",
          title: child.characterDefinitionId ? assetsManager.getNameSync(child.characterDefinitionId) : "???",
          content:
            <>
              <span>
                {`${removeEntityTextMap[child.entityType]}`}
              </span>
              <Image
                imageId={child.entityDefinitionId}
                type="icon"
                class="h-3 w-3"
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
    case "convertDice":
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
            <DiceIcon
              size={12}
              type={child.diceType}
              selected={false}
            />
            <span>
              {`${diceTypeTextMap[child.diceType]}`}
            </span>
          </>,
      };
      break;
    case "forbidCard":
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
    case "transform":
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
    default:
      result = {
        opp: false,
        imageId: undefined,
        imageType: undefined,
        title: "",
        content: <></>,
      };
      break;
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
    case "changePhase":
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
    case "action":
      switch (block.actionType) {
        case "other":
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
        summary = getOrCreateCharacterSummary(charMap, { characterDefinitionId: c.characterDefinitionId!, who: c.who });
        summary.children.push(c as Extract<CreateEntityHistoryChild, { entityType: "state" }>);
        summary.status.push(c.entityDefinitionId);
      } else if (c.entityType === "combatStatus") {
        summary = getOrCreateCharacterSummary(charMap, { characterDefinitionId: -1, who: c.who });
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
  status: number | "more" | undefined;
  combat: number | "more" | undefined;
}

function renderSummary(children: HistoryChildren[]): SummaryShot[] {
  const { characterSummary, cardSummary } = buildSummary(children);
  type shotType = "damage" | "heal" | "apply" | "switch" | "status" | "combat" | "dispose" | "create" | "remove";
  const shotGroups: Record<shotType, (CharacterSummary | CardSummary)[]> = {
    damage: [] as CharacterSummary[],
    heal: [] as CharacterSummary[],
    apply: [] as CharacterSummary[],
    switch: [] as CharacterSummary[],
    status: [] as CharacterSummary[],
    combat: [] as CharacterSummary[],
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
      shotGroups.combat.push(c);
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
        : l[0].status.length === 1
          ? l[0].status[0]
          : "more"
      : l.some((c) => c.status.length)
        ? "more"
        : undefined;

  const summaryShot: SummaryShot[] = [];
  (Object.keys(shotGroups) as shotType[]).forEach((type) => {
    const list = shotGroups[type];
    if (!list.length) return;
    if (type === "combat") {
      if (summaryShot.length) {
        const combatMy = (list.find(c => c.who === 0) as CharacterSummary | null)?.combatStatus;
        const combatOpp = (list.find(c => c.who === 1) as CharacterSummary | null)?.combatStatus;
        const shotMy = summaryShot.find(s => s.who === 0);
        const shotOpp = summaryShot.find(s => s.who === 1);
        const shotBoth = summaryShot.find(s => s.who === "both");
        if (combatMy?.length) {
          const target = shotMy ?? shotBoth;
          if (target) {
            target.combat = combatMy.length === 1 ? combatMy[0] : "more";
          }
        }
        if (combatOpp?.length) {
          const target =
            shotOpp ??
            (shotBoth && shotBoth.combat === undefined ? shotBoth : undefined);

          if (target) {
            target.combat = combatOpp.length === 1 ? combatOpp[0] : "more";
          }
        }
      }
      return;
    }
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
      combat: undefined,
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
        {(data) => <p>{(data() as ActionCardRawData | EntityRawData).description}</p>}
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
    const energyValue = energyChildren.reduce((sum, c) => {
      return c.how === "gain" ? sum + c.energyValue : sum - c.energyValue;
    }, 0);
    return {
      oldEnergy: first.oldEnergy,
      newEnergy: last.newEnergy,
      energyValue,
      how: energyValue >= 0 ? "gain" : "loss",
      maxEnergy: maxEnergy,
    };
  }

  switch (block.type) {
    case "switchActive":
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
              <span>
                {`角色出战`}
              </span>
            </>,
        },
        summary: renderSummary(block.children),
      };
      break;
    case "useSkill":
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
              <div class="felx flex-col">
                <div>
                  {`${block.skillType === "technique" ? "使用特技" : "使用技能"}`}
                </div>
                <div class="felx flex-row">
                  <div class="h-4 w-4 rounded-full b-1 b-white/60 items-center justify-center">
                    <Image
                      imageId={block.skillDefinitionId}
                      type="icon"
                      class="h-4 w-4"
                    />
                  </div>
                  <span>
                    {`${assetsManager.getNameSync(block.skillDefinitionId)}`}
                  </span>
                </div>
              </div>

            </>,
        },
        summary: renderSummary(block.children),
      };
      break;
    case "triggered":
      result = {
        type: block.type,
        opp: opp(block.who),
        title: "触发效果",
        imageId: block.callerDefinitionId,
        energyChange:
          extractBlockEnergyProps(
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
            block.effectDefinitionId === block.callerDefinitionId
              ? (
                <>
                  <div>
                    <CardDescriptionPart cardDefinitionId={block.callerDefinitionId} />
                  </div>
                </>
              ) : (
                <>
                  <div class="felx flex-col">
                    <div>
                      {`触发效果`}
                    </div>
                    <div class="felx flex-row">
                      <div class="h-4 w-4 rounded-full b-1 b-white/60 items-center justify-center">
                        <Image
                          imageId={block.effectDefinitionId}
                          type="icon"
                          class="h-4 w-4"
                        />
                      </div>
                      <span>
                        {`${assetsManager.getNameSync(block.effectDefinitionId)}`}
                      </span>
                    </div>
                  </div>
                </>),
        },
        summary: renderSummary(block.children),
      };
      break;
    case "playingCard":
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
    case "selectCard":
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
              <span>
                {`${subject(opp(block.who))}`}
              </span>
              <span>
                {`触发挑选效果`}
              </span>
            </>
        },
        summary: renderSummary(block.children),
      };
      break;
    case "elementalTunning":
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
    default:
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
  return result;
};



function HistoryChildBox(props: { data: renderHistoryChildProps }) {
  return (
    <div class="w-full h-10 flex flex-row shrink-0 bg-black/10 gap-1">
      <div 
      class="w-1 h-10 shrink-0 bg-#d9b48d data-[opp]:bg-#7e98cb"
      bool:data-opp={props.data.opp}
      />
      <div class="w-5 h-10 shrink-0 items-center justify-center flex">
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
      <div class="w-full h-10 flex flex-col justify-center">
        <div class="text-3">
          {props.data.title}
        </div>
        <div class="flex flex-row text-2.5">
          {props.data.content}
        </div>
      </div>
    </div>
  );
}

function HistoryBlockBox(props: { data: renderHistoryBlockProps, onClick: () => void }) {
  return (
    <div
      class="w-full h-30 bg-black/20 rounded-3 shrink-0"
      onClick={() => props.onClick()}
    >
      <div>
        {props.data.title}
      </div>
    </div>
  );
}

function HistoryHintBox(props: { data: renderHistoryHintProps }) {
  return (
    <div class="w-full h-5 text-center b-black b-1 rounded-3 shrink-0">
      <div>
        {props.data.content}
      </div>
    </div>
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
      <div class="fixed right-0 top-0 bottom-0 w-80 bg-white border-l shadow-lg">
        <div
          class="h-full overflow-y-auto py-12 px-2 space-y-2 relative flex flex-col"
          ref={el => (scrollRef = el)}
          onScroll={handleScroll}
        >
          <For each={props.history}>
            {(block) =>
              <Switch>
                <Match when={block.type === "changePhase" || block.type === "action"}>
                  <HistoryHintBox data={renderHistoryHint(block as HistoryHintBlock)} />
                </Match>
                <Match when={true}>
                  <HistoryBlockBox
                    data={renderHistoryBlock(block as HistoryDetailBlock)}
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
            class="absolute bottom-4 right-4 z-20 px-3 py-1 bg-blue-500 text-white rounded"
            onClick={scrollToBottom}
          >
            回到底部
          </button>
        </Show>
        <Show when={selectedBlock()}>
          {(block) =>
            <div class="fixed right-81 inset-0 z--0.1" onClick={() => setSelectedBlock(null)}>
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
  const blockDescription = () => renderHistoryBlock(props.block);

  return (
    <div
      class={`fixed right-81 w-80 max-h-120 bg-white border shadow-xl overflow-hidden
      top-1/2 -translate-y-1/2`}
      onClick={e => e.stopPropagation()}
    >
      <div ref={el => (panelRef = el)} class="overflow-y-auto max-h-116 p-4 space-y-2">
        <div class="">Block Detail</div>
        <div class="space-y-1">
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
