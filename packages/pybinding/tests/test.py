# Copyright (C) 2024-2025 Guyutongxue
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

import unittest
import time
import random
from gitcg import (
    low_level,
    Game,
    CreateParam,
    Deck,
    Player,
    ActionValidity,
    ActionRequest,
    ActionResponse,
    RerollDiceRequest,
    RerollDiceResponse,
    ChooseActiveRequest,
    ChooseActiveResponse,
    SelectCardRequest,
    SelectCardResponse,
    SwitchHandsRequest,
    SwitchHandsResponse,
    DiceRequirementType,
    DiceType,
)


class MyPlayer(Player):
    who: int
    omni_dice_count = 0

    def __init__(self, who: int):
        self.who = who

    def on_notify(self, notification):
        self.omni_dice_count = len(
            [
                i
                for i in notification.state.player[self.who].dice
                if i == DiceType.DICE_TYPE_OMNI
            ]
        )

    def on_io_error(self, error_msg):
        print(error_msg)

    def on_action(self, request: ActionRequest) -> ActionResponse:
        chosen_index = 0
        used_dice: list[DiceType] = []
        actions = list(enumerate(request.action))
        random.shuffle(actions)
        for i, action in actions:
            required_count = 0
            has_non_dice_requirement = False
            if action.validity != ActionValidity.ACTION_VALIDITY_VALID:
                continue
            for req in list(action.required_cost):
                if (
                    req.type == DiceRequirementType.DICE_REQUIREMENT_TYPE_ENERGY
                    or req.type == DiceRequirementType.DICE_REQUIREMENT_TYPE_LEGEND
                ):
                    has_non_dice_requirement = True
                else:
                    required_count += req.count
            if has_non_dice_requirement:
                continue
            if required_count > self.omni_dice_count:
                continue
            chosen_index = i
            used_dice = [DiceType.DICE_TYPE_OMNI] * required_count
            break
        return ActionResponse(chosen_action_index=chosen_index, used_dice=used_dice)

    def on_reroll_dice(self, request: RerollDiceRequest) -> RerollDiceResponse:
        return RerollDiceResponse(dice_to_reroll=[])

    def on_switch_hands(self, request: SwitchHandsRequest) -> SwitchHandsResponse:
        return SwitchHandsResponse(removed_hand_ids=[])

    def on_choose_active(self, request: ChooseActiveRequest) -> ChooseActiveResponse:
        return ChooseActiveResponse(active_character_id=request.candidate_ids[0])

    def on_select_card(self, request: SelectCardRequest) -> SelectCardResponse:
        return SelectCardResponse(
            selected_definition_id=request.candidate_definition_ids[0]
        )


DECK0 = Deck(
    [1411, 1510, 2103],
    [
        214111,
        214111,
        215101,
        311503,
        312004,
        312004,
        312025,
        312025,
        312029,
        312029,
        321002,
        321011,
        321016,
        321016,
        322002,
        322009,
        322009,
        330008,
        332002,
        332002,
        332004,
        332004,
        332005,
        332005,
        332006,
        332006,
        332018,
        332025,
        333004,
        333004,
    ],
)

DECK1 = Deck(
    [1609, 2203, 1608],
    [
        312025,
        321002,
        321002,
        321011,
        322025,
        323004,
        323004,
        330005,
        331601,
        331601,
        332002,
        332003,
        332003,
        332004,
        332004,
        332005,
        332005,
        332006,
        332025,
        332025,
        333003,
        333003,
    ],
)


class TestGitcg(unittest.TestCase):
    def test_it(self):
        for i in range(0, 10):
            game = Game(create_param=CreateParam(deck0=DECK0, deck1=DECK1))
            game.set_attr(low_level.ATTR_PLAYER_ALWAYS_OMNI_0, 1)
            game.set_attr(low_level.ATTR_PLAYER_ALWAYS_OMNI_1, 1)
            game.set_player(0, MyPlayer(0))
            game.set_player(1, MyPlayer(1))

            start_time = time.time()
            game.start()
            states = []
            while game.is_running():
                states.append(game.state())
                game.step()
            print("Time: ", time.time() - start_time)
            print("States: ", len(states))
            print("Winner: ", game.winner())
        # self.assertEqual(game.round_number(), 15)
        # self.assertEqual(game.winner(), None)
