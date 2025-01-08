import { ref, setup, Character, State, Status, Equipment, Card } from "#test";
import {
  Klee,
  Kaboom,
  ExplosiveSpark,
  JumpyDumpty,
} from "@gi-tcg/data/internal/characters/pyro/klee";
import { TulaytullahsRemembrance } from "@gi-tcg/data/internal/cards/equipment/weapon/catalyst";
import { VermillionHereafter } from "@gi-tcg/data/internal/cards/equipment/artifacts";
import { MintyMeatRolls } from "@gi-tcg/data/internal/cards/event/food";
import { test } from "bun:test";
import { expect } from "bun:test";

test("klee: dice deduction", async () => {
  const klee = ref();
  const target = ref();
  const c = setup(
    <State>
      <Character opp active ref={target} />
      <Character my active def={Klee} ref={klee}>
        <Equipment def={TulaytullahsRemembrance} />
        <Equipment def={VermillionHereafter} />
      </Character>
      <Card my def={MintyMeatRolls} />
    </State>,
  );
  await c.me.card(MintyMeatRolls, klee)
  await c.stepToNextAction();
  expect(c.state.players[0].dice).toBeArrayOfSize(7);

  await c.me.skill(JumpyDumpty);
  await c.opp.end();
  c.expect("opp active").toHaveVariable("health", 6);
  expect(c.state.players[0].dice).toBeArrayOfSize(4);

  await c.me.skill(Kaboom);
  await c.stepToNextAction();
  expect(c.state.players[0].dice).toBeArrayOfSize(4);

  c.expect(`my equipment with definition id ${ExplosiveSpark}`).toBeArrayOfSize(0);
  c.expect(`my equipment with definition id ${TulaytullahsRemembrance}`).toHaveVariable("usagePerRound", 1);
  c.expect(`my equipment with definition id ${VermillionHereafter}`).toHaveVariable("usagePerRound", 1);
});
