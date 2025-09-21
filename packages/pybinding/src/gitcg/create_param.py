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

from __future__ import annotations
from cffi import FFI
from dataclasses import dataclass

from . import low_level as ll


@dataclass
class Deck:
    """
    A deck that consists initial characters and action cards that initialize a GI-TCG Game State.
    In an ordinary GI-TCG game, each player has 3 characters and 30 action cards. 
    
    The `characters` and `cards` is a list of definition ids of characters and action cards respectively.
    """
    characters: list[int]
    cards: list[int]


class CreateParam:
    """
    A helper class to create a initial Game State of GI-TCG.
    """
    _createparam_handle: FFI.CData = ll.NULL

    def __init__(
        self,
        /,
        deck0: Deck | None = None,
        deck1: Deck | None = None,
        version: str | None = None,
        *, 
        random_seed: int | None = None,
        initial_hands_count: int | None = None,
        max_hands_count: int | None = None,
        max_rounds_count: int | None = None,
        max_supports_count: int | None = None,
        max_summons_count: int | None = None,
        initial_dice_count: int | None = None,
        max_dice_count: int | None = None,
        no_shuffle: tuple[int, int] | None = None,
        always_omni: tuple[int, int] | None = None,
        allow_tuning_any_dice: tuple[int, int] | None = None,
    ):
        """
        The `gitcg.CreateParam` can be initialized from 0~2 `gitcg.Deck` and a version string,
        along with various optional custom state configuration parameters.

        The available version string can be found at Core TypeScript code [here](https://github.com/guyutongxue/genius-invokation/blob/main/packages/core/src/base/version.ts).

        If `deck0` or `deck1` not provided in constructor, you can also set them later by `set_characters` and `set_cards`.
        
        Customize state configuration parameters:
        - `random_seed`: Random seed for the game
        - `initial_hands_count`: Initial number of cards in hand
        - `max_hands_count`: Maximum number of cards in hand
        - `max_rounds_count`: Maximum number of rounds
        - `max_supports_count`: Maximum number of support cards
        - `max_summons_count`: Maximum number of summons
        - `initial_dice_count`: Initial number of dice
        - `max_dice_count`: Maximum number of dice
        - `no_shuffle`: Disable shuffling for players (player0, player1)
        - `always_omni`: Always provide omni dice for players (player0, player1)
        - `allow_tuning_any_dice`: Allow tuning any dice for players (player0, player1)
        """
        self._createparam_handle = ll.state_createpram_new()
        if deck0 is not None:
            self.set_characters(0, deck0.characters)
            self.set_cards(0, deck0.cards)
        if deck1 is not None:
            self.set_characters(1, deck1.characters)
            self.set_cards(1, deck1.cards)
        if version is not None:
            self.set_version(version)
        if random_seed is not None:
            self.set_random_seed(random_seed)
        if initial_hands_count is not None:
            self.set_initial_hands_count(initial_hands_count)
        if max_hands_count is not None:
            self.set_max_hands_count(max_hands_count)
        if max_rounds_count is not None:
            self.set_max_rounds_count(max_rounds_count)
        if max_supports_count is not None:
            self.set_max_supports_count(max_supports_count)
        if max_summons_count is not None:
            self.set_max_summons_count(max_summons_count)
        if initial_dice_count is not None:
            self.set_initial_dice_count(initial_dice_count)
        if max_dice_count is not None:
            self.set_max_dice_count(max_dice_count)
        if no_shuffle is not None:
            self.set_no_shuffle(no_shuffle[0], no_shuffle[1])
        if always_omni is not None:
            self.set_always_omni(always_omni[0], always_omni[1])
        if allow_tuning_any_dice is not None:
            self.set_allow_tuning_any_dice(allow_tuning_any_dice[0], allow_tuning_any_dice[1])

    def set_characters(self, who: int, characters: list[int]):
        assert who == 0 or who == 1
        ll.state_createparam_set_deck(self._createparam_handle, who, 1, characters)

    def set_cards(self, who: int, cards: list[int]):
        assert who == 0 or who == 1
        ll.state_createparam_set_deck(self._createparam_handle, who, 2, cards)

    def set_attr(self, key: int, value: int | str):
        ll.state_createparam_set_attr(self._createparam_handle, key, value)

    def set_version(self, version: str):
        ll.state_createparam_set_attr(
            self._createparam_handle, ll.ATTR_CREATEPARAM_DATA_VERSION, version
        )

    def set_random_seed(self, random_seed: int):
        ll.state_createparam_set_attr(
            self._createparam_handle, ll.ATTR_STATE_CONFIG_RANDOM_SEED, random_seed
        )

    def set_initial_hands_count(self, initial_hands_count: int):
        ll.state_createparam_set_attr(
            self._createparam_handle, ll.ATTR_STATE_CONFIG_INITIAL_HANDS_COUNT, initial_hands_count
        )

    def set_max_hands_count(self, max_hands_count: int):
        ll.state_createparam_set_attr(
            self._createparam_handle, ll.ATTR_STATE_CONFIG_MAX_HANDS_COUNT, max_hands_count
        )

    def set_max_rounds_count(self, max_rounds_count: int):
        ll.state_createparam_set_attr(
            self._createparam_handle, ll.ATTR_STATE_CONFIG_MAX_ROUNDS_COUNT, max_rounds_count
        )

    def set_max_supports_count(self, max_supports_count: int):
        ll.state_createparam_set_attr(
            self._createparam_handle, ll.ATTR_STATE_CONFIG_MAX_SUPPORTS_COUNT, max_supports_count
        )

    def set_max_summons_count(self, max_summons_count: int):
        ll.state_createparam_set_attr(
            self._createparam_handle, ll.ATTR_STATE_CONFIG_MAX_SUMMONS_COUNT, max_summons_count
        )

    def set_initial_dice_count(self, initial_dice_count: int):
        ll.state_createparam_set_attr(
            self._createparam_handle, ll.ATTR_STATE_CONFIG_INITIAL_DICE_COUNT, initial_dice_count
        )

    def set_max_dice_count(self, max_dice_count: int):
        ll.state_createparam_set_attr(
            self._createparam_handle, ll.ATTR_STATE_CONFIG_MAX_DICE_COUNT, max_dice_count
        )

    def set_no_shuffle(self, player0_value: int, player1_value: int):
        ll.state_createparam_set_attr(
            self._createparam_handle, ll.ATTR_CREATEPARAM_NO_SHUFFLE_0, player0_value
        )
        ll.state_createparam_set_attr(
            self._createparam_handle, ll.ATTR_CREATEPARAM_NO_SHUFFLE_1, player1_value
        )

    def set_always_omni(self, player0_value: int, player1_value: int):
        ll.state_createparam_set_attr(
            self._createparam_handle, ll.ATTR_PLAYER_ALWAYS_OMNI_0, player0_value
        )
        ll.state_createparam_set_attr(
            self._createparam_handle, ll.ATTR_PLAYER_ALWAYS_OMNI_1, player1_value
        )

    def set_allow_tuning_any_dice(self, player0_value: int, player1_value: int):
        ll.state_createparam_set_attr(
            self._createparam_handle, ll.ATTR_PLAYER_ALLOW_TUNING_ANY_DICE_0, player0_value
        )
        ll.state_createparam_set_attr(
            self._createparam_handle, ll.ATTR_PLAYER_ALLOW_TUNING_ANY_DICE_1, player1_value
        )

    def __del__(self):
        ll.state_createpram_free(self._createparam_handle)
