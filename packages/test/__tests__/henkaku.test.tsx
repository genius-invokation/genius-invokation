import { ref, setup, Character, State, Status, Equipment, Summon, CombatStatus } from "#test";
import { ShikanoinHeizou, Declension, HeartstopperStrike } from "@gi-tcg/data/internal/characters/anemo/shikanoin_heizou";
import { AurousBlaze } from "@gi-tcg/data/internal/characters/pyro/yoimiya"
import { Aura } from "@gi-tcg/typings";
import { test } from "bun:test";

test("declension layers when using e", async () => {
  const oppActive = ref();
  const declension = ref();
  const c = setup(
    <State>
        <Character opp active ref={oppActive} />
        <Character my def={ShikanoinHeizou} >
            <Status def={Declension} ref={declension} v={{ henkaku: 5 }} />
        </Character>
        <CombatStatus my def={AurousBlaze} />
    </State>,
  );

  await c.me.skill(HeartstopperStrike)
  c.expect(declension).toHaveVariable({ henkaku: 4 });
  c.expect(oppActive).toHaveVariable({ aura: Aura.None });
});
