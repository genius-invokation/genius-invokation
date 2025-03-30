import type { DiceRequirement } from "@gi-tcg/typings";
import type { CardType, CardTag, CharacterTag, CommonSkillType, EntityType, EntityTag } from "@gi-tcg/core";
export interface CustomActionCard {
  id: number;
  name: string;
  rawDescription: string;
  cardFaceUrl: string;
  obtainable: boolean;
  type: CardType;
  tags: CardTag[];
  playCost: DiceRequirement;
}

export interface CustomCharacter {
  id: number;
  name: string;
  rawDescription: string;
  cardFaceUrl: string;
  obtainable: boolean;
  hp: number;
  maxEnergy: number;
  tags: CharacterTag[];
  skills: CustomSkill[];
}

export interface CustomSkill {
  id: number;
  name: string;
  rawDescription: string;
  skillIconUrl: string;
  type: CommonSkillType | "passive";
  playCost: DiceRequirement;
}

export interface CustomEntity {
  id: number;
  name: string;
  rawDescription: string;
  type: EntityType;
  buffIconUrl: string;
  // tags: EntityTag[];
  // hidden: boolean;
  skills: CustomSkill[];
}

export interface CustomData {
  actionCards: CustomActionCard[];
  characters: CustomCharacter[];
  entities: CustomEntity[];
}

