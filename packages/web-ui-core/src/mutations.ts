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
  Aura,
  type CreateCardEM,
  DamageType,
  PbCardArea,
  type PbExposedMutation,
  PbPhaseType,
  PbPlayerFlag,
  PbPlayerStatus,
  PbReactionType,
  PbRemoveCardReason,
  PbSkillType,
  Reaction,
  type RemoveCardEM,
  type TransferCardEM,
} from "@gi-tcg/typings";
import type {
  AnimatingCardInfo,
  DamageInfo,
  NotificationBoxInfo,
  PlayingCardInfo,
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

export interface RoundAndPhaseNotificationInfo {
  showRound: boolean;
  who: 0 | 1 | null;
  value: PbPhaseType | "action" | "declareEnd" | null;
}

export interface ParsedMutation {
  raw: PbExposedMutation[];
  roundAndPhase: RoundAndPhaseNotificationInfo;
  animatingCards: AnimatingCardInfo[];
  playingCard: PlayingCardInfo | null;
  damages: (DamageInfo | ReactionInfo)[];
  notificationBox: NotificationBoxInfo | null;
  enteringEntities: number[];
  triggeringEntities: number[];
  disposingEntities: number[];
}

export function parseMutations(mutations: PbExposedMutation[]): ParsedMutation {
  let playingCard: PlayingCardInfo | null = null;
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

  const damagesByTarget = new Map<number, (DamageInfo | ReactionInfo)[]>();
  let notificationBox: NotificationBoxInfo | null = null;
  let isAfterSkillMainDamage = false;
  const enteringEntities: number[] = [];
  const triggeringEntities: number[] = [];
  const disposingEntities: number[] = [];
  const roundAndPhase: RoundAndPhaseNotificationInfo = {
    showRound: false,
    who: null,
    value: null,
  };

  for (const { mutation } of mutations) {
    switch (mutation?.$case) {
      case "createCard":
      case "transferCard":
      case "removeCard": {
        const card = mutation.value.card!;
        let showing = card.definitionId !== 0;
        if (mutation.$case === "removeCard") {
          if (
            [
              PbRemoveCardReason.PLAY,
              PbRemoveCardReason.PLAY_NO_EFFECT,
            ].includes(mutation.value.reason)
          ) {
            playingCard = {
              who: mutation.value.who as 0 | 1,
              data: card,
              noEffect:
                mutation.value.reason === PbRemoveCardReason.PLAY_NO_EFFECT,
            };
            showing = false;
          }
        }
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
            showing,
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
      case "applyAura": {
        const targetId = mutation.value.targetId;
        if (mutation.value.reactionType !== PbReactionType.UNSPECIFIED) {
          if (!damagesByTarget.has(targetId)) {
            damagesByTarget.set(targetId, []);
          }
          const targetDamages = damagesByTarget.get(targetId)!;
          targetDamages.push({
            type: "reaction",
            reactionType: mutation.value.reactionType,
            base: mutation.value.oldAura as Aura,
            incoming: mutation.value.elementType as DamageType,
            targetId,
            delay: targetDamages.length,
          });
        }
        break;
      }
      case "damage": {
        const targetId = mutation.value.targetId;
        if (!damagesByTarget.has(targetId)) {
          damagesByTarget.set(targetId, []);
        }
        let reaction: ReactionInfo | null = null;
        if (mutation.value.reactionType !== PbReactionType.UNSPECIFIED) {
          reaction = {
            type: "reaction",
            reactionType: mutation.value.reactionType,
            targetId,
            base: mutation.value.oldAura as Aura,
            incoming: mutation.value.damageType as DamageType,
            delay: 0,
          };
        }
        const targetDamages = damagesByTarget.get(targetId)!;
        targetDamages.push({
          type: "damage",
          damageType: mutation.value.damageType as DamageType,
          value: mutation.value.value,
          sourceId: mutation.value.sourceId,
          targetId,
          isSkillMainDamage: mutation.value.isSkillMainDamage,
          isAfterSkillMainDamage,
          delay: targetDamages.length,
          reaction,
        });
        if (mutation.value.isSkillMainDamage) {
          isAfterSkillMainDamage = true;
        }
        break;
      }
      case "skillUsed": {
        triggeringEntities.push(mutation.value.callerId);
        if (mutation.value.skillType !== PbSkillType.TRIGGERED) {
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
        const id = mutation.value.entity!.id;
        if (disposingEntities.includes(id)) {
          disposingEntities.splice(disposingEntities.indexOf(id), 1);
        } else {
          enteringEntities.push(id);
        }
        break;
      }
      case "removeEntity": {
        const id = mutation.value.entity!.id;
        if (enteringEntities.includes(id)) {
          enteringEntities.splice(enteringEntities.indexOf(id), 1);
        } else {
          disposingEntities.push(id);
        }
        break;
      }
      case "playerStatusChange": {
        if (mutation.value.status === PbPlayerStatus.ACTING) {
          roundAndPhase.who = mutation.value.who as 0 | 1;
          roundAndPhase.value = "action";
        }
        break;
      }
      case "setPlayerFlag": {
        if (mutation.value.flagName === PbPlayerFlag.DECLARED_END) {
          roundAndPhase.who = mutation.value.who as 0 | 1;
          roundAndPhase.value = "declareEnd";
        }
        break;
      }
      case "stepRound": {
        roundAndPhase.showRound = true;
        break;
      }
      case "changePhase": {
        if (
          [PbPhaseType.ROLL, PbPhaseType.ACTION, PbPhaseType.END].includes(
            mutation.value.newPhase,
          )
        ) {
          roundAndPhase.value = mutation.value.newPhase;
        }
        break;
      }
    }
  }
  return {
    raw: mutations,
    roundAndPhase,
    playingCard,
    animatingCards,
    damages: damagesByTarget.values().toArray().flat(),
    notificationBox,
    enteringEntities,
    triggeringEntities,
    disposingEntities,
  };
}
