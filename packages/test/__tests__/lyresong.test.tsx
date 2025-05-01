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

import { Character, ref, setup, State, Equipment, Card } from "#test";
import { TenacityOfTheMillelith } from "@gi-tcg/data/internal/cards/equipment/artifacts";
import { LeaveItToMe, Lyresong } from "@gi-tcg/data/internal/cards/event/other";
import { expect, test } from "bun:test";

test("lyresong: first play deduct 2 omni", async () => {
  const target = ref();
  const c = setup(
    <State phase="end">
      <Character my ref={target}>
        <Equipment def={TenacityOfTheMillelith} />
      </Character>
      <Card my def={Lyresong} />
    </State>,
  );
  await c.me.card(Lyresong, target);
  // -2 费，只消耗 1 个骰子
  await c.me.card(TenacityOfTheMillelith, target);
  expect(c.state.players[0].dice).toBeArrayOfSize(7);
});

test("lyresong: second play deduct 1 omni", async () => {
  const target = ref();
  const c = setup(
    <State phase="end">
      <Character my ref={target}>
        <Equipment def={TenacityOfTheMillelith} />
      </Character>
      <Card my def={LeaveItToMe} />
      <Card my def={Lyresong} />
    </State>,
  );
  await c.me.card(LeaveItToMe);
  await c.me.card(Lyresong, target);
  // -1 费，消耗 2 个骰子
  await c.me.card(TenacityOfTheMillelith, target);
  expect(c.state.players[0].dice).toBeArrayOfSize(6);
});
