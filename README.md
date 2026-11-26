# Kia Blog

A Persian (Farsi) blog platform with a separate API backend and web frontend.
Readers can browse published articles, and signed-in users can write articles,
comment, like, and bookmark. An admin panel manages users, authors, categories,
tags, comments, and articles.

- **Live site:** https://kia-blog-chi.vercel.app/
- **Live API:** https://kia-blog-2d2of.faable.link
- **API docs (Swagger):** https://kia-blog-2d2of.faable.link/api

## Tech Stack

| Layer | Technology |
| --- | --- |
| Backend | NestJS 12, TypeScript, Prisma |
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS v4 |
| Database | PostgreSQL (Neon in production) |
| Media storage | Cloudinary |
| Email | Resend |
| Sessions | Server-only sessions (Upstash Redis, frontend) |
| Deployment | Backend on Faable, frontend on Vercel |

## Features

- **Authentication** — sign up / sign in with email, Google, or GitHub.
  JWT access + refresh tokens, email verification, forgot/reset password.
  Tokens never enter browser JavaScript; the frontend keeps them server-side
  behind an opaque `HttpOnly` session cookie.
- **Articles** — authors write rich articles (Tiptap editor), save drafts,
  publish, unpublish, and edit. Published articles require at least one
  category. Public feed with pagination, search, sorting, and filtering by
  author, category, or tag.
- **Categories & tags** — public listing; admin-only create, update, and delete.
- **Comments** — nested replies on published articles, with admin moderation
  (new comments start as pending and become public only after approval).
- **Likes & bookmarks** — like published articles and keep a personal
  bookmark list.
- **Media** — image uploads and avatars via Cloudinary (JPEG/PNG/WebP, max 5 MB),
  plus optional article cover images.
- **Admin** — manage users and roles (`USER`, `AUTHOR`, `ADMIN`), create and
  deactivate authors, moderate comments, manage taxonomy, and permanently
  delete articles (admin-only).

## Project Structure

```text
kia-blog/
├── backend/    # NestJS API (port 3000)
│   ├── src/    # Modules: auth, posts, comments, media, admin, ...
│   └── prisma/ # Schema, migrations, seed
└── frontend/   # Next.js App Router (port 3001), Persian RTL UI
    └── src/
```

See `backend/README.md` for the full API contract and
`frontend/README.md` for frontend conventions.

## Running Locally

Requirements: Node.js 22+ (the frontend `.nvmrc` pins Node 24 LTS), npm,
and PostgreSQL for local development.

### Backend

```bash
cd backend
cp .env.example .env   # fill in the variables below
npm install
npm run prisma:generate
npx prisma migrate dev
npm run prisma:seed    # creates roles (and test posts in development)
npm run start:dev      # http://localhost:3000
```

Health check: `GET http://localhost:3000/health`
Swagger UI: `http://localhost:3000/api`

### Frontend

```bash
cd frontend
cp .env.example .env.local   # set API_BASE_URL to your backend origin
npm ci
npm run dev                  # http://localhost:3001
```

## Environment Variables

Names only — never commit real values. See `backend/.env.example` and
`frontend/.env.example` for templates.

Backend (`backend/.env`):

```text
NODE_ENV, PORT, APP_URL, APP_ORIGIN, CORS_ORIGINS
DATABASE_URL, DIRECT_URL
JWT_ACCESS_SECRET, JWT_ACCESS_EXPIRES_IN, JWT_REFRESH_SECRET
EMAIL_ENABLED, RESEND_API_KEY, EMAIL_FROM
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI
```

Frontend (`frontend/.env.local`):

```text
API_BASE_URL, APP_ORIGIN
SESSION_ENCRYPTION_KEY
UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
SOCIAL_GITHUB_URL, SOCIAL_LINKEDIN_URL, SOCIAL_TWITTER_URL  # optional
```

## Deployment

- **Backend** — deployed on [Faable](https://faable.link) from `main`
  (`node dist/main`, with migrations applied at start). Database is Neon
  PostgreSQL (`DATABASE_URL` pooled, `DIRECT_URL` for Prisma CLI).
- **Frontend** — deployed on [Vercel](https://vercel.com) from `main`.

## Tests

```bash
# Backend (isolated, no database needed)
cd backend && npm test -- --runInBand && npm run test:isolated

# Backend E2E — development database only, never production
cd backend && npm run test:e2e

# Frontend
cd frontend && npm test
```
