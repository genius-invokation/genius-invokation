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

import { Card, Character, ref, setup, State, Status } from "#test";
import { PuffPops, PuffPopsInEffect } from "@gi-tcg/data/internal/cards/event/food";
import { CountdownToTheShow2 } from "@gi-tcg/data/internal/cards/event/other";
import { Keqing } from "@gi-tcg/data/internal/characters/electro/keqing";
import { GluttonousYumkasaurMountainKing, TheAlldevourer } from "@gi-tcg/data/internal/characters/dendro/gluttonous_yumkasaur_mountain_king";
import { Sigewinne } from "@gi-tcg/data/internal/characters/hydro/sigewinne";
import { test, expect } from "bun:test";
import { StatusHandle } from "@gi-tcg/core/builder";

test("sigewinne and yumkasaur interaction", async () => {
  const yumkasaur = ref();
  const oppActive = ref();
  const myPuffPopsActive = ref();
  const oppPuffPopsActive = ref();
  const c = setup(
    <State>
      <Card opp pile def={CountdownToTheShow2} notInitial />
      <Character opp active def={Keqing} ref={oppActive} health={7}>
        <Status def={PuffPopsInEffect} usage={3} ref={oppPuffPopsActive} />
      </Character>

      <Character my def={GluttonousYumkasaurMountainKing} ref={yumkasaur} health={5}>
        <Status def={PuffPopsInEffect} usage={3} ref={myPuffPopsActive} />
      </Character>
      <Card my def={TheAlldevourer} />
    </State>,
  );

  // 打出山王天赋
  await c.me.card(TheAlldevourer, yumkasaur);

  // 确认偷到牌了
  expect(c.state.players[0].hands.length).toBe(1);
  expect(c.state.players[0].hands[0].definition.id).toBe(CountdownToTheShow2);
  expect(c.state.players[1].hands.length).toBe(0);

  // 山王方的ddpp触发
  c.expect(yumkasaur).toHaveVariable({ health: 6 });
  c.expect(myPuffPopsActive).toHaveVariable({ usage: 2 });

  // 被偷牌方的ddpp不触发
  c.expect(oppActive).toHaveVariable({ health: 7 });
  c.expect(oppPuffPopsActive).toHaveVariable({ usage: 3 });
});
