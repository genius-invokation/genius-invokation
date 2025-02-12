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

import {
  type CreateCardEM,
  DamageType,
  PbCardArea,
  type PbExposedMutation,
  PbSkillType,
  Reaction,
  type RemoveCardEM,
  type TransferCardEM,
} from "@gi-tcg/typings";
import type {
  AnimatingCardInfo,
  DamageInfo,
  NotificationBoxInfo,
  ReactionInfo,
} from "./components/Chessboard";

export type CardDestination = `${"pile" | "hand"}${0 | 1}`;
function getCardArea(
  verb: "from" | "to",
  mut: CreateCardEM | TransferCardEM | RemoveCardEM,
): CardDestination | null {
  const area =
    verb === "from" && verb in mut
      ? mut[verb]
      : verb === "to" && verb in mut
        ? mut[verb]
        : null;
  const who = mut.who as 0 | 1;
  if (area === PbCardArea.HAND) {
    return `hand${who}`;
  } else if (area === PbCardArea.PILE) {
    return `pile${who}`;
  } else {
    return null;
  }
}

interface AnimatingCardWithDestination extends AnimatingCardInfo {
  destination: CardDestination | null;
}

export interface ParsedMutation {
  animatingCards: AnimatingCardInfo[];
  damages: DamageInfo[];
  reactions: ReactionInfo[];
  notificationBox: NotificationBoxInfo | null;
  enteringEntities: number[];
  disposingEntities: number[];
}

export function parseMutations(mutations: PbExposedMutation[]): ParsedMutation {
  const animatingCards: AnimatingCardWithDestination[] = [];
  // 保证同一刻的同一卡牌区域的进出方向一致（要么全进要么全出）
  // 如果新的卡牌动画的 from 和之前的进出方向相反，则新的卡牌动画延迟一刻
  // to 部分同理
  const cardAreaState = new Map<
    CardDestination,
    {
      direction: "in" | "out";
      delay: number;
    }
  >();

  const damagesByTarget = new Map<number, DamageInfo[]>();
  const reactionsByTarget = new Map<number, ReactionInfo[]>();
  let notificationBox: NotificationBoxInfo | null = null;
  const enteringEntities: number[] = [];
  const disposingEntities: number[] = [];

  for (const { mutation } of mutations) {
    switch (mutation?.$case) {
      case "createCard":
      case "transferCard":
      case "removeCard": {
        const card = mutation.value.card!;
        const source = getCardArea("from", mutation.value);
        const destination = getCardArea("to", mutation.value);

        const current = animatingCards.find((x) => x.data.id === card.id);
        if (current) {
          current.destination = destination;
        } else {
          const sourceState = source ? cardAreaState.get(source) : void 0;
          const destinationState = destination
            ? cardAreaState.get(destination)
            : void 0;
          const sourceDelay = sourceState
            ? sourceState.delay + +(sourceState.direction === "in")
            : 0;
          const destinationDelay = destinationState
            ? destinationState.delay + +(destinationState.direction === "out")
            : 0;
          animatingCards.push({
            data: card,
            destination,
            delay: Math.max(sourceDelay, destinationDelay),
          });
          if (source) {
            cardAreaState.set(source, {
              direction: "out",
              delay: sourceDelay,
            });
          }
          if (destination) {
            cardAreaState.set(destination, {
              direction: "in",
              delay: destinationDelay,
            });
          }
        }
        break;
      }
      case "elementalReaction": {
        const targetId = mutation.value.characterId;
        if (!reactionsByTarget.has(targetId)) {
          reactionsByTarget.set(targetId, []);
        }
        const targetReactions = reactionsByTarget.get(targetId)!;
        targetReactions.push({
          reactionType: mutation.value.reactionType as Reaction,
          targetId,
          delay: targetReactions.length,
        });
        break;
      }
      case "damage": {
        const targetId = mutation.value.targetId;
        if (!damagesByTarget.has(targetId)) {
          damagesByTarget.set(targetId, []);
        }
        const targetDamages = damagesByTarget.get(targetId)!;
        targetDamages.push({
          damageType: mutation.value.damageType as DamageType,
          value: mutation.value.value,
          sourceId: mutation.value.sourceId,
          targetId,
          isSkillMainDamage: mutation.value.isSkillMainDamage,
          delay: targetDamages.length,
        });
        break;
      }
      case "skillUsed": {
        if (mutation.value.skillType === PbSkillType.TRIGGERED) {
          // TODO: triggered
        } else {
          notificationBox = {
            type: "useSkill",
            who: mutation.value.who as 0 | 1,
            characterDefinitionId: mutation.value.callerDefinitionId,
            skillDefinitionId: mutation.value.skillDefinitionId,
            skillType: mutation.value.skillType,
          };
        }
        break;
      }
      case "switchActive": {
        notificationBox = {
          type: "switchActive",
          who: mutation.value.who as 0 | 1,
          characterDefinitionId: mutation.value.characterDefinitionId,
          skillDefinitionId: mutation.value.viaSkillDefinitionId,
          skillType:
            mutation.value.viaSkillDefinitionId === Reaction.Overloaded
              ? "overloaded"
              : null,
        };
        break;
      }
      case "createEntity": {
        enteringEntities.push(mutation.value.entity!.id);
        break;
      }
      case "removeEntity": {
        disposingEntities.push(mutation.value.entity!.id);
        break;
      }
    }
  }
  return {
    animatingCards,
    damages: damagesByTarget.values().toArray().flat(),
    reactions: reactionsByTarget.values().toArray().flat(),
    notificationBox,
    enteringEntities,
    disposingEntities,
  };
}
