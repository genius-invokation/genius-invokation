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

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { IsNotEmpty } from "class-validator";
import { AuthService } from "./auth.service";
import { Public } from "./auth.guard";
import { SERVER_HOST } from "@gi-tcg/config";

class GitHubCallbackDto {
  @IsNotEmpty()
  code!: string;
}

@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Get("github/callback")
  async login(
    @Query() { code }: GitHubCallbackDto,
    @Res() res: FastifyReply,
  ) {
    const { accessToken } = await this.auth.login(code);
    res.type("text/html").send(
      `<!DOCTYPE html>
<title>Login Success</title>
<p>Redirecting back...</p>
<script>
  window.addEventListener("error", (event) => {
    document.body.innerHTML += \`\${event.type}: \${event.message}\\n\`;
  });
  window.opener.postMessage({ type: "login", token: "${accessToken}" }, "*");
  window.close();
</script>`,
    );
  }
}
