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
  CreateCardEM,
  PbCardArea,
  RemoveCardEM,
  TransferCardEM,
  type ExposedMutation,
  type PbCardState,
  type PbGameState,
} from "@gi-tcg/typings";

export interface ParseMutationResultEntry {
  state: PbGameState;
  showingCardIds: number[];
  transitioningCardIds: number[];
}

const CARD_AREA_PROP_MAP = {
  [PbCardArea.CARD_AREA_HAND]: "handCard",
  [PbCardArea.CARD_AREA_PILE]: "pileCard",
} as const;

type CardRelatedMutations =
  | {
      type: "create";
      data: CreateCardEM[];
    }
  | {
      type: "transfer";
      data: TransferCardEM[];
    }
  | {
      type: "remove";
      data: RemoveCardEM[];
    };

function selectAndGroupCardRelatedMutations(mutations: ExposedMutation[]) {
  const result: CardRelatedMutations[] = [];
  let current: CardRelatedMutations | undefined;
  for (const m of mutations) {
    if (m.createCard) {
      if (!current || current.type !== "create") {
        current = {
          type: "create",
          data: [],
        };
        result.push(current);
      }
      current.data.push(m.createCard);
    } else if (m.transferCard) {
      if (!current || current.type !== "transfer") {
        current = {
          type: "transfer",
          data: [],
        };
        result.push(current);
      }
      current.data.push(m.transferCard);
    } else if (m.removeCard) {
      if (!current || current.type !== "remove") {
        current = {
          type: "remove",
          data: [],
        };
        result.push(current);
      }
      current.data.push(m.removeCard);
    }
  }
  return result;
}

export function parseMutations(
  oldState: PbGameState,
  newState: PbGameState,
  mutations: ExposedMutation[],
) {
  const result: ParseMutationResultEntry[] = [];
  const currentState = structuredClone(oldState);

  const cardRelatedMutations = selectAndGroupCardRelatedMutations(mutations);

  for (const { type, data } of cardRelatedMutations) {
    if (type === "transfer") {
      const showingCardIds: number[] = [];
      const transitioningCardIds: number[] = [];
      for (const {
        cardId,
        cardDefinitionId,
        who,
        transferToOpp,
        from,
        to,
        targetIndex,
      } of data) {
        const fromProp = CARD_AREA_PROP_MAP[from];
        const toProp = CARD_AREA_PROP_MAP[to];
        const targetWho = transferToOpp ? (who === 0 ? 1 : 0) : who;
        const sourceCards = currentState.player[who][fromProp];
        const targetCards = currentState.player[targetWho][toProp];
        const index = sourceCards.findIndex((c) => c.id === cardId);
        if (index === -1) {
          continue;
        }
        const card = {
          ...sourceCards[index],
          definitionId: cardDefinitionId,
        };
        sourceCards.splice(index, 1);
        console.log({ targetCards })
        targetCards.splice(targetIndex ?? targetCards.length, 0, card);
        if (card.definitionId !== 0) {
          showingCardIds.push(card.id);
        }
        transitioningCardIds.push(card.id);
      }
      result.push(
        {
          state: structuredClone(currentState),
          showingCardIds,
          transitioningCardIds: [],
        },
        {
          state: structuredClone(currentState),
          showingCardIds: [],
          transitioningCardIds,
        },
      );
    } else if (type === "create") {
      const showingCardIds: number[] = [];
      const transitioningCardIds: number[] = [];
      for (const { cardId, cardDefinitionId, who, to, targetIndex } of data) {
        const prop = CARD_AREA_PROP_MAP[to];
        const cards = currentState.player[who][prop];
        cards.splice(targetIndex ?? cards.length, 0, {
          id: cardId,
          definitionId: cardDefinitionId,
          definitionCost: [], // TODO: FIX ME
          descriptionDictionary: {},
        });
        if (cardDefinitionId !== 0) {
          showingCardIds.push(cardId);
        }
        transitioningCardIds.push(cardId);
      }
      result.push(
        {
          state: structuredClone(currentState),
          showingCardIds,
          transitioningCardIds: [],
        },
        {
          state: structuredClone(currentState),
          showingCardIds,
          transitioningCardIds,
        },
      );
    } else if (type === "remove") {
      const showingCardIds: number[] = [];
      const transitioningCardIds: number[] = [];
      for (const { cardId, who, from } of data) {
        const prop = CARD_AREA_PROP_MAP[from];
        const cards = currentState.player[who][prop];
        const index = cards.findIndex((c) => c.id === cardId);
        if (index === -1) {
          continue;
        }
        const card = cards[index];
        cards.splice(index, 1);
        if (card.definitionId !== 0) {
          showingCardIds.push(card.id);
        }
        transitioningCardIds.push(card.id);
      }
      result.push(
        {
          state: structuredClone(currentState),
          showingCardIds,
          transitioningCardIds: [],
        },
        {
          state: structuredClone(currentState),
          showingCardIds,
          transitioningCardIds,
        },
      );
    }
  }
  result.push({
    state: newState,
    showingCardIds: [],
    transitioningCardIds: [],
  });
  return result;
}
