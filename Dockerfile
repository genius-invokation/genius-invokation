FROM oven/bun:alpine AS install
WORKDIR /usr/src/app
COPY . .
RUN install --frozen-lockfile
RUN bun run build -n web-client server

FROM oven/bun:alpine AS runtime
WORKDIR /usr/src/app
COPY --from=install /usr/src/app .

RUN bun install --frozen-lockfile --production && cd packages/server
WORKDIR /usr/src/app/packages/server
CMD ["bun", "run", "src/main.ts"]
