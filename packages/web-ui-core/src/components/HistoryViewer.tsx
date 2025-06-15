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
  untrack
} from "solid-js";
import { useUiContext } from "../hooks/context";
import {
  type HistoryBlock,
  type HistoryChildren,
  type HistoryChildrenSummary,
  type HistoryDetailBlock,
  type HistoryHintBlock,
} from "../history";
import { Image } from "./Image";
import { DICE_COLOR, DiceIcon } from "./Dice";

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
  const createCardTextMap: Record<string, string> = {
    pile: "生成卡牌, 并将其置入牌库",
    hands: "获得手牌",
  };
  const TransformTextMap: Record<string, string> = {
    old: "转换形态···",
    new: "转换形态完成",
  };
  interface renderReactionProps {
    element: DamageType[];
    name: string;
  }
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
            <span style={{ color: `var(--c-${DICE_COLOR[child.damageType]})]` }}>
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
            <span style={{ color: `var(--c-${DICE_COLOR[child.elementType]})]` }}>
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
        case "initSwitchHands":
          result = {
            type: block.type,
            content: `替换起始手牌`,
          };
          break;
        case "initSwitchActive":
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

interface blockDetailProps {
  opp: boolean;
  imageId: number | undefined;
  name: string | undefined;
  content: JSX.Element;
}

interface renderHistoryBlockProps {
  type: "switchActive" | "useSkill" | "triggered" | "playingCard" | "selectCard" | "elementalTunning";
  opp: boolean;
  title: string;
  imageId: number | undefined;
  content: blockDetailProps;
  summary: HistoryChildrenSummary;
}

const renderHistoryBlock = (
  block: HistoryDetailBlock,
) => {
  const who = useWho();
  const { assetsManager } = useUiContext();
  let result: renderHistoryBlockProps;
  const opp = (historyOwner: 0 | 1) => (historyOwner !== who());
  const subject = (opp: boolean) => (opp ? "对方" : "我方");

  switch (block.type) {
    default:
      result = {
        type: block.type,
        opp: opp(block.who),
        title: block.type,
        imageId: undefined,
        content: {
          opp: opp(block.who),
          imageId: undefined,
          name: undefined,
          content: <></>,
        },
        summary: block.summary,
      };
      break;
  }

  return result;
};

function HistoryChildBox(props: { data: renderHistoryChildProps }) {
  return (
    <div class="w-full h-10 flex flex-col shrink-0 bg-black/10">
      <div>
        {props.data.title}
      </div>
      <div class="flex flex-row">
        {props.data.content}
      </div>
    </div>
  );
}

export function HistoryBlockBox(props: { data: renderHistoryBlockProps, onClick: () => void }) {
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
    <div class="w-full h-10 text-center b-black b-1 rounded-3 shrink-0">
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
                block={block()}
                onClose={() => setSelectedBlock(null)}
              />
            </div>
          }
        </Show>
      </div>
    </WhoContext.Provider>
  );
}

function HistoryBlockDetailPanel(props: { block: HistoryBlock; onClose: () => void }) {
  let panelRef: HTMLDivElement | undefined;

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
