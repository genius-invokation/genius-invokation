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
  DiceType as PbDiceType,
  DiceRequirementType as PbDiceRequirementType,
  DiceRequirement as PbDiceRequirement,
  DamageType as PbDamageType,
  AuraType as PbAuraType,
  ReactionType as PbReactionType,
} from "./gen/enums";

export const DiceType = {
  Void: PbDiceRequirementType.DICE_REQ_VOID,
  Cryo: PbDiceType.DICE_CRYO,
  Hydro: PbDiceType.DICE_HYDRO,
  Pyro: PbDiceType.DICE_PYRO,
  Electro: PbDiceType.DICE_ELECTRO,
  Anemo: PbDiceType.DICE_ANEMO,
  Geo: PbDiceType.DICE_GEO,
  Dendro: PbDiceType.DICE_DENDRO,
  Omni: PbDiceType.DICE_OMNI,
  Aligned: PbDiceRequirementType.DICE_REQ_ALIGNED,
  Energy: PbDiceRequirementType.DICE_REQ_ENERGY,
  Legend: PbDiceRequirementType.DICE_REQ_LEGEND,
} as const;
export type DiceType = typeof DiceType[keyof typeof DiceType];

export type DiceRequirement = Map<DiceType, number>;
export type ReadonlyDiceRequirement = ReadonlyMap<DiceType, number>;

export const DamageType = {
  Physical: PbDamageType.DMG_PHYSICAL,
  Cryo: PbDamageType.DMG_CRYO,
  Hydro: PbDamageType.DMG_HYDRO,
  Pyro: PbDamageType.DMG_PYRO,
  Electro: PbDamageType.DMG_ELECTRO,
  Anemo: PbDamageType.DMG_ANEMO,
  Geo: PbDamageType.DMG_GEO,
  Dendro: PbDamageType.DMG_DENDRO,
  Piercing: PbDamageType.DMG_PIERCING,
  Heal: PbDamageType.DMG_HEAL,
} as const;
export type DamageType = typeof DamageType[keyof typeof DamageType];

export const Aura = {
  None: PbAuraType.AURA_NONE,
  Cryo: PbAuraType.AURA_CRYO,
  Hydro: PbAuraType.AURA_HYDRO,
  Pyro: PbAuraType.AURA_PYRO,
  Electro: PbAuraType.AURA_ELECTRO,
  Dendro: PbAuraType.AURA_DENDRO,
  CryoDendro: PbAuraType.AURA_CRYO_DENDRO,
} as const;
export type Aura = typeof Aura[keyof typeof Aura];

export const Reaction = {
  Melt: PbReactionType.REACTION_MELT,
  Vaporize: PbReactionType.REACTION_VAPORIZE,
  Overloaded: PbReactionType.REACTION_OVERLOADED,
  Superconduct: PbReactionType.REACTION_SUPERCONDUCT,
  ElectroCharged: PbReactionType.REACTION_ELECTRO_CHARGED,
  Frozen: PbReactionType.REACTION_FROZEN,
  SwirlCryo: PbReactionType.REACTION_SWIRL_CRYO,
  SwirlHydro: PbReactionType.REACTION_SWIRL_HYDRO,
  SwirlPyro: PbReactionType.REACTION_SWIRL_PYRO,
  SwirlElectro: PbReactionType.REACTION_SWIRL_ELECTRO,
  CrystallizeCryo: PbReactionType.REACTION_CRYSTALLIZE_CRYO,
  CrystallizeHydro: PbReactionType.REACTION_CRYSTALLIZE_HYDRO,
  CrystallizePyro: PbReactionType.REACTION_CRYSTALLIZE_PYRO,
  CrystallizeElectro: PbReactionType.REACTION_CRYSTALLIZE_ELECTRO,
  Burning: PbReactionType.REACTION_BURNING,
  Bloom: PbReactionType.REACTION_BLOOM,
  Quicken: PbReactionType.REACTION_QUICKEN,
} as const;
export type Reaction = typeof Reaction[keyof typeof Reaction];

export {
  PbDiceType,
  PbDiceRequirementType,
  PbDiceRequirement,
  PbDamageType,
  PbAuraType,
  PbReactionType,
};
