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

import { createMemo, createSignal, Show, splitProps } from "solid-js";
import type { ChessboardProps, SkillInfo } from "./Chessboard";
import { DicePanel } from "./DicePanel";
import {
  PlayCardAction,
  type DiceType,
  type PbCardState,
} from "@gi-tcg/typings";
import { Key } from "@solid-primitives/keyed";
import { Card } from "./Card";
import { useUiContext } from "../hooks/context";
import type {
  ActionStep,
  ClickSkillButtonActionStep,
  PlayCardActionStep,
} from "../action";
import { SkillButtonGroup } from "./SkillButtonGroup";
import { MiniView } from "./MiniSpecialView";

export const OPP_CARD_CLICK_EVENT_NAME = "gi-tcg-opp-card-click";
export const OPP_CARD_BLUR_EVENT_NAME = "gi-tcg-opp-card-blur";

declare global {
  interface GlobalEventHandlersEventMap {
    [OPP_CARD_CLICK_EVENT_NAME]: CustomEvent<PbCardState>;
    [OPP_CARD_BLUR_EVENT_NAME]: CustomEvent<void>;
  }
}

export function OppChessboard(props: ChessboardProps) {
  const { assetsManager } = useUiContext();
  const [localProps, elProps] = splitProps(props, [
    "who",
    "rotation",
    "autoHeight",
    "timer",
    "myPlayerInfo",
    "oppPlayerInfo",
    "gameEndExtra",
    "data",
    "actionState",
    "history",
    "viewType",
    "selectCardCandidates",
    "doingRpc",
    "onStepActionState",
    "onRerollDice",
    "onSwitchHands",
    "onSelectCard",
    "onGiveUp",
    "class",
    "children",
  ]);
  const dice = createMemo(() => props.data.state.player[props.who].dice);
  const hands = createMemo(() => props.data.state.player[props.who].handCard);
  const handOffset = createMemo(() => 10);
  const findSkillStep = (
    steps: ActionStep[],
    id: SkillInfo["id"],
  ): ClickSkillButtonActionStep | null => {
    return (
      steps.find(
        (s): s is ClickSkillButtonActionStep =>
          s.type === "clickSkillButton" && s.skillId === id,
      ) ?? null
    );
  };
  const isTechnique = (id: SkillInfo["id"]): boolean =>
    typeof id === "number" && id.toString().length > 5;
  const myActiveEnergy = createMemo(() => {
    const player = localProps.data.state.player[localProps.who];
    const { energy = 0, maxEnergy = 1 } =
      player.character.find((ch) => ch.id === player.activeCharacterId) ?? {};
    return { energy, maxEnergy };
  });
  const energyPercentage = (): number => {
    const { energy, maxEnergy } = myActiveEnergy();
    return Math.min(energy / maxEnergy, 1);
  };
  const mySkills = createMemo<SkillInfo[]>(() => {
    const actionState = localProps.actionState;
    const steps = actionState?.availableSteps ?? [];
    const realCosts = actionState?.realCosts.skills;
    return localProps.data.state.player[localProps.who].initiativeSkill.map(
      (sk) => ({
        id: sk.definitionId,
        cost: sk.definitionCost,
        realCost: realCosts?.get(sk.definitionId),
        step: findSkillStep(steps, sk.definitionId),
        isTechnique: isTechnique(sk.definitionId),
        energy: energyPercentage(),
      }),
    );
  });
  const blurCardHandler = (e: CustomEvent<void>) => {
    e.stopPropagation();
    setSelectingId(null);
  };
  const [selectingId, setSelectingId] = createSignal<number | null>(null);
  return (
    <div
      class={`absolute inset-0 h-full w-full pointer-events-none ${
        localProps.class ?? ""
      }`}
      data-gi-tcg-opp-chessboard
      {...elProps}
    >
      <div class="absolute opp-chessboard-hands-container rounded-3">
        <div class="opp-chessboard-hands-shadow" />
        <div class="absolute bottom-0 w-full h-full max-h-40 rounded-xl overflow-clip ">
          <div class="absolute top-2 left-4 right-2 h-36">
            <Key each={hands()} by="id">
              {(card, index) => (
                <Card
                  data={card()}
                  enableShadow
                  id={card().id}
                  kind="myHand"
                  playStep={null}
                  realCost={props.actionState?.realCosts.cards.get(card().id)}
                  uiState={{
                    type: "cardStatic",
                    transform: {
                      x: index() * handOffset(),
                      y: 0,
                      z: 0,
                      ry: 1,
                      rz: 0,
                    },
                    draggingEndAnimation: false,
                    isAnimating: false,
                  }}
                  enableTransition={false}
                  selected={selectingId() === card().id}
                  toBeSwitched={false}
                  tuneStep={null}
                  onClick={(e) => {
                    e.target?.dispatchEvent(
                      new CustomEvent(OPP_CARD_CLICK_EVENT_NAME, {
                        bubbles: true,
                        detail: card(),
                      }),
                    );
                    setSelectingId(card().id);
                    (e.target as HTMLElement)?.addEventListener(
                      OPP_CARD_BLUR_EVENT_NAME,
                      blurCardHandler,
                      {
                        once: true,
                      },
                    );
                  }}
                />
              )}
            </Key>
          </div>
        </div>
        <div class="opp-chessboard-hands-border" />
      </div>
      <DicePanel
        state="hidden"
        dice={dice() as DiceType[]}
        disabledDiceTypes={[]}
        maxSelectedCount={null}
        onSelectDice={() => {}}
        onStateChange={() => {}}
        selectedDice={[]}
        compactView
        opp
        hasMiniView={
          localProps.viewType === "selectCard" ||
          localProps.viewType === "switchHands"
        }
      />
      <Show when={localProps.viewType === "switchHands"}>
        <MiniView
          viewType="switching"
          ids={hands().map((c) => c.definitionId)}
          nameGetter={() => void 0}
          opp={true}
        />
      </Show>
      <Show when={localProps.viewType === "selectCard"}>
        <MiniView
          viewType="selecting"
          ids={localProps.selectCardCandidates}
          nameGetter={(name) => assetsManager.getNameSync(name)}
          opp={true}
        />
      </Show>
      <Show
        when={
          localProps.viewType === "rerollDice" ||
          localProps.viewType === "rerollDiceEnd"
        }
      >
        <MiniView
          viewType="rerolling"
          ids={dice()}
          nameGetter={() => void 0}
          opp={true}
        />
      </Show>
      <SkillButtonGroup
        class="absolute top-1.2 transform-origin-tr scale-120% skill-button-group"
        skills={mySkills()}
        switchActiveButton={null}
        switchActiveCost={
          localProps.actionState?.realCosts.switchActive ?? null
        }
        shown={true}
      />
    </div>
  );
}
