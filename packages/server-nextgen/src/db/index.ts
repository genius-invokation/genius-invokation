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

import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Support both PGlite (for development) and PostgreSQL (for production)
let db: ReturnType<typeof drizzlePglite> | ReturnType<typeof drizzlePostgres>;

if (connectionString.startsWith("pglite://")) {
  // Development: Use PGlite (embedded PostgreSQL)
  const pglitePath = connectionString.replace("pglite://", "");
  const pglite = new PGlite(pglitePath);
  db = drizzlePglite(pglite, { schema });
} else {
  // Production: Use regular PostgreSQL
  const client = postgres(connectionString);
  db = drizzlePostgres(client, { schema });
}

export { db };
