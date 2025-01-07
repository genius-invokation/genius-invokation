import { ref, setup, State, Card, Support } from "#test";
import { TheBestestTravelCompanion } from "@gi-tcg/data/internal/cards/event/other";
import { Paimon } from "@gi-tcg/data/internal/cards/support/ally";
import { Kusava } from "@gi-tcg/data/internal/cards/support/item";
import { test } from "bun:test";

test("kusava", async () => {
  const kusava = ref();
  const c = setup(
    <State phase="roll">
      <Support my def={Kusava} ref={kusava} v={{memory: 0}} />
      <Card my def={Paimon} />
      <Card my def={TheBestestTravelCompanion} />
    </State>,
  );
  await c.stepToNextAction();
  c.expect("my hand cards").toBeArrayOfSize(0);
  c.expect(kusava).toHaveVariable("memory", 2);
});
