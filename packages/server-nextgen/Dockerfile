FROM oven/bun:1.3 AS base
WORKDIR /app

# Install dependencies
FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build the application
FROM base AS build
COPY --from=install /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Production image
FROM base AS production
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=install /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 3000
CMD ["bun", "run", "start:prod"]
