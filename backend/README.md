# Kia Blog Backend

Backend API for a blog platform built with **NestJS**, **Prisma**, and **PostgreSQL**.

The project includes authentication, role-based authorization, posts, categories, tags, comments, likes, bookmarks, media uploads, and basic admin functionality.

## Tech Stack

- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM
- Neon PostgreSQL for production
- Vercel for deployment
- Cloudinary for media storage
- Resend for email
- Vitest + Supertest for E2E testing
- Swagger / OpenAPI for API documentation

## Main Features

### Authentication

- User registration
- Login
- JWT access tokens
- Refresh tokens
- Logout
- Logout from all sessions
- Email verification
- Forgot password
- Reset password

### Authorization

Three application roles are supported:

- `USER`
- `AUTHOR`
- `ADMIN`

Examples:

- Users can interact with published posts.
- Authors can create and manage their own posts.
- Admins can manage users, roles, categories, and tags.

### Posts

- Create posts
- Draft and published states
- Update and delete owned posts
- Public published post listing
- Pagination
- Search
- Sort by newest or oldest
- Filter by author
- Filter by category
- Filter by tag

### Categories and Tags

- Public listing
- Admin-only create, update, and delete operations

### Comments

- Comment on published posts
- Reply to comments
- Nested replies
- Update own comments
- Delete own comments
- Admin moderation

### Likes

- Like a published post
- Remove a like
- Prevent duplicate likes
- Public like count

### Bookmarks

- Bookmark published posts
- Remove bookmarks
- List the authenticated user's bookmarks

### Media

- Image upload
- Image deletion
- Avatar upload and replacement
- JPEG, PNG, and WebP support
- Maximum upload size: 5 MB
- Cloudinary storage

## API Documentation

Swagger UI is available at:

```text
/api
```

Local example:

```text
http://localhost:3000/api
```

Production:

```text
https://kia-blog-pi.vercel.app/api
```

Swagger can also be used to test authenticated endpoints using a JWT access token through the **Authorize** button.

The generated OpenAPI JSON is available at:

```text
/api-json
```

## Requirements

Install the following before running the project locally:

- Node.js
- npm
- PostgreSQL

## Installation

Clone the repository and enter the backend directory:

```bash
git clone https://github.com/Kianibound/kia-blog.git
cd kia-blog/backend
```

Install dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env` file based on `.env.example`.

Example:

```env
# Application
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# CORS
CORS_ORIGINS=http://localhost:3001

# Database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DIRECT_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE

# JWT
JWT_ACCESS_SECRET=replace_with_a_strong_secret
JWT_ACCESS_EXPIRES_IN=3600
JWT_REFRESH_SECRET=replace_with_another_strong_secret

# Email
EMAIL_ENABLED=false
RESEND_API_KEY=replace_with_resend_api_key
EMAIL_FROM=no-reply@example.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=replace_with_cloud_name
CLOUDINARY_API_KEY=replace_with_api_key
CLOUDINARY_API_SECRET=replace_with_api_secret
```

Never commit real secrets to Git.

## Database Connections

The project uses two database connection variables:

```text
DATABASE_URL
```

Used by the running NestJS application.

In production this should normally use the pooled PostgreSQL connection.

```text
DIRECT_URL
```

Used by Prisma CLI operations such as migrations and production seeding.

In production this should use the direct PostgreSQL connection.

For local development, both variables can point to the same local PostgreSQL database.

Example:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/blog_db
DIRECT_URL=postgresql://postgres:password@localhost:5432/blog_db
```

## Prisma Setup

Generate the Prisma client:

```bash
npm run prisma:generate
```

Run development migrations:

```bash
npx prisma migrate dev
```

Seed the development database:

```bash
npm run prisma:seed
```

## Development

Start the application in watch mode:

```bash
npm run start:dev
```

The API runs by default at:

```text
http://localhost:3000
```

Health check:

```text
GET /health
```

Example response:

```json
{
  "status": "ok",
  "timestamp": "2026-10-03T10:00:00.000Z"
}
```

## Testing

Run E2E tests:

```bash
npm run test:e2e
```

The E2E suite covers critical flows including:

- Registration and login
- JWT authentication
- Refresh tokens
- Logout
- Role-based authorization
- Posts
- Ownership rules
- Comments and replies
- Likes
- Bookmarks
- Media uploads
- Avatar replacement

### Important

E2E tests create and modify data.

Always run them against a development/local database.

Do **not** run the E2E suite against the production Neon database.

## Build

Build the application:

```bash
npm run build
```

Run the compiled production build locally:

```bash
npm run start:prod
```

## Database Migration Workflow

### Development

Change the Prisma schema and create a migration using:

```bash
npx prisma migrate dev --name migration_name
```

If you only want to create the migration file without applying it:

```bash
npx prisma migrate dev --name migration_name --create-only
```

Test the migration locally before deploying it.

### Production

Production migrations should only apply already-created and committed migration files:

```bash
npm run prisma:migrate:deploy
```

Avoid using these commands against the production database:

```bash
npx prisma migrate dev
npx prisma migrate reset
npx prisma db push --accept-data-loss
```

## Production Seeding

Production seeding only creates the required application roles:

```text
USER
AUTHOR
ADMIN
```

Development-only test posts are not created when:

```env
NODE_ENV=production
```

Run the seed using:

```bash
npm run prisma:seed
```

## Deployment

The backend is deployed using:

```text
Vercel
```

Production database:

```text
Neon PostgreSQL
```

Production API:

```text
https://kia-blog-pi.vercel.app
```

The Vercel project requires the application environment variables to be configured in the Vercel dashboard.

Because the project uses NestJS 12 with its current module setup, Vercel also uses:

```env
NODE_OPTIONS=--experimental-require-module
```

## Production Architecture

```text
Client
  |
  v
Vercel
  |
  v
NestJS API
  |
  +--> Neon PostgreSQL
  |
  +--> Cloudinary
  |
  +--> Resend
```

## Useful Commands

```bash
# Development server
npm run start:dev

# Build
npm run build

# Production start
npm run start:prod

# Prisma client generation
npm run prisma:generate

# Development migration
npx prisma migrate dev

# Production migration
npm run prisma:migrate:deploy

# Seed
npm run prisma:seed

# E2E tests
npm run test:e2e

# Lint
npm run lint

# Format
npm run format
```

## Project Status

The backend MVP currently includes:

- Authentication
- JWT and refresh tokens
- Roles and authorization
- Posts
- Categories
- Tags
- Comments and replies
- Likes
- Bookmarks
- Media and avatars
- Admin endpoints
- Security headers
- CORS
- Rate limiting
- Critical E2E tests
- Swagger API documentation
- Production deployment
- Production PostgreSQL database

Features such as social OAuth, following authors, newsletters, and advanced analytics are outside the current MVP scope.