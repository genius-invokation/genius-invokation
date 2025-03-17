FROM oven/bun:1-alpine

WORKDIR /app

ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/libquery_engine-linux-musl-openssl-3.0.x.so.node \
  DATABASE_URL=file:/db/dev.db

COPY packages/server/dist/* packages/server/prisma ./

RUN mkdir node_modules && mkdir -p /db && bunx prisma migrate deploy

CMD ["bun", "/app/main.js"]
