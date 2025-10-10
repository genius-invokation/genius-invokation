FROM oven/bun:alpine AS base
WORKDIR /app
ARG GIT_MESSAGE GIT_HASH GIT_DATE DEFAULT_ASSETS_API_ENDPOINT

FROM base AS build
COPY . .
RUN bun install --frozen-lockfile && bun run build -n server

FROM base AS deploy
COPY --from=build /app/packages/server/dist/* /app/packages/server/prisma .

ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/libquery_engine-linux-musl-openssl-3.0.x.so.node
CMD ["bun", "main.js"]
