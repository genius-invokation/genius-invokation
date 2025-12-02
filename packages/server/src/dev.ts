import getPort from "get-port";
import { unstable_startServer } from "@prisma/dev";
import path from "node:path";
import { $ } from "bun";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

if (process.env.NODE_ENV === "production") {
  throw new Error("dev.ts should not be used in production");
}

const port = await getPort({ port: 51213 });
const server = await unstable_startServer({
  name: "gi-tcg-server-dev",
  port,
  persistenceMode: "stateful",
});
const connectionString = server.database.connectionString;
console.log("Started temporary dev Postgres server at", connectionString);

// Run Drizzle migrations
const pool = new Pool({ connectionString: server.ppg.url });
const db = drizzle(pool);
await migrate(db, { migrationsFolder: path.resolve(import.meta.dirname, "../drizzle") });
await pool.end();
console.log(`dev Postgres server migration done.`);

await $`bun --watch ${path.resolve(import.meta.dirname, "main.ts")}`.env({
  DATABASE_URL: connectionString,
}).nothrow();
