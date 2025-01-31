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
  PbCardArea,
  PbCardState,
  type PbExposedMutation,
  type RemoveCardEM,
  type TransferCardEM,
} from "@gi-tcg/typings";
import type { AnimatingCardInfo } from "./components/Chessboard";

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

export function parseMutations(mutations: PbExposedMutation[]) {
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
      }
    }
  }
  return { animatingCards };
}
