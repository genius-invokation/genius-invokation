FROM oven/bun:1-alpine AS base

FROM base AS build
WORKDIR /app
COPY . ./
RUN apk add --no-cache git && bun install && bun run build -n server

FROM base AS deploy
WORKDIR /app
ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/libquery_engine-linux-musl-openssl-3.0.x.so.node \
  DATABASE_URL=file:/db/dev.db
COPY --from=build /app/packages/server/dist/* /app/packages/server/prisma ./
RUN mkdir node_modules && mkdir -p /db && bunx prisma migrate deploy

CMD ["bun", "/app/main.js"]
