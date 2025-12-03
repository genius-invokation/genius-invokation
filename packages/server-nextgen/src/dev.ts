import { PGlite } from "@electric-sql/pglite";
import path from "node:path";
import { $ } from "bun";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./db/schema";

if (process.env.NODE_ENV === "production") {
  throw new Error("dev.ts should not be used in production");
}

// Use PGlite for development - no external PostgreSQL needed!
const pgliteDir = path.resolve(import.meta.dirname, "../.pglite");
console.log("Starting PGlite database at:", pgliteDir);

const pglite = new PGlite(pgliteDir);

// Set DATABASE_URL for the development server to use PGlite
const DATABASE_URL = `pglite://${pgliteDir}`;
process.env.DATABASE_URL = DATABASE_URL;

console.log("✓ PGlite database initialized");

// Run migrations
console.log("Running database migrations...");
await $`bunx drizzle-kit push`.env({
  DATABASE_URL,
}).quiet();
console.log("✓ Database migrations complete");

// Start the server with watch mode
console.log("Starting development server on http://localhost:3000");
await $`bun --watch ${path.resolve(import.meta.dirname, "main.ts")}`.env({
  DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-in-production",
  NODE_ENV: "development",
}).nothrow();

