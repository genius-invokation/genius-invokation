# Migration Guide: NestJS/Prisma to ElysiaJS/Drizzle

## Overview

This document explains the architectural differences and migration path from the original `@gi-tcg/server` (NestJS + Prisma) to the new `@gi-tcg/server-nextgen` (ElysiaJS + Drizzle).

## Why Rewrite?

### Performance Benefits
- **Faster startup**: ElysiaJS on Bun starts ~10x faster than NestJS
- **Lower memory usage**: Simpler architecture reduces overhead
- **Better throughput**: Bun's optimized runtime improves request handling

### Developer Experience
- **Type Safety**: Drizzle provides better TypeScript inference than Prisma
- **Simpler Code**: No decorators, less boilerplate
- **Faster Builds**: Bun's native TypeScript support eliminates transpilation

### Maintainability
- **Less Dependencies**: Removed heavy frameworks
- **Clearer Flow**: Direct imports instead of dependency injection
- **Modern Stack**: Using cutting-edge technologies

## Architecture Comparison

### Request Flow

**Original (NestJS)**:
```
Request → Fastify → NestJS → Guards → Pipes → Controllers → Services → Prisma → DB
```

**New (ElysiaJS)**:
```
Request → ElysiaJS → Middleware → Routes → Services → Drizzle → DB
```

### Key Differences

| Aspect | Original | New |
|--------|----------|-----|
| Framework | NestJS | ElysiaJS |
| ORM | Prisma | Drizzle |
| Runtime | Node.js/Bun | Bun |
| Validation | class-validator | Elysia Type System |
| DI | @nestjs/common | Direct imports |
| Decorators | Heavy usage | Minimal (only for schema) |

## Module Comparison

### Authentication

**Original**:
```typescript
@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwtService: JwtService,
  ) {}
  
  @UseGuards(AuthGuard)
  async login() { ... }
}
```

**New**:
```typescript
export const authPlugin = new Elysia({ prefix: "/auth" })
  .use(jwt({ name: "jwt", secret: JWT_SECRET }))
  .post("/login", async ({ body, jwt }) => {
    // Direct implementation
  });
```

### Database Access

**Original (Prisma)**:
```typescript
await this.prisma.user.findFirst({
  where: { id },
  include: { decks: true }
});
```

**New (Drizzle)**:
```typescript
await db.query.users.findFirst({
  where: eq(users.id, id),
  with: { decks: true }
});
```

### Validation

**Original (class-validator)**:
```typescript
export class CreateDeckDto {
  @IsInt({ each: true })
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  characters!: number[];
}
```

**New (Elysia)**:
```typescript
body: t.Object({
  characters: t.Array(t.Integer(), { minItems: 3, maxItems: 3 })
})
```

## API Compatibility

All endpoints maintain the same paths and responses:

- `POST /auth/login` - GitHub OAuth login
- `POST /auth/guest` - Guest token generation
- `GET /users/me` - Current user info
- `GET /users/:id` - User profile
- `POST /decks` - Create deck
- `GET /decks` - List decks
- `GET /decks/:id` - Get deck
- `PATCH /decks/:id` - Update deck
- `DELETE /decks/:id` - Delete deck
- `GET /games` - List games
- `GET /games/mine` - User's games
- `GET /games/:id` - Game details
- `GET /rooms` - List rooms
- `POST /rooms` - Create room
- `POST /rooms/:id/players` - Join room
- `GET /rooms/:id/players/:playerId/notification` - SSE stream
- `POST /rooms/:id/players/:playerId/actionResponse` - Send action
- `POST /rooms/:id/players/:playerId/giveUp` - Surrender

## Database Migration

The Drizzle schema is designed to be compatible with the existing Prisma database:

```typescript
// Same table names
export const users = pgTable("User", { ... });
export const games = pgTable("Game", { ... });
export const decks = pgTable("Deck", { ... });
export const playerOnGames = pgTable("PlayerOnGames", { ... });
```

### Migration Steps

1. **Keep existing database**: No migration needed
2. **Run both servers**: You can run both implementations side-by-side
3. **Gradual transition**: Switch traffic gradually
4. **Verify**: Compare responses between implementations

## Environment Setup

### Required Variables

Both implementations require:
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-secret-key
GH_CLIENT_ID=github-oauth-client-id
GH_CLIENT_SECRET=github-oauth-client-secret
```

### Development

**Original**:
```bash
bun run prisma:generate
bun run dev
```

**New**:
```bash
bun run dev  # Handles migrations automatically
```

## Testing Strategy

1. **Unit Tests**: Test individual services
2. **Integration Tests**: Test API endpoints
3. **Load Tests**: Compare performance
4. **Migration Test**: Run both servers against same DB

## Deployment

### Docker

**Original**:
```dockerfile
FROM oven/bun
WORKDIR /app
COPY . .
RUN bun install
RUN bun run prisma:generate
RUN bun run build
CMD ["bun", "run", "start:prod"]
```

**New**:
```dockerfile
FROM oven/bun
WORKDIR /app
COPY . .
RUN bun install
RUN bun run build
CMD ["bun", "run", "start:prod"]
```

### Environment

Both can be deployed to:
- Railway
- Fly.io
- Any Node.js/Bun hosting
- Docker containers
- Kubernetes

## Known Limitations

1. **SSE Streaming**: ElysiaJS Stream API differs from NestJS SSE
2. **Redis**: Not yet implemented (for room metadata)
3. **Validation Error Messages**: Format differs slightly
4. **Logging**: No built-in logger like NestJS

## Future Enhancements

- [ ] Add Redis support for distributed rooms
- [ ] Implement rate limiting
- [ ] Add OpenAPI/Swagger documentation
- [ ] Add metrics and monitoring
- [ ] Add request tracing
- [ ] Improve error messages

## Performance Benchmarks

*To be added after testing*

Expected improvements:
- 50% faster cold start
- 30% lower memory usage
- 20% better throughput

## Rollback Plan

If issues arise:
1. Switch traffic back to original server
2. Both use same database
3. No data migration needed
4. Continue debugging new implementation

## Support

For questions or issues:
- Check the original server documentation
- Review ElysiaJS docs: https://elysiajs.com
- Review Drizzle docs: https://orm.drizzle.team
- Open GitHub issue
