// Prisma CLI (migrate/studio) connects directly — it does not go through the
// Neon WebSocket adapter used by the app at runtime (src/server/db/client.ts).
// So this loads DATABASE_URL_UNPOOLED (direct), not DATABASE_URL (pooled).
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx --env-file=.env.local prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL_UNPOOLED"],
  },
});
