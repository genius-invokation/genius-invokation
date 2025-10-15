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

import { Injectable, type OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "#prisma/client";

// https://github.com/prisma/prisma/discussions/3087
// https://github.com/prisma/prisma/issues/7550

let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  if (process.env.NODE_ENV !== "production") {
    const { default: getPort } = await import("get-port");
    const { unstable_startServer } = await import("@prisma/dev");
    const port = await getPort({ port: 51213 });
    const server = await unstable_startServer({
      name: 'gi-tcg-server-dev',
      port,
      persistenceMode: "stateful",
    });
    connectionString = server.database.connectionString;
    console.log("Started temporary dev Postgres server at", connectionString);
    await Bun.$`bunx prisma migrate dev --skip-generate`.env({
      DATABASE_URL: server.ppg.url,
    });
    console.log(`dev Postgres server migration done.`);
  } else {
    throw new Error("DATABASE_URL is not set");
  }
}

const createPrismaClient = () => {
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter }).$extends({
    name: "findManyAndCount",
    model: {
      $allModels: {
        findManyAndCount<Model, Args>(
          this: Model,
          args: Prisma.Exact<Args, Prisma.Args<Model, "findMany">>,
        ): Promise<[Prisma.Result<Model, Args, "findMany">, number]> {
          return prisma.$transaction([
            (this as any).findMany(args),
            (this as any).count({ where: (args as any).where }),
          ]) as any;
        },
      },
    },
  });
  return prisma;
};

interface ExtendedPrismaClientT extends ReturnType<typeof createPrismaClient> {}

const ExtendedPrismaClient: new () => ExtendedPrismaClientT =
  function ExtendedPrismaClient() {
    return createPrismaClient();
  } as any;

@Injectable()
export class PrismaService
  extends ExtendedPrismaClient
  implements OnModuleInit
{
  async onModuleInit() {
    await this.$connect();
  }
}
