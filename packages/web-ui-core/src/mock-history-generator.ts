/* mock-history-generator.ts
 * 随机生成 HistoryBlock[] 用于前端测试
 */

import type {
    CardSummary,
    CharacterSummary,
    HistoryBlock,
    HistoryChildren,
    HistoryChildrenSummary,
    CharacterHistoryChildren,
    CardHistoryChildren,
    CreateEntityHistoryChild,
    RemoveEntityHistoryChild,
} from "./history";

import {
    Aura,
    DamageType,
    DiceType,
    Reaction,
} from "@gi-tcg/typings";

/* ---------- 通用随机工具 ---------- */
const rand = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T>(arr: readonly T[]): T =>
    arr[Math.floor(Math.random() * arr.length)];

/* ---------- 占位枚举池：按需替换 ---------- */
const auraPool = Object.values(Aura);
const damageTypePool = Object.values(DamageType);
const reactionPool = Object.values(Reaction);
const diceTypePool = Object.values(DiceType);
const skillIdPool = [11052, 11103, 12042, 12093, 13032, 13083, 14022, 14073, 15012, 15063, 16052, 16103, 17042, 17093, 21022, 22023, 23022, 24023, 25022, 26023, 27022];
const characterIdPool = [1105, 1110, 1204, 1209, 1303, 1308, 1402, 1407, 1501, 1506, 1605, 1610, 1704, 1709, 2102, 2202, 2302, 2402, 2502, 2602, 2702];
const cardIdPool = [321015, 211011, 331804, 332045, 332042, 331802, 332006, 332042, 223041, 223041, 226031, 226031, 312009, 312009, 312010, 312010, 313002, 313002, 321002, 321004, 321017, 321017, 322008, 322012, 322012, 322025, 332004, 332004, 332006, 332032, 332032, 332041, 332041];
const entityIdPool = [301104, 121013, 127033, 117091, 117094, 117092];

/* ---------- HistoryChildren 生成 ---------- */
function genChild(): HistoryChildren {
    const childFactories: (() => HistoryChildren)[] = [
        () => ({
            type: "switchActive",
            who: rand(0, 1) as 0 | 1,
            characterDefinitionId: pick(characterIdPool),
            isOverloaded: Math.random() < 0.3,
        }),
        () => ({
            type: "triggered",
            who: rand(0, 1) as 0 | 1,
            effectDefinitionId: pick(entityIdPool),
        }),
        () => ({
            type: "createEntity",
            who: rand(0, 1) as 0 | 1,
            entityType: pick(["combatStatus", "status", "equipment", "summon"] as const),
            characterDefinitionId: pick(characterIdPool),
            entityDefinitionId: pick([116102, 112142]),
        }),
        () => ({
            type: "removeEntity",
            who: rand(0, 1) as 0 | 1,
            entityType: pick(["combatStatus", "status", "equipment", "summon", "support"] as const),
            characterDefinitionId: pick(characterIdPool),
            entityDefinitionId: pick([116102, 112142]),
        }),
        () => ({
            type: "damage",
            who: rand(0, 1) as 0 | 1,
            characterDefinitionId: pick(characterIdPool),
            oldAura: pick(auraPool),
            newAura: pick(auraPool),
            damageType: pick(damageTypePool),
            damageValue: rand(1, 8),
            oldHealth: rand(1, 10),
            newHealth: rand(0, 10),
            reaction: Math.random() < 0.4 ? pick(reactionPool) : undefined,
            causeDefeated: Math.random() < 0.2,
        }),
        () => ({
            type: "apply",
            who: rand(0, 1) as 0 | 1,
            characterDefinitionId: pick(characterIdPool),
            oldAura: pick(auraPool),
            newAura: pick(auraPool),
            elementType: pick(damageTypePool),
            reaction: Math.random() < 0.4 ? pick(reactionPool) : undefined,
        }),
        () => ({
            type: "heal",
            who: rand(0, 1) as 0 | 1,
            characterDefinitionId: pick(characterIdPool),
            healValue: rand(1, 5),
            oldHealth: rand(1, 10),
            newHealth: rand(1, 10),
            healType: pick(["normal", "revive", "immuneDefeated"] as const),
        }),
        () => ({
            type: "energy",
            who: rand(0, 1) as 0 | 1,
            characterDefinitionId: pick(characterIdPool),
            energyValue: rand(1, 5),
            oldEnergy: rand(1, 10),
            newEnergy: rand(1, 10),
            how: pick(["gain", "loss"] as const),
        }),
        () => ({
            type: "drawCard",
            who: rand(0, 1) as 0 | 1,
            callerDefinitionId: pick(cardIdPool),
            drawCardsCount: rand(1, 4),
        }),
        () => ({
            type: "stealHand",
            who: rand(0, 1) as 0 | 1,
            cardDefinitionId: pick(cardIdPool),
        }),
        () => ({
            type: "disposeCard",
            who: rand(0, 1) as 0 | 1,
            cardDefinitionId: pick(cardIdPool),
        }),
        () => ({
            type: "forbidCard",
            who: rand(0, 1) as 0 | 1,
            cardDefinitionId: pick(cardIdPool),
        }),
        () => ({
            type: "createCard",
            who: rand(0, 1) as 0 | 1,
            cardDefinitionId: pick(cardIdPool),
            target: pick(["pile", "hands"] as const),
        }),
        () => ({
            type: "transform",
            who: rand(0, 1) as 0 | 1,
            cardDefinitionId: pick([...characterIdPool, ...cardIdPool]),
            stage: pick(["old", "new"] as const),
        }),
        () => ({
            type: "generateDice",
            who: rand(0, 1) as 0 | 1,
            callerDefinitionId: pick([...characterIdPool, ...cardIdPool]),
            diceType: pick(diceTypePool),
            diceCount: rand(1, 3),
        }),
        () => ({
            type: "convertDice",
            who: rand(0, 1) as 0 | 1,
            callerDefinitionId: pick([...characterIdPool, ...cardIdPool]),
            isTunning: Math.random() < 0.5,
            diceType: pick(diceTypePool),
        }),
        () => ({
            type: "variableChange",
            who: rand(0, 1) as 0 | 1,
            cardDefinitionId: pick([...entityIdPool, ...cardIdPool]),
            variableName: pick(["round", "usage"] as const),
            oldValue: rand(0, 5),
            newValue: rand(0, 5),
        }),
    ];

    return pick(childFactories)();
}

/* ---------- Summary 生成 ---------- */
function isCharacterEvent(c: HistoryChildren): c is CharacterHistoryChildren {
  if (
    c.type === "switchActive" ||
    c.type === "damage" ||
    c.type === "heal" ||
    c.type === "apply"
  ) {
    return true;
  }

  if (c.type === "createEntity") {
    const t = (c as CreateEntityHistoryChild).entityType;
    return t === "status" || t === "combatStatus";
  }

  return false;
}

function isCardEvent(c: HistoryChildren): c is CardHistoryChildren {
  if (c.type === "disposeCard") return true;

  if (c.type === "createEntity") {
    return (c as CreateEntityHistoryChild).entityType === "summon";
  }

  if (c.type === "removeEntity") {
    const t = (c as RemoveEntityHistoryChild).entityType;
    return t === "summon" || t === "support";
  }

  return false;
}

function buildSummary(children: HistoryChildren[]): HistoryChildrenSummary {
    const charMap = new Map<number, CharacterSummary>();
    const cardMap = new Map<number, CardSummary>();

    children.forEach((c) => {
        if (isCharacterEvent(c)) {
            const charId = c.characterDefinitionId;
            if (!charMap.has(charId)) {
                charMap.set(charId, {
                    characterDefinitionId: charId,
                    healthChange: 0,
                    children: [],
                });
            }
            const summary = charMap.get(charId)!;
            summary.children.push(c as CharacterHistoryChildren);

            if (c.type === "damage" || c.type === "heal") {
                const delta = (c.newHealth ?? 0) - (c.oldHealth ?? 0);
                summary.healthChange += delta;
            }
        }

        if (isCardEvent(c)) {
            const cardId = c.cardDefinitionId;
            if (!cardMap.has(cardId)) {
                cardMap.set(cardId, {
                    cardDefinitionId: cardId,
                    children: [],
                });
            }
            cardMap.get(cardId)!.children.push(c as CardHistoryChildren);
        }
    });
    return {
        characterSummary: Array.from(charMap.values()),
        cardSummary: Array.from(cardMap.values()),
    };
}

/* ---------- HistoryBlock 生成 ---------- */
function genBlock(): HistoryBlock {
    const blockFactories: (() => HistoryBlock)[] = [
        () => ({
            type: "changePhase",
            roundNumber: rand(1, 14),
            newPhase: pick(["initHands", "initActives", "action", "end"] as const),
        }),
        () => ({
            type: "action",
            who: rand(0, 1) as 0 | 1,
            actionType: pick(["other", "declareEnd"] as const),
        }),
        () => {
            const children = Array.from(
                { length: rand(0, 12) },
                () => genChild()
            );
            return {
                type: "switchActive",
                who: rand(0, 1) as 0 | 1,
                characterDefinitionId: pick(characterIdPool),
                how: pick(["init", "switch", "select"] as const),
                children: children,
                summary: buildSummary(children),
            };
        },
        () => {
            const children = Array.from(
                { length: rand(0, 12) },
                () => genChild()
            );
            return {
                type: "useSkill",
                who: rand(0, 1) as 0 | 1,
                skillDefinitionId: pick(skillIdPool),
                callerDefinitionId: pick([...characterIdPool, ...cardIdPool]),
                skillType: pick(["normal", "elemental", "burst", "technique"] as const),
                children: children,
                summary: buildSummary(children),
            };
        },
        () => {
            const children = Array.from(
                { length: rand(0, 12) },
                () => genChild()
            );
            return {
                type: "playingCard",
                who: rand(0, 1) as 0 | 1,
                cardDefinitionId: pick(cardIdPool),
                children: children,
                summary: buildSummary(children),
            };
        },
        () => {
            const children = Array.from(
                { length: rand(0, 12) },
                () => genChild()
            );
            return {
                type: "elementalTunning",
                who: rand(0, 1) as 0 | 1,
                cardDefinitionId: pick(cardIdPool),
                children: children,
                summary: buildSummary(children),
            };
        },
        () => {
            const children = Array.from(
                { length: rand(0, 12) },
                () => genChild()
            );
            const card = pick(cardIdPool);
            return {
                type: "triggered",
                who: rand(0, 1) as 0 | 1,
                callerDefinitionId: card,
                effectDefinitionId: card,
                children: children,
                summary: buildSummary(children),
            };
        },
        () => {
            const children = Array.from(
                { length: rand(0, 12) },
                () => genChild()
            );
            const card = pick(cardIdPool);
            return {
                type: "triggered",
                who: rand(0, 1) as 0 | 1,
                callerDefinitionId: pick([...characterIdPool]),
                effectDefinitionId: pick([...entityIdPool, ...skillIdPool]),
                children: children,
                summary: buildSummary(children),
            };
        },
        () => {
            const children = Array.from(
                { length: rand(0, 12) },
                () => genChild()
            );
            return {
                type: "selectCard",
                who: rand(0, 1) as 0 | 1,
                cardDefinitionId: pick(cardIdPool),
                children: children,
                summary: buildSummary(children),
            };
        },
    ];

    return pick(blockFactories)();
}

/* ---------- 主导出函数 ---------- */
export function generateHistoryBlocks(
    blockCount = 30
): HistoryBlock[] {
    return Array.from({ length: blockCount }, () => genBlock());
}

/* ---------- demo ---------- */
import { writeFileSync } from "fs";

if (import.meta.main) {
    const data = generateHistoryBlocks(50);
    writeFileSync("mock-history.json", JSON.stringify(data, null, 2));
    console.log("mock-history.json 已生成");
}