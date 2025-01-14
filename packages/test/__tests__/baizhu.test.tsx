// Copyright (C) 2025 Guyutongxue
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

import { Character, CombatStatus, ref, setup, State } from "#test";
import { Baizhu, HolisticRevivification, SeamlessShield } from "@gi-tcg/data/internal/characters/dendro/baizhu";
import { Keqing, YunlaiSwordsmanship } from "@gi-tcg/data/internal/characters/electro/keqing";
import { test } from "bun:test";

test("baizhu shield: onDispose", async () => {
  const baizhu = ref();
  const oppActive = ref();
  const c = setup(
    <State>
      <Character my active def={Baizhu} ref={baizhu} energy={2} />
      <Character opp active def={Keqing} ref={oppActive} />
    </State>,
  );
  await c.me.skill(HolisticRevivification);
  await c.opp.skill(YunlaiSwordsmanship);
  // 原本打2点伤害，1点护盾 -> 9血
  // 白术盾回1点 -> 10 血
  c.expect(baizhu).toHaveVariable("health", 10);
  // 白术盾反
  c.expect(oppActive).toHaveVariable("health", 9);
});

test("baizhu shield: onEnter override", async () => {
  const baizhu = ref();
  const oppActive = ref();
  const c = setup(
    <State>
      <Character my active def={Baizhu} ref={baizhu} energy={2} health={5} />
      <CombatStatus my def={SeamlessShield} />
      <Character opp active def={Keqing} ref={oppActive} />
    </State>,
  );
  await c.me.skill(HolisticRevivification);
  // 白术盾回1点 -> 10 血
  c.expect(baizhu).toHaveVariable("health", 6);
  // 白术盾反
  c.expect(oppActive).toHaveVariable("health", 9);
});
