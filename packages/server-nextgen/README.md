# @gi-tcg/server-nextgen

Next-generation server implementation using ElysiaJS and Drizzle ORM.

## Overview

This is a complete rewrite of the `@gi-tcg/server` package using modern technologies:
- **ElysiaJS**: Fast, ergonomic web framework for Bun
- **Drizzle ORM**: TypeScript-first ORM with excellent type safety
- **Bun**: JavaScript runtime with native TypeScript support

## Architecture

The server maintains the same API endpoints as the original NestJS implementation:
- `/auth` - GitHub OAuth and guest authentication
- `/users` - User profile management
- `/decks` - Deck creation, listing, and management
- `/games` - Game history and records
- `/rooms` - Real-time game rooms with SSE support

## Database

Uses PostgreSQL with Drizzle ORM. The schema matches the existing Prisma schema to maintain compatibility.

### Migration from original server

The database schema is compatible with the existing Prisma-based server. You can use the same PostgreSQL database.

## Development

```bash
# Install dependencies
bun install

# Set up environment variables
export DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Run development server (with auto-reload)
bun run dev

# Check types
bun run check
```

## Building

```bash
# Build for production
bun run build

# Run production build
bun run start:prod
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (required)
- `JWT_SECRET` - Secret for JWT token signing
- `GH_CLIENT_ID` - GitHub OAuth client ID
- `GH_CLIENT_SECRET` - GitHub OAuth client secret
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)

## Key Differences from Original

1. **Framework**: ElysiaJS instead of NestJS
2. **ORM**: Drizzle instead of Prisma
3. **Validation**: Elysia's built-in type validation instead of class-validator
4. **Dependency Injection**: Removed in favor of direct imports (simpler, faster)
5. **Performance**: Significantly faster startup and response times with Bun

## Compatibility

Maintains full API compatibility with the original server, allowing seamless migration.
