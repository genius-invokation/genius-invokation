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

import { ref, setup, Character, State, Card, Summon } from "#test";
import {
  DarkShadow,
} from "@gi-tcg/data/internal/characters/hydro/alldevouring_narwhal";
import {
  ShiningShadowhuntShellPyro,
} from "@gi-tcg/data/internal/characters/anemo/chasca";
import {
  RiffRevolution,
  Xinyan,
} from "@gi-tcg/data/internal/characters/pyro/xinyan";
import { test } from "bun:test";

test("Dark shadow shield: on damaged", async () => {
  const darkShadow = ref();
  const c = setup(
    <State>
      <Character my active def={Xinyan} energy={2} />
      <Character opp active />
      <Summon opp def={DarkShadow} ref={darkShadow} usage={9}/>
      <Card my def={ShiningShadowhuntShellPyro} />
      <Card my def={ShiningShadowhuntShellPyro} />
      <Card my def={ShiningShadowhuntShellPyro} />
    </State>,
  );
  await c.me.skill(RiffRevolution);
  c.expect(darkShadow).toHaveVariable({ usage: 7 });
});
