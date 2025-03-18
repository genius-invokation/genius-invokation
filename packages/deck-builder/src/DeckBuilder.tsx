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
  type JSX,
  createContext,
  splitProps,
  useContext,
  untrack,
  createSignal,
  createEffect,
} from "solid-js";
import { AllCards } from "./AllCards";
import { CurrentDeck } from "./CurrentDeck";
import type { Deck } from "@gi-tcg/utils";
import { v as ALL_VERSIONS } from "./data.json" /*  with { type: "json" } */;
import { createCardDataViewer } from "@gi-tcg/card-data-viewer";
import { DEFAULT_ASSETS_MANAGER, type AssetsManager } from "@gi-tcg/assets-manager";

export interface DeckBuilderProps extends JSX.HTMLAttributes<HTMLDivElement> {
  assetsManager?: AssetsManager;
  deck?: Deck;
  version?: string;
  onChangeDeck?: (deck: Deck) => void;
}

interface DeckBuilderContextValue {
  assetsManager: AssetsManager;
  showCard: (
    e: MouseEvent,
    type: "actionCard" | "character",
    id: number,
  ) => void;
}

const DeckBuilderContext = createContext<DeckBuilderContextValue>();

export const useDeckBuilderContext = () => useContext(DeckBuilderContext)!;

const EMPTY_DECK: Deck = {
  characters: [],
  cards: [],
};

export function DeckBuilder(props: DeckBuilderProps) {
  const [local, rest] = splitProps(props, ["assetsManager", "class"]);
  let container!: HTMLDivElement;

  const { CardDataViewer, showCard, showCharacter, hide } =
    createCardDataViewer({
      assetsManager: untrack(() => local.assetsManager),
    });
  const [cardDataViewerOffsetX, setCardDataViewerOffsetX] = createSignal(0);
  const [cardDataViewerOffsetY, setCardDataViewerOffsetY] = createSignal(0);

  const [version, setVersion] = createSignal(ALL_VERSIONS.length - 1);
  const versionSpecified = () =>
    !!props.version && ALL_VERSIONS.includes(props.version);

  createEffect(() => {
    if (versionSpecified()) {
      setVersion(ALL_VERSIONS.indexOf(props.version!));
    }
  });

  return (
    <DeckBuilderContext.Provider
      value={{
        assetsManager: untrack(() => local.assetsManager) ?? DEFAULT_ASSETS_MANAGER,
        showCard: (e, type, id) => {
          const rect = (e.target as HTMLElement).getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          // 当点击事件发生在靠近左侧位置时，在鼠标右下角显示；否则在左上角显示
          if (rect.left - containerRect.left < 320) {
            setCardDataViewerOffsetX(
              rect.left + rect.width / 2 - containerRect.left,
            );
            setCardDataViewerOffsetY(
              rect.top + rect.height / 2 - containerRect.top,
            );
          } else {
            setCardDataViewerOffsetX(0);
            setCardDataViewerOffsetY(0);
          }
          if (type === "actionCard") {
            showCard(id);
          } else {
            showCharacter(id);
          }
        },
      }}
    >
      <div class={`gi-tcg-deck-builder reset ${local.class}`} ref={container}>
        <div
          class="w-full h-full flex flex-row items-stretch gap-3 select-none"
          {...rest}
          onClick={() => hide()}
        >
          <AllCards
            version={version()}
            versionSpecified={versionSpecified()}
            deck={props.deck ?? EMPTY_DECK}
            onChangeDeck={props.onChangeDeck}
            onSetVersion={setVersion}
          />
          <div class="b-r-1 b-gray" />
          <div />
          <CurrentDeck
            version={version()}
            deck={props.deck ?? EMPTY_DECK}
            onChangeDeck={props.onChangeDeck}
          />
        </div>
        <div
          class="absolute right-0 bottom-0 pointer-events-none z-50"
          style={{
            left: `${cardDataViewerOffsetX()}px`,
            top: `${cardDataViewerOffsetY()}px`,
          }}
        >
          <CardDataViewer />
        </div>
      </div>
    </DeckBuilderContext.Provider>
  );
}
