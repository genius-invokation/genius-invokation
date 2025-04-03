import {
  CustomActionCard,
  CustomCharacter,
  CustomSkill,
  CustomEntity,
  CustomData,
} from "@gi-tcg/assets-manager";
import {
  beginRegistration,
  endRegistration,
  card as cardOriginal,
  character as characterOriginal,
  combatStatus as combatStatusOriginal,
  extension as extensionOriginal,
  skill as skillOriginal,
  status as statusOriginal,
  summon as summonOriginal,
  playSkillOfCard,
} from "@gi-tcg/core/builder";
import * as originalBuilderExport from "@gi-tcg/core/builder";
import { SkillDefinition } from "@gi-tcg/core";

function b64EncodeUnicode(str: string) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
      return String.fromCharCode(parseInt(p1, 16));
    }),
  );
}

function placeholderImageUrl(name: string) {
  return `data:image/svg+xml;base64,${b64EncodeUnicode(`
    <svg xmlns="http://www.w3.org/2000/svg" width="210" height="360">
      <rect width="210" height="360" fill="#ddd" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="32" fill="#333">
        ${name}
      </text>
    </svg>
  `)}`;
}

export class BuilderContext {
  constructor(private readonly stepId: () => number) {}

  private readonly withCustomBuilderMethods = <
    T extends object,
    RestArgs extends any[],
    U extends Record<string, (id: number, ...args: any[]) => void>,
  >(
    fn: (id: number, ...args: RestArgs) => T,
    extraSetters: U,
  ) => {
    return (name: string, ...args: RestArgs) => {
      const id = this.stepId();
      this.registerName(id, name);
      const builder: any = fn(id, ...args);

      const extraSetters2: Record<string, (...args: any[]) => T> = {};
      for (const [key, value] of Object.entries(extraSetters)) {
        extraSetters2[key] = (...args: any[]) => {
          value(id, ...args);
          if (key in builder && typeof builder[key] === "function") {
            builder[key](...args);
          }
          return result;
        };
      }

      const result = new Proxy(builder, {
        get(target, prop) {
          if (Reflect.has(extraSetters2, prop)) {
            return Reflect.get(extraSetters2, prop);
          } else {
            return Reflect.get(target, prop);
          }
        },
      });
      return result;
    };
  };

  private names = new Map<number, string>();
  private descriptions = new Map<number, string>();
  private images = new Map<number, string>();

  private registerName(id: number, name: string) {
    this.names.set(id, name);
  }
  private registerDescription(id: number, desc: string) {
    this.descriptions.set(id, desc);
  }
  private registerImage(id: number, url: string) {
    this.images.set(id, url);
  }

  beginRegistration() {
    beginRegistration();
    const commonSetter = {
      description: this.registerDescription.bind(this),
      image: this.registerImage.bind(this),
    };
    const card = this.withCustomBuilderMethods(cardOriginal, commonSetter);
    const character = this.withCustomBuilderMethods(
      characterOriginal,
      commonSetter,
    );
    const combatStatus = this.withCustomBuilderMethods(
      combatStatusOriginal,
      commonSetter,
    );
    const status = this.withCustomBuilderMethods(statusOriginal, commonSetter);
    const summon = this.withCustomBuilderMethods(summonOriginal, commonSetter);
    const skill = this.withCustomBuilderMethods(skillOriginal, commonSetter);
    const extension = this.withCustomBuilderMethods(
      extensionOriginal,
      commonSetter,
    );
    return {
      ...originalBuilderExport,
      card,
      character,
      combatStatus,
      status,
      summon,
      skill,
      extension,
    };
  }
  endRegistration() {
    const gameData = endRegistration()();
    const customData: CustomData = {
      actionCards: [],
      characters: [],
      entities: [],
    };
    const parseSkill = (skill: SkillDefinition): CustomSkill => {
      const name = this.names.get(skill.id) ?? "";
      const skillType = skill.initiativeSkillConfig?.skillType ?? "passive";
      return {
        id: skill.id,
        type: skillType === "playCard" ? "passive" : skillType,
        name,
        rawDescription: this.descriptions.get(skill.id) ?? "",
        skillIconUrl: this.images.get(skill.id) ?? "",
        playCost: new Map(skill.initiativeSkillConfig?.requiredCost),
      };
    };
    for (const [id, ch] of gameData.characters) {
      const name = this.names.get(ch.id) ?? "";
      customData.characters.push({
        id,
        name,
        rawDescription: this.descriptions.get(id) ?? "",
        cardFaceUrl: this.images.get(id) ?? placeholderImageUrl(name),
        obtainable: true,
        hp: ch.varConfigs.maxHealth.initialValue,
        maxEnergy: ch.varConfigs.maxEnergy.initialValue,
        tags: [...ch.tags],
        skills: ch.skills.map(parseSkill),
      });
    }
    for (const [id, card] of gameData.cards) {
      const name = this.names.get(card.id) ?? "";
      customData.actionCards.push({
        id,
        name,
        type: card.cardType,
        rawDescription: this.descriptions.get(id) ?? "",
        cardFaceUrl: this.images.get(id) ?? placeholderImageUrl(name),
        obtainable: card.obtainable,
        tags: [...card.tags],
        playCost: new Map(
          playSkillOfCard(card).initiativeSkillConfig.requiredCost,
        ),
      });
    }
    for (const [id, et] of gameData.entities) {
      const name = this.names.get(id) ?? "";
      customData.entities.push({
        id,
        type: et.type,
        name,
        rawDescription: this.descriptions.get(et.id) ?? "",
        cardFaceOrBuffIconUrl: this.images.get(id) ?? placeholderImageUrl(name),
        skills: et.skills.map(parseSkill),
      });
    }
    return { gameData, customData };
  }
}
