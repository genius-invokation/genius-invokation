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

import { type ArgumentsHost, Catch, HttpStatus } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { Prisma } from "@prisma/client";
import type { FastifyReply } from "fastify";

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    console.log(exception.code);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const message = exception.message.replace(/\n/g, "");

    switch (exception.code) {
      case "P2001": 
      case "P2025": {
        const status = HttpStatus.NOT_FOUND;
        response.status(status).send({
          statusCode: status,
          message: message,
        });
        break;
      }
      case "P2002": {
        const status = HttpStatus.CONFLICT;
        response.status(status).send({
          statusCode: status,
          message: message,
        });
        break;
      }
      default:
        // default 500 error code
        super.catch(exception, host);
        break;
    }
  }
}
