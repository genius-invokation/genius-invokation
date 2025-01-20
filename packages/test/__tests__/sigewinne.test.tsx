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

import { Character, CombatStatus, ref, setup, State, Status } from "#test";
import { RainbowMacaronsInEffect } from "@gi-tcg/data/internal/cards/event/food";
import {
  Keqing,
  StellarRestoration,
  YunlaiSwordsmanship,
} from "@gi-tcg/data/internal/characters/electro/keqing";
import {
  DetailedDiagnosisThoroughTreatmentStatus,
  Sigewinne,
} from "@gi-tcg/data/internal/characters/hydro/sigewinne";
import { BondOfLife, Satiated } from "@gi-tcg/data/internal/commons";
import { Aura } from "@gi-tcg/typings";
import { test } from "bun:test";

test("sigwinne: passive triggered after defeated", async () => {
  const oppNext = ref();
  const c = setup(
    <State>
      <Character opp active def={Sigewinne} health={1} aura={Aura.Cryo} />
      <Character opp health={10} ref={oppNext}>
        <Status def={DetailedDiagnosisThoroughTreatmentStatus} />
        <Status def={BondOfLife} usage={1} />
        <Status def={RainbowMacaronsInEffect} />
        <Status def={Satiated} />
      </Character>
      <Character my active def={Keqing} />
    </State>,
  );
  await c.me.skill(StellarRestoration);
  // 超导后台穿透，oppNext 扣 1 血
  // 马卡龙回 1 血但被生命之契吃掉（生命值 9）
  // 生命之契弃置，触发希格雯被动，最大生命值+1
  // 生命值 10，最大生命值 11
  c.expect(oppNext).toHaveVariable({ health: 10, maxHealth: 11 });
  c.expect(
    `opp status with definition id ${DetailedDiagnosisThoroughTreatmentStatus}`,
  ).toNotExist();
  await c.opp.chooseActive(oppNext);
  c.expect("opp active").toBe(oppNext);
});
