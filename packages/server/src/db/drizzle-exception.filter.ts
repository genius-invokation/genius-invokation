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
import type { FastifyReply } from "fastify";

// PostgreSQL error codes
// https://www.postgresql.org/docs/current/errcodes-appendix.html
@Catch()
export class DrizzleExceptionFilter extends BaseExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    // Handle PostgreSQL errors
    if (exception.code && typeof exception.code === "string") {
      const message = exception.message?.replace(/\n/g, "") || "Database error";

      switch (exception.code) {
        case "23503": // foreign_key_violation
        case "23502": // not_null_violation
        case "23514": // check_violation
        case "22P02": // invalid_text_representation
        case "42703": // undefined_column
        case "42P01": // undefined_table
        {
          const status = HttpStatus.NOT_FOUND;
          response.status(status).send({
            statusCode: status,
            message: message,
          });
          break;
        }
        case "23505": // unique_violation
        {
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
    } else {
      // Not a database error, pass to default handler
      super.catch(exception, host);
    }
  }
}
