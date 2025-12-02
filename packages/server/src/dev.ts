import getPort from "get-port";
import { unstable_startServer } from "@prisma/dev";
import path from "node:path";
import { $ } from "bun";

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
await $`bunx drizzle-kit migrate`.env({
  DATABASE_URL: server.ppg.url,
});
console.log(`dev Postgres server migration done.`);

await $`bun --watch ${path.resolve(import.meta.dirname, "main.ts")}`.env({
  DATABASE_URL: connectionString,
}).nothrow();
