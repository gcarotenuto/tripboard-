#!/usr/bin/env node
/**
 * swap-db-provider.js
 * Run at Vercel build time to replace `provider = "sqlite"` with
 * `provider = "postgresql"` in the shared Prisma schema.
 * Local dev is unaffected — this script is only called in the Vercel build command.
 */
const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "../../../prisma/schema.prisma");

if (!fs.existsSync(schemaPath)) {
  console.error("✗ schema.prisma not found at", schemaPath);
  process.exit(1);
}

let schema = fs.readFileSync(schemaPath, "utf8");

if (schema.includes('provider = "postgresql"')) {
  console.log("✓ schema.prisma already uses postgresql — skipping swap");
  process.exit(0);
}

if (!schema.includes('provider = "sqlite"')) {
  console.error("✗ schema.prisma does not contain provider = \"sqlite\" — cannot swap");
  process.exit(1);
}

schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
fs.writeFileSync(schemaPath, schema, "utf8");
console.log("✓ Swapped SQLite → PostgreSQL in schema.prisma");
