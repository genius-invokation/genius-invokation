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

import { SERVER_HOST, WEB_CLIENT_BASE_PATH } from "@gi-tcg/config";

export const BACKEND_BASE_URL = `${SERVER_HOST || location.origin}${WEB_CLIENT_BASE_PATH}api`;

export const GITHUB_AUTH_REDIRECT_URL = `${BACKEND_BASE_URL}/auth/github/callback`;
