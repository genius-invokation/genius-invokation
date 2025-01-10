import { internal } from "@gi-tcg/core/builder";

const {
  SkillContext,
  CardBuilder,
  CharacterBuilder,
  EntityBuilder,
  ExtensionBuilder,
  InitiativeSkillBuilder,
  TechniqueBuilder,
  TriggeredSkillBuilder,
  EVENT_MAP,
} = internal;

const OUTPUT_FILE = `${__dirname}/../src/names.json`;

const propFilter = (name: string) =>
  name !== "constructor" && !name.startsWith("_");

const builder = new Set(
  [
    CardBuilder,
    CharacterBuilder,
    EntityBuilder,
    ExtensionBuilder,
    InitiativeSkillBuilder,
    TechniqueBuilder,
    TriggeredSkillBuilder,
  ]
    .flatMap((cls) => Object.getOwnPropertyNames(cls.prototype))
    .filter(propFilter),
)
  .values()
  .toArray();

const context = new Set(
  Object.getOwnPropertyNames(SkillContext.prototype).filter(propFilter),
)
  .values()
  .toArray();

const event = new Set(
  Object.values(EVENT_MAP)
    .flatMap((cls) => Object.getOwnPropertyNames(cls.prototype))
    .filter(propFilter),
)
  .values()
  .toArray();

await Bun.write(
  OUTPUT_FILE,
  JSON.stringify({ builder, context, event }, null, 2),
);
