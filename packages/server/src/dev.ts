import { unstable_startServer } from "@prisma/dev";
import { $ } from "bun";
import getPort from "get-port";
import path from "path";

if (process.env.NODE_ENV === "production") {
  throw new Error("Dev server should not be started in production mode");
}

async function startLocalPrisma(name: string) {
  const port = await getPort();

  return await unstable_startServer({
    name,
    port,
    persistenceMode: "stateful",
  });
}

async function localDev() {
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
}

async function remoteDev() {
  await $`bunx prisma migrate dev`.env({
    DATABASE_URL: process.env.DATABASE_URL!,
  });
  await $`bunx prisma generate`;
  await $`bun --watch ${path.resolve(import.meta.dirname, "main.ts")}`
    .env({ DATABASE_URL: process.env.DATABASE_URL! })
    .nothrow();
}

if (process.env.DATABASE_URL) {
  await remoteDev();
} else {
  await localDev();
}
