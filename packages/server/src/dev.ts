import getPort from "get-port";
import { unstable_startServer } from "@prisma/dev";

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
await Bun.$`bunx prisma migrate dev --skip-generate`.env({
  DATABASE_URL: server.ppg.url,
});
await Bun.$`bunx prisma generate`;
console.log(`dev Postgres server migration/generation done.`);

process.env.DATABASE_URL = connectionString;
await import("./main");
