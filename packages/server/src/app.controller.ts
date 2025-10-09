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

import { Controller, Get, ImATeapotException } from "@nestjs/common";
import { Public } from "./auth/auth.guard";
import { CORE_VERSION, CURRENT_VERSION, VERSIONS } from "@gi-tcg/core";
import { revision } from "../dist/revision";

@Controller()
export class AppController {
  constructor() {}

  @Public()
  @Get("/version")
  async getVersion() {
    return {
      revision,
      supportedGameVersions: VERSIONS,
      currentGameVersion: CURRENT_VERSION,
      coreVersion: CORE_VERSION,
    };
  }

  @Public()
  @Get("/teapot")
  imATeapot() {
    throw new ImATeapotException("I'm a teapot~");
  }

  @Public()
  @Get("/hello")
  getHello(): string {
    return "Hello World!";
  }
}
