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


import { Card, Character, ref, setup, State, Status, Support } from "#test";
import { PuffPopsInEffect } from "@gi-tcg/data/internal/cards/event/food";
import { CountdownToTheShow2, NatureAndWisdom } from "@gi-tcg/data/internal/cards/event/other";
import { Keqing } from "@gi-tcg/data/internal/characters/electro/keqing";
import { Nahida } from "@gi-tcg/data/internal/characters/dendro/nahida";
import { GluttonousYumkasaurMountainKing, TheAlldevourer } from "@gi-tcg/data/internal/characters/dendro/gluttonous_yumkasaur_mountain_king";
import { test, expect } from "bun:test";
import { TheMausoleumOfKingDeshret } from "@gi-tcg/data/internal/cards/support/place";


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

  // 山王方的咚咚嘭嘭触发
  c.expect(yumkasaur).toHaveVariable({ health: 6 });
  c.expect(myPuffPopsActive).toHaveVariable({ usage: 2 });

  // 被偷牌方的咚咚嘭嘭不触发
  c.expect(oppActive).toHaveVariable({ health: 7 });
  c.expect(oppPuffPopsActive).toHaveVariable({ usage: 3 });
});

test("NatureAndWisdom with TheMausoleumOfKingDeshret", async () => {
  const myActive = ref();
  const myPuffPopsActive = ref();
  const oppMausoleum = ref();
  const c = setup(
    <State>
      <Character my active def={Nahida} ref={myActive} health={6}>
        <Status def={PuffPopsInEffect} usage={3} ref={myPuffPopsActive} />
      </Character>

      <Support opp def={TheMausoleumOfKingDeshret} ref={oppMausoleum} />

      <Card my pile def={CountdownToTheShow2} notInitial />
      <Card my def={NatureAndWisdom} />
    </State>,
  );

  // 打出草与智慧
  await c.me.card(NatureAndWisdom);

  // 调度换走抽到的这张牌，然后重新抽上来同一张牌
  await c.me.switchHands([CountdownToTheShow2]);

  // 咚咚嘭嘭触发2次
  c.expect(myPuffPopsActive).toHaveVariable({ usage: 1 });
  c.expect(myActive).toHaveVariable({ health: 8 });

  // 赤王陵触发2次
  c.expect(oppMausoleum).toHaveVariable({ drawnCardCount: 2 });
});
