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
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { ref, setup, State, Card, Support, Character, Equipment, Summon } from "#test";
import { PlungingStrike } from "@gi-tcg/data/internal/cards/event/other";
import { Albedo, DescentOfDivinity, SolarIsotoma } from "@gi-tcg/data/internal/characters/geo/albedo";
import { test } from "bun:test";

test("plunging triggered by PlungingStrike on Albedo", async () => {
  const target = ref();
  const albedo = ref();
  const c = setup(
    <State>
      <Character opp ref={target} />
      <Character my active />
      <Character my def={Albedo} ref={albedo}>
        <Equipment def={DescentOfDivinity} />
      </Character>
      <Card my def={PlungingStrike} />
      <Summon my def={SolarIsotoma} />
    </State>,
  );
  await c.me.card(PlungingStrike, albedo);
  c.expect("my active").toBe(albedo);
  // 阿贝多天赋：阳华在场时伤害+1
  c.expect(target).toHaveVariable({ health: 7 });
});
