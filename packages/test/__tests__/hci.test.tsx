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

import { ref, setup, Character, State, Equipment, Card } from "#test";
import { PortablePowerSaw } from "@gi-tcg/data/internal/cards/equipment/weapon/claymore";
import { Chasca, ShadowhuntShell } from "@gi-tcg/data/internal/characters/anemo/chasca";
import { SweepingFervor, Xinyan } from "@gi-tcg/data/internal/characters/pyro/xinyan";
import { Aura } from "@gi-tcg/typings";
import { test } from "bun:test";

test("HCI: do not trigger transform of chasca's shell if immediately dispose", async () => {
  const oppStandby = ref();
  const c = setup(
    <State>
      <Character opp active />
      <Character opp ref={oppStandby} health={10} />
      <Character my def={Chasca} />
      <Character my active def={Xinyan} >
        <Equipment def={PortablePowerSaw} v={{ stoic: 1 }} />
      </Character>
      <Card my pile def={ShadowhuntShell} />
    </State>,
  );
  await c.me.skill(SweepingFervor);
  // E 2 火伤，动力锯+1；洽斯卡弹头 1 风伤扩散消元素
  c.expect("opp active").toHaveVariable({ health: 6, aura: Aura.None });
  // 后台 1 扩散火伤
  c.expect(oppStandby).toHaveVariable({ health: 9, aura: Aura.Pyro });
});
