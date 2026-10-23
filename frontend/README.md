# Kia Blog frontend

Foundation only: Next.js App Router, strict TypeScript, Tailwind CSS v4,
ESLint, npm, Persian and RTL. Backend remains a separate application.

Use Node.js 24 LTS (`.nvmrc`). From this directory:

```sh
npm ci
npm run dev
npm run lint
npm run build
npm run typecheck
npm start
```

Development and production preview use http://localhost:3001; Nest uses 3000.
Run the build before standalone type checking on a clean checkout so Next's
generated route types exist. `.env.example` reserves a server-only API origin
for future integration; the foundation does not call an API or handle tokens.

## Conventions

- `src/app/`: routes and layouts. Keep Server Components as the default.
- `src/i18n/config.ts`: current document language/direction.
- `src/i18n/messages/fa.ts`: app copy and metadata. No language switch or
  multilingual routing yet. English support can later add a dictionary and
  locale selection without moving business logic.
- `src/lib/`: official VibeFarsi utilities; no generic API architecture yet.
- `src/app/globals.css`: official Graphite theme and Tailwind token mapping.
- Use logical classes (`ps-*`, `me-*`, `text-start`); scope LTR to email/code.

VibeFarsi 2.0.0 was initialized with the official CLI. No UI components are
installed yet. Before each feature, query its MCP/registry, inspect the actual
component API and install only the required slugs:

```sh
npx vibefarsi@2.0.0 list
npx vibefarsi@2.0.0 add <verified-slug>
```

The default Graphite theme is provisional, not an approved product design.
Vazirmatn uses `next/font/google`, which downloads font assets at build time
and self-hosts them in the output. A network-restricted build may need a
reviewed local-font alternative.

Read `../docs/BACKEND_INTEGRATION_READINESS.md` and
`../docs/FRONTEND_FOUNDATION.md` before implementing features.
