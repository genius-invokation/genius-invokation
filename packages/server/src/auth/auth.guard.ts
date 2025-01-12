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
  type CanActivate,
  type ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import type { FastifyRequest } from "fastify";
import { isUserJwtPayload } from "./user.decorator";

export const IS_PUBLIC_KEY: unique symbol = Symbol("isPublic");

type PublicValue = true | undefined;

/**
 * By default, a route can only be accessed by login users.
 * Decorate a route with `@Public()` to allow public access (un-login or guest).
 * @returns 
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<PublicValue>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    ) || false;

    const request = context.switchToHttp().getRequest();
    request.auth = null;
    
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      return isPublic;
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      request.auth = payload;
      if (isUserJwtPayload(payload)) {
        return true;
      }
      return isPublic;
    } catch {
      return isPublic;
    }
  }

  private extractTokenFromHeader(request: FastifyRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
