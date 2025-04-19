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
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { onMount } from "solid-js";
import { createCardDataViewer } from ".";
import { render } from "solid-js/web";

function App() {
  const { CardDataViewer, showCharacter, showState, showCard, showSkill } =
    createCardDataViewer({
      // includesImage: true,
    });
  onMount(() => {
    showState(
      "character",
      {
        id: -500001,
        definitionId: 1304,
        aura: 0,
        defeated: false,
        health: 10,
        maxHealth: 10,
        energy: 2,
        maxEnergy: 2,
        entity: [
          {
            id: -500002,
            definitionId: 312015,
            hasUsagePerRound: false,
            variableName: "usage",
            variableValue: 3,
            equipment: 1,
            descriptionDictionary: {
              "[GCG_TOKEN_SHIELD]": "1",
            },
          },
        ],
      },
      [
        {
          id: -500003,
          definitionId: 111,
          variableName: "shield",
          variableValue: 1,
          hasUsagePerRound: true,
          descriptionDictionary: {},
        },
      ],
    );
    showState("card", {
      id: -5000001,
      definitionId: 330005,
      definitionCost: [],
      descriptionDictionary: {
        "[T]": "2",
      },
    });
    // showState("summon", {
    //   id: -5000001,
    //   definitionId: 113041,
    //   descriptionDictionary: {},
    //   hasUsagePerRound: false,
    //   variableName: "usage",
    //   variableValue: 2,
    // });
    showCard(212111);
    // showCharacter(1610);
    // showSkill(12111);
  });
  return <CardDataViewer />;
}

render(() => <App />, document.querySelector("#root")!);
