# @gi-tcg/server-nextgen

Next-generation server implementation using ElysiaJS and Drizzle ORM.

## Overview

This is a complete rewrite of the `@gi-tcg/server` package using modern technologies:
- **ElysiaJS**: Fast, ergonomic web framework for Bun
- **Drizzle ORM**: TypeScript-first ORM with excellent type safety
- **Bun**: JavaScript runtime with native TypeScript support
- **PGlite**: Embedded PostgreSQL for development (zero setup!)

## Architecture

The server maintains the same API endpoints as the original NestJS implementation:
- `/auth` - GitHub OAuth and guest authentication
- `/users` - User profile management
- `/decks` - Deck creation, listing, and management
- `/games` - Game history and records
- `/rooms` - Real-time game rooms with SSE support

## Database

Uses PostgreSQL with Drizzle ORM. The schema matches the existing Prisma schema to maintain compatibility.

**Development**: Uses PGlite (embedded PostgreSQL) - no external database needed!
**Production**: Uses regular PostgreSQL

### Migration from original server

The database schema is compatible with the existing Prisma-based server. You can use the same PostgreSQL database.

## Development

```bash
# Install dependencies
bun install

# Run development server (with auto-reload)
# No database setup needed - uses PGlite automatically!
bun run dev

# Check types
bun run check
```

The dev server uses PGlite, an embedded PostgreSQL database that runs in-process. No Docker, no PostgreSQL installation needed - just run `bun run dev` and start coding!

## Building

```bash
# Build for production
bun run build

# Run production build
bun run start:prod
```

## Environment Variables

**Development** (all optional, sensible defaults provided):
- `JWT_SECRET` - Secret for JWT token signing (defaults to dev secret)
- `GH_CLIENT_ID` - GitHub OAuth client ID (optional for local testing)
- `GH_CLIENT_SECRET` - GitHub OAuth client secret (optional for local testing)
- `PORT` - Server port (default: 3000)

**Production** (required):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing
- `GH_CLIENT_ID` - GitHub OAuth client ID
- `GH_CLIENT_SECRET` - GitHub OAuth client secret
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Should be set to "production"

## Key Differences from Original

1. **Framework**: ElysiaJS instead of NestJS
2. **ORM**: Drizzle instead of Prisma
3. **Validation**: Elysia's built-in type validation instead of class-validator
4. **Dependency Injection**: Removed in favor of direct imports (simpler, faster)
5. **Performance**: Significantly faster startup and response times with Bun
6. **Development**: PGlite for zero-setup local development

## Compatibility

Maintains full API compatibility with the original server, allowing seamless migration.
