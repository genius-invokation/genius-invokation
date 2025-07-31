
import {
  ref,
  setup,
  Character,
  State,
  Equipment,
  Summon,
} from "#test";
import { test } from "bun:test";
import { GaleBlade, Jean } from "@gi-tcg/data/internal/characters/anemo/jean";
import { Albedo, DescentOfDivinity, FavoniusBladeworkWeiss, SolarIsotoma } from "@gi-tcg/data/internal/characters/geo/albedo";

test("Effect-caused switchActive should mark canPlunging", async () => {
  const c = setup(
    <State currentTurn="opp">
      <Character opp active def={Jean} health={10} />
      <Character my active />
      <Character my def={Albedo} >
        <Equipment def={DescentOfDivinity} />
      </Character>
      <Summon my def={SolarIsotoma} />
    </State>,
  );
  await c.opp.skill(GaleBlade);
  await c.me.skill(FavoniusBladeworkWeiss);
  // 阿贝多天赋：下落攻击+1伤
  c.expect("opp active").toHaveVariable({ health: 7 });
});
