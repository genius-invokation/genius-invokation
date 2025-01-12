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

from . import low_level as ll

class Entity:
    """
    Represents an Entity in a GI-TCG Game State.
    An entity includes:
    - `id`: A unique id for the entity in the game.
    - `definition_id`: The definition id of this entity. E.g. Furina has a definition id of 1211.
    - `variable`: A entity have some variables.
        - For characters, some common variables are `health`, `maxHealth`, `energy`, `maxEnergy`, `aura` and `alive`.
        - For other entities, some common variables are `usage`, `usagePerRound` and `shield`.
    """
    _entity_handle: FFI.CData = ll.NULL

    def __init__(self, handle: FFI.CData):
        """
        @private
        """
        self._entity_handle = handle

    def id(self):
        return ll.entity_get_id(self._entity_handle)
    
    def definition_id(self):
        return ll.entity_get_definition_id(self._entity_handle)
    
    def variable(self, name: str) -> int:
        return ll.entity_get_variable(self._entity_handle, name)
    
    def __del__(self):
        ll.entity_free(self._entity_handle)
