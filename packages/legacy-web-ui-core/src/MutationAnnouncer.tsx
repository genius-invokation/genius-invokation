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

import {
  ComponentProps,
  createEffect,
  For,
  splitProps,
  untrack,
} from "solid-js";
import { usePlayerContext } from "./Chessboard";
import {
  flattenPbOneof,
  PbRemoveCardReason,
  PbSkillType,
  type ExposedMutation,
  type PbExposedMutation,
  type PbGameState,
  type PbReactionType,
} from "@gi-tcg/typings";
import { createStore } from "solid-js/store";

export interface MutationAnnouncerProps extends ComponentProps<"div"> {
  state: PbGameState;
  mutations?: readonly PbExposedMutation[];
  who: 0 | 1;
}

export function MutationAnnouncer(props: MutationAnnouncerProps) {
  const { assetsManager } = usePlayerContext();
  const [local, restProps] = splitProps(props, ["state", "mutations", "who"]);

  const getSpells = () =>
    local.mutations?.map((m) =>
      spellMutation(flattenPbOneof(m.mutation!), local.who, local.state, (s) =>
        assetsManager.getNameSync(s),
      ),
    );
  const [mutationHintTexts, setMutationHintTexts] = createStore<string[]>([]);
  createEffect(() => {
    if (typeof local.mutations === "undefined") return;
    const newSpells = untrack(getSpells);
    newSpells &&
      setMutationHintTexts((txts) => {
        const availableSpells = newSpells.filter((s) => s !== "");
        return [...txts, ...availableSpells];
      });
  });

  let scrollRef!: HTMLDivElement;
  createEffect(() => {
    if (mutationHintTexts.length > 0) {
      scrollRef.scrollTo(0, scrollRef.scrollHeight + 40);
    }
  });
  return (
    <div {...restProps} ref={scrollRef}>
      喋喋不休的解说员：
      <ul>
        <For each={mutationHintTexts}>{(txt) => <li>{txt}</li>}</For>
      </ul>
    </div>
  );
}

const spellMutation = (
  m: ExposedMutation,
  who: 0 | 1,
  state: PbGameState,
  altTextFunc: (definitionId: number) => string | undefined,
): string => {
  let spell = "";
  const spellWho = (argWho: number) => (argWho === who ? "我方" : "对方");
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
  const spellReactionType = (reactionType: PbReactionType) => {
    const reactionTypeDict: Record<number, string> = {
      101: "融化",
      102: "蒸发",
      103: "超载",
      104: "超导",
      105: "感电",
      106: "冻结",
      107: "扩散冰",
      108: "扩散水",
      109: "扩散火",
      110: "扩散雷",
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
  const spellCreateCardTarget = (target: number) => {
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
      spell = `${spellWho(m.who)} ${altTextFunc(m.callerDefinitionId)} 触发`;
    } else {
      spell = `${spellWho(m.who)} ${altTextFunc(
        m.callerDefinitionId,
      )} 使用 ${altTextFunc(m.skillDefinitionId)}`;
    }
  } else if (m.$case === "damage") {
    spell = `${altTextFunc(m.targetDefinitionId)} 受到 ${m.value} 点 \
          ${typeSpellArray[m.damageType]} ${m.damageType === 9 ? "" : "伤害"}`;
  } else if (m.$case === "stepRound") {
    spell = `回合开始`;
  } else if (m.$case === "changePhase") {
    spell = `进入 ${phaseSpellArray[m.newPhase]} 阶段`;
  } else if (m.$case === "resetDice") {
    spell = `${spellWho(m.who)} 现在有 ${m.dice.length} 个骰子`;
  } else if (m.$case === "switchTurn") {
    spell = `切换行动方`;
  } else if (m.$case === "switchActive") {
    spell = `${spellWho(m.who)} 切换出战角色至 ${altTextFunc(
      m.characterDefinitionId,
    )}`;
  } else if (m.$case === "createCard") {
    // 跳过开局发牌的解说
    if (state.phase !== 0) {
      spell = `${spellWho(m.who)} 将一张 ${
        altTextFunc(m.card!.definitionId) ?? "行动牌"
      } 置入了 ${spellCreateCardTarget(m.to)}`;
    }
  } else if (m.$case === "removeCard") {
    switch (m.reason) {
      case PbRemoveCardReason.PLAY:
        spell = `${spellWho(m.who)} 打出了 ${
          altTextFunc(m.card!.definitionId) ?? "一张行动牌"
        }`;
        break;
      case PbRemoveCardReason.ELEMENTAL_TUNING:
        spell = `${spellWho(m.who)} 调和了 一张卡牌`;
        break;
      case PbRemoveCardReason.HANDS_OVERFLOW:
        spell = `${spellWho(m.who)} 手牌已满 弃置了一张卡牌`;
        break;
      case PbRemoveCardReason.DISPOSED:
        spell = `${spellWho(m.who)} 弃置了一张卡牌`;
        break;
      case PbRemoveCardReason.PLAY_NO_EFFECT:
        spell = `${spellWho(m.who)} 被裁了 一张卡牌`;
        break;
    }
  } else if (m.$case === "transferCard") {
    if (state.phase !== 0) {
      if (m.from === 1 && m.to === 0 && !m.transferToOpp) {
        spell = `${spellWho(m.who)} 抽了一张 ${
          altTextFunc(m.card!.definitionId) ?? "行动牌"
        }`;
      } else {
        spell = `${spellWho(m.who)} 将一张 ${
          altTextFunc(m.card!.definitionId) ?? "行动牌"
        } 从 ${spellCreateCardTarget(m.from)} 移动到 ${
          m.transferToOpp ? "对方的" : ""
        }${spellCreateCardTarget(m.to)}`;
      }
    }
  } else if (m.$case === "createEntity") {
    spell = `${altTextFunc(m.entity!.definitionId)} 创建了`;
  } else if (m.$case === "removeEntity") {
    spell = `${altTextFunc(m.entity!.definitionId)} 移除了`;
  } else if (m.$case === "elementalReaction") {
    spell = `${altTextFunc(
      m.characterDefinitionId,
    )} 上触发了元素反应 ${spellReactionType(m.reactionType)}`;
  }
  return spell;
};
