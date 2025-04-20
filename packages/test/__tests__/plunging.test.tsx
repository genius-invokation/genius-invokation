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

import { ref, setup, State, Card, Support, Character, Equipment, Summon, DeclaredEnd } from "#test";
import { SkillHandle } from "@gi-tcg/core/builder";
import { PlungingStrike } from "@gi-tcg/data/internal/cards/event/other";
import { Albedo, DescentOfDivinity, FavoniusBladeworkWeiss, SolarIsotoma } from "@gi-tcg/data/internal/characters/geo/albedo";
import { BiteyShark, Mualani } from "@gi-tcg/data/internal/characters/hydro/mualani";
import { test } from "bun:test";

test("plunging triggered by a in-skill-switch to Albedo", async () => {
  const target = ref();
  const albedo = ref();
  const c = setup(
    <State>
      <DeclaredEnd opp />
      <Character opp ref={target} />

      <Character my def={Albedo} ref={albedo}>
        <Equipment def={DescentOfDivinity} />
      </Character>
      <Character my active def={Mualani}>
        <Equipment def={BiteyShark} />
      </Character>

      <Summon my def={SolarIsotoma} />
    </State>,
  );
  await c.me.skill(1121422 as SkillHandle);
  c.expect("my active").toBe(albedo);
  await c.me.skill(FavoniusBladeworkWeiss);
  // 阿贝多天赋：阳华在场时下落攻击伤害+1
  c.expect(target).toHaveVariable({ health: 7 });
});
