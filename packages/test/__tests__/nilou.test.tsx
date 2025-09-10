import { Character, CombatStatus, setup, State } from "#test"
import { AllSchemesToKnow, Nahida } from "@gi-tcg/data/internal/characters/dendro/nahida"
import { Mona } from "@gi-tcg/data/internal/characters/hydro/mona"
import { BountifulCore, GoldenChalicesBounty, Nilou } from "@gi-tcg/data/internal/characters/hydro/nilou"
import { DendroCore } from "@gi-tcg/data/internal/commons"
import { Aura } from "@gi-tcg/typings"

test("nilou basic logic", async () => {
  const c = setup(
    <State>
      <Character opp active aura={Aura.Hydro} />
      <Character my def={Nilou} />
      <Character my active def={Nahida} />
      <Character my def={Mona} />
      <CombatStatus my def={GoldenChalicesBounty} />
    </State>
  );
  await c.me.skill(AllSchemesToKnow);
  c.expect(`opp active`).toHaveVariable({ aura: Aura.None });
  c.expect(`my combat status with definition id ${DendroCore}`).toNotExist();
  c.expect(`my summon with definition id ${BountifulCore}`).toBeExist();
})
