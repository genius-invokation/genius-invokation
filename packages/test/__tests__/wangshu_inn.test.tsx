import { ref, setup, Character, State, Support, DeclaredEnd } from "#test";
import { WangshuInn } from "@gi-tcg/data/internal/cards/support/place";
import { Keqing } from "@gi-tcg/data/internal/characters/electro/keqing";
import { AlldevouringNarwhal } from "@gi-tcg/data/internal/characters/hydro/alldevouring_narwhal";
import { test } from "bun:test";

test("wangshu inn", async () => {
  const wangshuInn = ref();
  const target = ref();
  const c = setup(
    <State>
      <DeclaredEnd opp />
      <Support my def={WangshuInn} ref={wangshuInn} />
      <Character my active />
      <Character my def={AlldevouringNarwhal} />
      <Character my def={Keqing} health={6} ref={target} />
    </State>,
  );
  await c.me.end();
  await c.stepToNextAction();
  c.expect(`with id ${wangshuInn.id}`).toHaveVariable("usage", 1);
  c.expect(`with id ${target.id}`).toHaveVariable("health", 8);
});
