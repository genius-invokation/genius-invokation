import getPort from "get-port";
import path from "node:path";
import { $ } from "bun";

if (process.env.NODE_ENV === "production") {
  throw new Error("dev.ts should not be used in production");
}

// For development, we expect DATABASE_URL to be set in environment
// If not set, provide a helpful error message
if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is required for development");
  console.error("Please set DATABASE_URL to your PostgreSQL connection string");
  console.error("Example: DATABASE_URL=postgresql://user:password@localhost:5432/dbname");
  process.exit(1);
}

console.log("Starting development server with database:", process.env.DATABASE_URL);

// Run migrations if needed
console.log("Running database migrations...");
await $`bunx drizzle-kit push`.quiet();
console.log("Database migrations complete.");

// Start the server with watch mode
await $`bun --watch ${path.resolve(import.meta.dirname, "main.ts")}`.nothrow();
