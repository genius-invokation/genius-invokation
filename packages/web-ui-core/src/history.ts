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

import { Aura, DamageType, DiceType, Reaction } from "@gi-tcg/typings";

export type HistoryBlock =
  | ChangePhaseHistoryBlock
  | ActionHistoryBlock
  | SwitchOrSelectActiveHistoryBlock
  | UseSkillHistoryBlock
  | TriggeredHistoryBlock
  | PlayCardHistoryBlock
  | ElementalTunningHistoryBlock
  | SelectCardHistoryBlock;

export type HistoryChildren =
  | SwitchActiveHistoryChild
  | TriggeredHistoryChild
  | DrawCardHistoryChild
  | StealHandHistoryChild
  | CreateEntityHistoryChild
  | GenerateDiceHistoryChild
  | CreateCardHistoryChild
  | DamageHistoryChild
  | HealHistoryChild
  | ApplyHistoryChild
  | EnergyHistoryChild
  | DisposeCardHistoryChild
  | VariableChangeHistoryChild
  | RemoveEntityHistoryChild
  | ConvertDiceHistoryChild
  | ForbidCardHistoryChild
  | TransformHistoryChild;

export type CharacterHistoryChildren =
  | SwitchActiveHistoryChild
  | Extract<CreateEntityHistoryChild, { entityType: "state" | "combatState" }>
  | DamageHistoryChild
  | HealHistoryChild
  | ApplyHistoryChild;

export type CardHistoryChildren =
  | Extract<CreateEntityHistoryChild, { entityType:"summon" }>
  | DisposeCardHistoryChild
  | Extract<RemoveEntityHistoryChild, { entityType: "summon" | "support" }>;

/////////////// block部分 ////////////////

// 游戏阶段和回合标记
// style采用灰底白字 居中
// text: "替换起始手牌" | "选择初始出战角色" | "回合N 开始" | "结束阶段"
export interface ChangePhaseHistoryBlock {
  type: "changePhase";
  roundNumber: number;
  newPhase: "initSwitchHands" | "initSwitchActive" | "action" | "end";
}

// 行动标记
// style采用实色填充 居中
// text: who + ("行动" | "宣布回合结束")
export interface ActionHistoryBlock {
  type: "action";
  who: 0 | 1;
  actionType: "other" | "declareEnd";
}

// 切换出战角色
// title: who + ("初始出战角色" | "切换角色" | "选择出战角色")
// image: characterCardface ^ SwitchActiveIcon + icon[->] + [###预览###]
// click_description: characterCardface <-> characterName \n "角色出战"
export interface SwitchOrSelectActiveHistoryBlock {
  type: "switchActive";
  who: 0 | 1;
  characterDefinitionId: number;
  how: "init" | "switch" | "select";
  children: HistoryChildren[];
  summary: HistoryChildrenSummary;
}

// 使用技能|特技
// title: who + ("使用技能" || "使用特技")
// image: callerCardface ^ energyChange? + icon[->] + [###预览###]
// click_description: callerCardface <-> callerName \n "使用技能" \n skillIcon + skillName
export interface UseSkillHistoryBlock {
  type: "useSkill";
  who: 0 | 1;
  skillDefinitionId: number;
  callerDefinitionId: number;
  skillType: "normal" | "elemental" | "burst" | "technique";
  children: HistoryChildren[];
  summary: HistoryChildrenSummary;
}

// 触发效果
// 貌似是一个listener的响应，被动技能、状态、特技、支援...都可以是触发效果
// 只有激愈水球在对方手中触发效果时显示为cardback???
// title: "触发效果"
// image: callerCardface ^ TriggerIcon + icon[->] + [###预览###]
// click_description: callerCardface <-> callerName \n {
// if effect has icon:
//    return ("触发效果" \n effectIcon + effectName);
// else:
//    return (callerDescription);
// }
export interface TriggeredHistoryBlock {
  type: "triggered";
  who: 0 | 1;
  callerDefinitionId: number;
  effectDefinitionId: number;
  children: HistoryChildren[];
  summary: HistoryChildrenSummary;
}

// 打出手牌
// title: who + "打出手牌"
// image: Cardface + icon[->] + [###预览###]
// click_description: Cardface <-> cardName \n cardDescription
export interface PlayCardHistoryBlock {
  type: "playingCard";
  who: 0 | 1;
  cardDefinitionId: number;
  children: HistoryChildren[];
  summary: HistoryChildrenSummary;
}

// 挑选结果
// title: who + "执行挑选"
// image: Cardface + icon[->] + [###预览###]
// click_description: {
// if my:
//   return (Cardface <-> cardName \n who + "触发挑选效果");
// else:
//   return (Cardback <-> "???" \n who + "触发挑选效果");
// }
export interface SelectCardHistoryBlock {
  type: "selectCard";
  who: 0 | 1;
  cardDefinitionId: number; // 被选择的牌
  children: HistoryChildren[];
  summary: HistoryChildrenSummary;
}

// 元素调和
// title: who + "进行「元素调和」"
// image: (Cardface || Cardback) ^ TuningIcon + icon[->] + [###预览###]
// click_description: {
// if my:
//   return (Cardface <-> cardName \n cardDescription);
// else:
//   return (Cardback <-> "???" \n "???");
// }
export interface ElementalTunningHistoryBlock {
  type: "elementalTunning";
  who: 0 | 1;
  cardDefinitionId: number;
  children: HistoryChildren[];
  summary: HistoryChildrenSummary;
}

/////////////// child部分 ////////////////

// 切换出战角色
// content: characterCardface <-> characterName \n "角色出战" + ("卡牌效果" || "超载")
export interface SwitchActiveHistoryChild {
  type: "switchActive";
  who: 0 | 1;
  characterDefinitionId: number;
  isOverloaded: boolean;
}

// 触发效果
// content: {effectCardface || effectIcon} <-> effectName \n "触发效果"
export interface TriggeredHistoryChild {
  type: "triggered";
  who: 0 | 1;
  effectDefinitionId: number;
}

// 抓牌
// content: {callerCardface || callerIcon} <-> callerName \n who + "抓N张牌"
export interface DrawCardHistoryChild {
  type: "drawCard";
  who: 0 | 1;
  callerDefinitionId: number;
  drawCardsCount: number;
}

// 偷牌
// 匿叶龙，以极限之名
// content: Cardface <-> cardrName \n who + "夺取" + !who + "手牌"
export interface StealHandHistoryChild {
  type: "stealHand";
  who: 0 | 1;
  cardDefinitionId: number; // 偷到的牌
}

// 附属状态|装备
// content: characterCardface <-> characterName \n ("附属状态:" || "附属装备:") + inline[propertyIcon] + propertyName
// 生成出战状态|召唤物
// 支援不显示
// content: {entityCardface || entityIcon} <-> entityName \n who + ("生成出战状态" || "生成召唤物")
export interface CreateEntityHistoryChild {
  type: "createEntity";
  who: 0 | 1;
  entityType: "combatStatus" | "status" | "equipment" | "summon";
  characterDefinitionId?: number;
  entityDefinitionId: number;
}

// 生成骰子
// content: {callerCardface || callerIcon} <-> callerName \n who + "生成${diceCount}个${diceType}"
export interface GenerateDiceHistoryChild {
  type: "generateDice";
  who: 0 | 1;
  callerDefinitionId: number;
  diceType: DiceType;
  diceCount: number;
}

// 生成卡牌|复制卡牌
// content: Cardface <-> cardName \n who + ("生成卡牌, 并将其置入牌库"|| "获得手牌")
export interface CreateCardHistoryChild {
  type: "createCard";
  who: 0 | 1;
  cardDefinitionId: number;
  target: "pile" | "hands";
}

// 受到伤害
// content: characterCardface <-> characterName + DamageIcon[+/-N] \n "受到${damageValue}点${damageType}${(inlineIcon[oldAura] + inlineIcon[damageType] + reactionName)?}, 生命值${oldHealth}→${newHealth}$" + ("" || ", 被击倒")
export interface DamageHistoryChild {
  type: "damage";
  who: 0 | 1;
  characterDefinitionId: number;
  oldAura: Aura; // 受到伤害前的元素附着
  newAura: Aura; // 受到伤害后的元素附着
  damageType: DamageType;
  damageValue: number;
  oldHealth: number;
  newHealth: number;
  reaction?: Reaction;
  causeDefeated: boolean;
}

// 受到治疗
// content: characterCardface <-> characterName + HealIcon[+/-N] \n ("" || "复苏, 并" || "角色免于被击倒并") + "受到${healValue}点治疗, 生命值${oldHealth}→${newHealth}"
export interface HealHistoryChild {
  type: "heal";
  who: 0 | 1;
  characterDefinitionId: number;
  healValue: number;
  oldHealth: number;
  newHealth: number;
  healType: "normal" | "revive" | "immuneDefeated"; // TODO
}

// 附着元素
// content: characterCardface <-> characterName \n "附着${damageType}${(inlineIcon[oldAura] + inlineIcon[elementType] + reactionName)?}"
export interface ApplyHistoryChild {
  type: "apply";
  who: 0 | 1;
  characterDefinitionId: number;
  oldAura: Aura; // 之前的元素附着
  newAura: Aura; // 之后的元素附着
  elementType: DamageType;
  reaction?: Reaction;
}

// 获得充能|消耗充能
// 被动减少也显示消耗
// content: characterCardface <-> characterName \n "(获得 || 消耗)${energyValue}点充能, 充能值${oldEnergy}→${newEnergy}"
export interface EnergyHistoryChild {
  type: "energy";
  who: 0 | 1;
  characterDefinitionId: number;
  energyValue: number;
  oldEnergy: number;
  newEnergy: number;
  how: "gain" | "loss";
}

// 舍弃
// content: Cardface <-> cardName \n who + "舍弃手牌"
export interface DisposeCardHistoryChild {
  type: "disposeCard";
  who: 0 | 1;
  cardDefinitionId: number;
}

// 变量改变
// 如卡牌、状态等的可用次数、计数器等
// content: {Cardface || Icon} <-> cardName \n "${variableName}: ${oldValue}→${newValue}"
export interface VariableChangeHistoryChild {
  type: "variableChange";
  who: 0 | 1;
  cardDefinitionId: number;
  variableName: string;
  oldValue: number;
  newValue: number;
}

// 弃置状态|装备
// content: characterCardface <-> characterName \n ("失去状态:" || "失去装备:") + inline[entityIcon] + entityName
// 弃置出战状态、召唤物、支援
// content: {entityCardface || entityIcon} <-> entityName \n ("出战状态消失" || "卡牌弃置")
export interface RemoveEntityHistoryChild {
  type: "removeEntity";
  who: 0 | 1;
  entityType: "combatStatus" | "status" | "equipment" | "summon" | "support";
  characterDefinitionId?: number; // 状态、装备：所属角色区
  entityDefinitionId: number;
}

// 元素调和|某些卡牌转化元素骰的效果
// content: (Cardface || cardIcon || TuningIcon) <-> (cardName || "元素调和") \n who + "将1个元素骰转换为inlineIcon[DiceType]${DiceType}"
export interface ConvertDiceHistoryChild {
  type: "convertDice";
  who: 0 | 1;
  callerDefinitionId?: number; // 某些卡牌转化元素骰的效果
  isTunning: boolean;
  diceType: DiceType;
}

// 裁定之时, 梅洛彼得堡
// content: Cardface <-> cardName \n "遭到反制，未能生效"
export interface ForbidCardHistoryChild {
    type: "forbidCard";
    who: 0 | 1;
    cardDefinitionId: number;
}

// 转换形态
// 角色、召唤物
// content: Cardface <-> cardName \n ("转换形态···" || "转换形态完成")
export interface TransformHistoryChild {
    type: "transform";
    who: 0 | 1;
    cardDefinitionId: number; // 对应新旧形态
    stage: "old" | "new";
}

/////////////// block如何对自己的child生成预览 ////////////////

// bolck预览渲染逻辑
// 遍历characterSummary
//    if 一个character的healthChange<0，就将其加入DamageList
//    elif 一个character的healthChange>0，就将其加入HealList
//    elif 一个character包含附着元素事件，就将其加入ElementList
//    elif 一个character包含切换角色事件，就将其加入SwitchList
//    else 将剩余角色加入StateList
// 遍历每个List
//    if List内只有一个角色
//      显示这个角色
//      如果有healthChange，显示healthChange
//      对于元素反应、状态、出战状态
//        如果有1个则直接显示，如果有多个则显示“···”
//    else List内有多个角色
//      显示第一个角色，其他折叠为牌堆
//      如果有healthChange，显示“···”
//      对于元素反应、状态
//        如果有则显示“···”
//      对于出战状态
//        如果有1个且List内角色阵营相同则直接显示，否则显示“···”
// 遍历cardSummary
//    if 仅含有DisposeCardHistoryChild，就将其加入DisposeList
//    elif 仅含有CreateEntityHistoryChild，就将其加入CreateList
//    elif 仅含有RemoveEntityHistoryChild:
//      if entityType="summon" 就将其加入RemoveList
//      elif entityType="support" 就将其加入DisposeList
// 遍历每个List
//    如果List内仅存在一个card则直接显示
//    如果List内存在多个card则显示第一个，其他折叠为牌堆
//    DisposeList为7:12, 其余为28:33
export interface HistoryChildrenSummary {
  characterSummary: CharacterSummary[];
  cardSummary: CardSummary[];
}
// 对于child事件
// 如果事件符合CharaterHistoryChildren类型及描述
// 如果不存在CharacterSummary的id为该角色，则创建对应的CharacterSummary并将事件加入其中
// 如果存在CharacterSummary的id为该角色，则将事件加入其中
// 计算伤害事件和治疗事件后角色最终的血量变化
export interface CharacterSummary {
  characterDefinitionId: number;
  healthChange: number;
  children: CharacterHistoryChildren[];
}
// 对于child事件
// 如果事件符合CardHistoryChildren类型及描述
// 如果不存在CardSummary的id为该卡牌，则创建对应的CardSummary并将事件加入其中
// 如果存在CardSummary的id为该卡牌，则将事件加入其中
export interface CardSummary {
  cardDefinitionId: number;
  children: CardHistoryChildren[];
}

/////////////// 用于生成赛后统计的全局记录量，我也不知道怎么实现 ////////////////

// 对两名玩家分别记录
// 如果发生了DamageHistoryChild，就对damageList.append(damageValue)
// 如果DamageHistoryChild含有reaction，就对reactionTimes +1
// 如果发生了ElementHistoryChild且含有reaction，就对reactionTimes +1
// 如果发生了HealHistoryChild，就对healList.append(healValue)
// 每回合重投后（我看现有的mutation可以记录这个）计算有效骰并validDiceCount.append()
// 如果发生了TuningHistoryBlock，就对tuningTimes +1
// 如果发生了DrawCardHistoryChild，就对drawCardsCount + drawCardsCount
export interface GlobalRecord {
  who: 0 | 1;
  damageList: number[];
  healList: number[];
  reactionTimes: number;
  validDiceCount: number[];
  tuningTimes: number;
  round: number;
  drawCardsCount: number;
}
