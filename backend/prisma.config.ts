import 'dotenv/config';
import { defineConfig } from 'prisma/config';
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // DIRECT_URL is only needed when actually connecting (migrate / runtime).
    // `prisma generate` runs at build time, when Faable does not inject app
    // secrets yet, so fall back to a dummy URL that is never used to connect.
    url: process.env.DIRECT_URL ?? 'postgresql://postgres:postgres@localhost:5432/postgres',
  },
});
