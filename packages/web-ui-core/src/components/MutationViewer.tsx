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
  flattenPbOneof,
  PbExposedMutation,
  PbRemoveCardReason,
  PbSkillType,
  type ExposedMutation,
  type PbReactionType,
} from "@gi-tcg/typings";
import { createEffect, createSignal, For, on, Show } from "solid-js";
import { useUiContext } from "../hooks/context";

// TODO: we need a better UI for this

const mutationText = (
  who: 0 | 1,
  m: ExposedMutation,
  assetsManager: AssetsManager,
) => {
  let result = "";
  const whoText = (argWho: number) => (argWho === who ? "我方" : "对方");
  const typeSpellArray = [
    "物理",
    "冰",
    "水",
    "火",
    "雷",
    "风",
    "岩",
    "草",
    "穿透",
    "治疗",
  ];
  const phaseSpellArray = [
    "初始化手牌",
    "初始化出战角色",
    "掷骰",
    "行动",
    "结束",
    "游戏终止",
  ];
  const reactionText = (reactionType: PbReactionType) => {
    const reactionTypeDict: Record<number, string> = {
      101: "融化",
      102: "蒸发",
      103: "超载",
      104: "超导",
      105: "感电",
      106: "冻结",
      107: "冰扩散",
      108: "水扩散",
      109: "火扩散",
      110: "雷扩散",
      111: "冰结晶",
      112: "水结晶",
      113: "火结晶",
      114: "雷结晶",
      115: "燃烧",
      116: "绽放",
      117: "激化",
    };
    return reactionTypeDict[reactionType];
  };
  const createCardTargetText = (target: number) => {
    // TODO: 目前没有给对手创建牌的情况, 未来可能会有
    switch (target) {
      case 0:
        return "手牌";
      case 1:
        return "牌堆";
      default:
        return "不知道哪";
    }
  };
  if (m.$case === "skillUsed") {
    if (m.skillType === PbSkillType.TRIGGERED) {
      result = `${whoText(m.who)} ${assetsManager.getNameSync(
        m.callerDefinitionId,
      )} 触发`;
    } else {
      result = `${whoText(m.who)} ${assetsManager.getNameSync(
        m.callerDefinitionId,
      )} 使用 ${assetsManager.getNameSync(m.skillDefinitionId)}`;
    }
  } else if (m.$case === "damage") {
    result = `${assetsManager.getNameSync(m.targetDefinitionId)} 受到 ${
      m.value
    } 点 \
          ${typeSpellArray[m.damageType]} ${m.damageType === 9 ? "" : "伤害"}`;
  } else if (m.$case === "stepRound") {
    result = `回合开始`;
  } else if (m.$case === "changePhase") {
    result = `进入 ${phaseSpellArray[m.newPhase]} 阶段`;
  } else if (m.$case === "resetDice") {
    result = `${whoText(m.who)} 现在有 ${m.dice.length} 个骰子`;
  } else if (m.$case === "switchTurn") {
    result = `切换行动方`;
  } else if (m.$case === "switchActive") {
    result = `${whoText(m.who)} 切换出战角色至 ${assetsManager.getNameSync(
      m.characterDefinitionId,
    )}`;
  } else if (m.$case === "createCard") {
    result = `${whoText(m.who)} 将一张 ${
      assetsManager.getNameSync(m.card!.definitionId) ?? "行动牌"
    } 置入了 ${createCardTargetText(m.to)}`;
  } else if (m.$case === "removeCard") {
    switch (m.reason) {
      case PbRemoveCardReason.PLAY:
        result = `${whoText(m.who)} 打出了 ${
          assetsManager.getNameSync(m.card!.definitionId) ?? "一张行动牌"
        }`;
        break;
      case PbRemoveCardReason.ELEMENTAL_TUNING:
        result = `${whoText(m.who)} 调和了 一张卡牌`;
        break;
      case PbRemoveCardReason.HANDS_OVERFLOW:
        result = `${whoText(m.who)} 手牌已满 弃置了一张卡牌`;
        break;
      case PbRemoveCardReason.DISPOSED:
        result = `${whoText(m.who)} 弃置了一张卡牌`;
        break;
      case PbRemoveCardReason.PLAY_NO_EFFECT:
        result = `${whoText(m.who)} 被裁了 一张卡牌`;
        break;
    }
  } else if (m.$case === "transferCard") {
    if (m.from === 1 && m.to === 0 && !m.transferToOpp) {
      result = `${whoText(m.who)} 抽了一张 ${
        assetsManager.getNameSync(m.card!.definitionId) ?? "行动牌"
      }`;
    } else {
      result = `${whoText(m.who)} 将一张 ${
        assetsManager.getNameSync(m.card!.definitionId) ?? "行动牌"
      } 从 ${createCardTargetText(m.from)} 移动到 ${
        m.transferToOpp ? "对方的" : ""
      }${createCardTargetText(m.to)}`;
    }
  } else if (m.$case === "createEntity") {
    result = `${assetsManager.getNameSync(m.entity!.definitionId)} 创建了`;
  } else if (m.$case === "removeEntity") {
    result = `${assetsManager.getNameSync(m.entity!.definitionId)} 移除了`;
  } else if (m.$case === "elementalReaction") {
    result = `${assetsManager.getNameSync(
      m.characterDefinitionId,
    )} 上触发了元素反应 ${reactionText(m.reactionType)}`;
  }
  return result;
};

interface MutationEntryProps {
  who: 0 | 1;
  mutation: PbExposedMutation;
}

function MutationEntry(props: MutationEntryProps) {
  const { assetsManager } = useUiContext();
  return (
    <Show
      when={mutationText(
        props.who,
        flattenPbOneof(props.mutation.mutation!),
        assetsManager,
      )}
    >
      {(text) => <li class="list-disc ml-4">{text()}</li>}
    </Show>
  );
}

interface MutationBlockProps {
  who: 0 | 1;
  mutations: PbExposedMutation[];
}

export function MutationBlock(props: MutationBlockProps) {
  return (
    <ul class="flex flex-col bg-yellow-100">
      <For each={props.mutations}>
        {(m) => <MutationEntry who={props.who} mutation={m} />}
      </For>
    </ul>
  );
}

export interface MutationViewerProps {
  who: 0 | 1;
  mutations: PbExposedMutation[][];
}

export function MutationViewer(props: MutationViewerProps) {
  const [shown, setShown] = createSignal(false);
  let scrollRef!: HTMLDivElement;
  createEffect(
    on(
      () => props.mutations,
      () => {
        scrollRef.scrollTo(0, scrollRef.scrollHeight);
      },
    ),
  );
  return (
    <>
      <div
        class="hidden data-[shown]:block absolute right-0 top-0 py-12 px-2 w-60 h-full overflow-auto pointer-events-none "
        bool:data-shown={shown()}
        ref={scrollRef}
      >
        <div class="pointer-events-auto h-full w-full flex flex-col gap-1">
          <For each={props.mutations}>
            {(group) => <MutationBlock who={props.who} mutations={group} />}
          </For>
        </div>
      </div>
      <button
        class="absolute right-22 top-2 h-8 w-8 flex items-center justify-center rounded-full b-yellow-800 b-1 bg-yellow-50 hover:bg-yellow-100 active:bg-yellow-200 text-yellow-800 transition-colors line-height-none cursor-pointer"
        onClick={() => setShown((v) => !v)}
      >
        &#8801;
      </button>
    </>
  );
}
