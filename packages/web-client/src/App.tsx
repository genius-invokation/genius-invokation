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

import { Route, Router } from "@solidjs/router";
import {
  createContext,
  createResource,
  createSignal,
  onMount,
  onCleanup,
  Resource,
  useContext,
  type Accessor,
} from "solid-js";
import { Home } from "./pages/Home";
import axios from "axios";
import { User } from "./pages/User";
import { Decks } from "./pages/Decks";
import { EditDeck } from "./pages/EditDeck";
import { Room } from "./pages/Room";
import { NotFound } from "./pages/NotFound";

export interface VersionContextValue {
  versionInfo: Resource<any>;
}

const VersionContext = createContext<VersionContextValue>();
export const useVersionContext = () => useContext(VersionContext)!;

const MobileContext = createContext<Accessor<boolean>>();
export const useMobile = () => useContext(MobileContext)!;

function App() {
  const [versionInfo] = createResource(() =>
    axios.get("version").then((res) => res.data),
  );
  const versionContextValue: VersionContextValue = {
    versionInfo,
  };

  const mobileMediaQuery = window.matchMedia("(max-width: 768px)");
  const [mobile, setMobile] = createSignal(mobileMediaQuery.matches);
  const handleMobileChange = (e: MediaQueryListEvent) => {
    setMobile(e.matches);
  };
  onMount(() => {
    mobileMediaQuery.addEventListener("change", handleMobileChange);
  });
  onCleanup(() => {
    mobileMediaQuery.removeEventListener("change", handleMobileChange);
  });

  return (
    <VersionContext.Provider value={versionContextValue}>
      <MobileContext.Provider value={mobile}>
        <div class="h-full w-full flex flex-row">
          <Router base={import.meta.env.BASE_URL}>
            <Route path="/" component={Home} />
            <Route path="/user/:id" component={User} />
            <Route path="/decks/:id" component={EditDeck} />
            <Route path="/decks" component={Decks} />
            <Route path="/rooms/:code" component={Room} />
            <Route path="*" component={NotFound} />
          </Router>
        </div>
      </MobileContext.Provider>
    </VersionContext.Provider>
  );
}

export default App;
