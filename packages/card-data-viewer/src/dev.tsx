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
  const { CardDataViewer, showCharacter } = createCardDataViewer({ includesImage: true, assetsApiEndPoint: "https://beta.assets.gi-tcg.guyutongxue.site/api/v2" });
  onMount(() => {
    showCharacter(1709);
  });
  return (
    <div>
      <CardDataViewer />
    </div>
  );
}

render(() => <App />, document.querySelector("#root")!);
