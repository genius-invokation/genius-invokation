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

import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { GamesService } from './games.service';
import { User } from '../auth/user.decorator';
import { PaginationDto } from '../utils';

@Controller('games')
export class GamesController {
  constructor(private games: GamesService) {}

  @Get()
  async getAllGames(@Query() pagination: PaginationDto) {
    return await this.games.getAllGames(pagination);
  }

  @Get("mine")
  async getMyGames(@User() userId: number, @Query() pagination: PaginationDto) {
    return await this.games.gamesHasUser(userId, pagination);
  }

  @Get(":gameId")
  async getGame(@Param("gameId", ParseIntPipe) gameId: number) {
    return await this.games.getGame(gameId);
  }

}
