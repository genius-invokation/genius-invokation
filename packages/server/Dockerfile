FROM oven/bun:alpine AS base
WORKDIR /app
ARG DEFAULT_ASSETS_API_ENDPOINT

FROM base AS build
COPY . .
RUN bun install --frozen-lockfile && bun run build -n server

FROM ghcr.io/distroless/base AS deploy
COPY --from=build /app/packages/server/dist/* /app/packages/server/prisma ./

CMD ["./main"]
