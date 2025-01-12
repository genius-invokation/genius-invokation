// @ts-check

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

module.exports = {
  apps: [
    {
      name: process.env.APP_NAME,
      script: "src/main.ts",
      env: {
        NODE_ENV: "production",
      },
      interpreter: "bun",
      min_uptime: "5s",
      max_restarts: 5,
      kill_timeout: 2 * 60 * 60 * 1000, // 2 hours (for continuing game)
      out_file: process.env.OUTPUT_PATH,
      error_file: process.env.ERROR_PATH,
    }
  ]
};
