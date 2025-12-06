import { unstable_startServer } from "@prisma/dev";
import { $ } from "bun";
import path from "path";
import getPort from "get-port";

async function startLocalPrisma(name: string) {
  const port = await getPort();

  return await unstable_startServer({
    name,
    port,
    persistenceMode: "stateful",
  });
}

const server = await startLocalPrisma("gi-tcg-server-dev");
try {
  await $`bunx prisma migrate dev`.env({ DATABASE_URL: server.ppg.url });
  await $`bunx prisma generate`;
  await $`bun --watch ${path.resolve(import.meta.dirname, "main.ts")}`
    .env({
      DATABASE_URL: server.database.connectionString,
      DATABASE_CONNECTION_LIMIT: "1",
    })
    .nothrow();
} finally {
  await server.close!();
}
