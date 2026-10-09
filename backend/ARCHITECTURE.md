# Kia Blog Backend — Architecture

A visual map of the backend. All diagrams are [Mermaid](https://mermaid.js.org/) and render directly on GitHub.

**Stack:** NestJS · Prisma · PostgreSQL (Neon) · Cloudinary (media) · Resend (email) · Vercel (deploy)

---

## 1. Big picture: modules and external services

Every feature is its own NestJS module. Feature modules import `AuthModule` only to reuse the guards (`JwtAuthGuard`, `RolesGuard`). `DatabaseModule` is `@Global()`, so `PrismaService` is injectable everywhere without being imported.

```mermaid
flowchart LR
    Client([Client / Frontend])

    subgraph App["AppModule"]
        direction TB
        Config["ConfigModule (global)"]
        Throttler["ThrottlerModule<br/>100 req / 60s"]
        DB["DatabaseModule (global)<br/>PrismaService"]

        subgraph Identity["Identity"]
            Auth["AuthModule"]
            Users["UsersModule"]
            Roles["RolesModule"]
            Admin["AdminModule"]
            Mail["MailModule"]
        end

        subgraph Content["Content"]
            Posts["PostsModule"]
            Categories["CategoriesModule"]
            Tags["TagsModule"]
            Comments["CommentsModule"]
            Likes["PostLikesModule"]
            Bookmarks["BookmarksModule"]
            Media["MediaModule"]
        end
    end

    Neon[("Neon PostgreSQL")]
    Cloudinary[["Cloudinary"]]
    Resend[["Resend"]]

    Client -->|HTTP| App

    Auth --> Users
    Auth --> Roles
    Auth --> Mail
    Users --> Roles
    Admin --> Auth
    Admin --> Users

    Posts -.->|guards| Auth
    Categories -.->|guards| Auth
    Tags -.->|guards| Auth
    Comments -.->|guards| Auth
    Likes -.->|guards| Auth
    Bookmarks -.->|guards| Auth
    Media -.->|guards| Auth

    DB --> Neon
    Media --> Cloudinary
    Mail --> Resend
```

Solid arrows = real business dependency. Dotted arrows = "imports AuthModule just for the guards".

---

## 2. Database model

```mermaid
erDiagram
    ROLE ||--o{ USER : "has many"
    USER ||--o{ REFRESH_TOKEN : owns
    USER ||--o{ EMAIL_VERIFICATION_TOKEN : owns
    USER ||--o{ PASSWORD_RESET_TOKEN : owns
    USER ||--o{ POST : writes
    USER ||--o{ COMMENT : writes
    USER ||--o{ POST_LIKE : gives
    USER ||--o{ BOOKMARK : saves
    USER ||--o{ MEDIA : uploads
    USER |o--o| MEDIA : "avatar"

    POST ||--o{ COMMENT : receives
    POST ||--o{ POST_LIKE : receives
    POST ||--o{ BOOKMARK : receives
    POST }o--o{ CATEGORY : "belongs to"
    POST }o--o{ TAG : "tagged with"
    COMMENT |o--o{ COMMENT : "replies"

    USER {
        string id PK
        string email UK
        string username UK
        string passwordHash
        boolean emailVerified
        string roleId FK
        string avatarMediaId FK
    }
    POST {
        string id PK
        string slug UK
        string title
        string content
        enum status "DRAFT | PUBLISHED | DEPRECATED"
        string authorId FK
    }
    COMMENT {
        string id PK
        string postId FK
        string authorId FK
        string parentId FK
    }
    MEDIA {
        string id PK
        string publicId UK
        string url
        string ownerId FK
    }
    ROLE {
        string id PK
        string name UK
    }
```

Notes:
- `POST_LIKE` and `BOOKMARK` have a composite unique on `(userId, postId)`, so a user can like or bookmark a post only once.
- Deleting a `USER` cascades to their posts, comments, tokens, likes, bookmarks and media. Deleting a `COMMENT` cascades to its replies.
- Token tables store a **hash** of the token, never the raw value.

---

## 3. Inside the auth system

`AuthService` is the orchestrator. The real work is split into small single-purpose services.

```mermaid
flowchart TB
    AC["AuthController<br/>/auth/*"] --> AS["AuthService"]

    AS --> US["UsersService"]
    AS --> TS["TokenService<br/>sign / verify JWT"]
    AS --> SS["SessionService<br/>refresh tokens"]
    AS --> EV["EmailVerificationService"]
    AS --> PR["PasswordResetService"]
    AS --> RS["RolesService"]

    SS --> TS
    EV --> MS["MailService"]
    PR --> MS
    MS --> Resend[["Resend"]]

    TS --> JWT["JwtService"]
    US --> RS

    SS --> P[("Prisma: RefreshToken")]
    EV --> P2[("Prisma: EmailVerificationToken")]
    PR --> P3[("Prisma: PasswordResetToken")]
    US --> P4[("Prisma: User")]
```

---

## 4. Life of a request

```mermaid
flowchart LR
    R([Request]) --> H["helmet<br/>security headers"]
    H --> C["CORS<br/>CORS_ORIGINS"]
    C --> T["ThrottlerGuard<br/>global rate limit"]
    T --> J["JwtAuthGuard<br/>valid access token?"]
    J --> RG["RolesGuard<br/>role allowed?"]
    RG --> V["ValidationPipe<br/>whitelist + transform"]
    V --> Ctl["Controller"]
    Ctl --> Svc["Service<br/>business logic"]
    Svc --> Pr["PrismaService"]
    Pr --> DB[("PostgreSQL")]
    Svc -. error .-> F["PrismaExceptionFilter"]
    F -.-> Resp
    Svc --> Resp([Response])
```

`JwtAuthGuard` and `RolesGuard` only run on routes that declare them with `@UseGuards(...)`. Public routes skip straight from the throttler to validation.

---

## 5. Endpoint map by access level

| Area | Public | Logged in | AUTHOR / ADMIN | ADMIN only |
|---|---|---|---|---|
| **Auth** `/auth` | register, login, refresh, logout, verify-email, forgot-password, reset-password | me, logout-all | | |
| **Posts** `/posts` | list, get by slug | | create, mine, mine/:id, update, delete | by-id/:id |
| **Categories** `/categories` | list | | | create, update, delete |
| **Tags** `/tags` | list | | | create, update, delete |
| **Comments** | list on post | create, reply, edit, delete | | |
| **Likes** | count on post | like, unlike | | |
| **Bookmarks** | | bookmark, unbookmark, list mine | | |
| **Media** `/media` | | upload image, delete, set avatar | | |
| **Admin** `/admin` | | | | list users, get user, change role |
| **App** | `/`, `/health` | | | |

Roles: `USER`, `AUTHOR`, `ADMIN`.

---

## 6. Folder layout

```mermaid
flowchart LR
backend/
├── prisma/                 schema + migrations
├── src/
│   ├── main.ts             bootstrap: helmet, Swagger, CORS, ValidationPipe, filter
│   ├── app.module.ts       root module, global throttler guard
│   ├── database/           PrismaService (global)
│   ├── common/filters/     PrismaExceptionFilter
│   ├── auth/               controller, service, guards, decorators, token/session/email services
│   ├── users/ roles/ admin/ mail/
│   ├── posts/ categories/ tags/ comments/ post-likes/ bookmarks/ media/
│   └── generated/prisma/   auto-generated client (do not edit)
└── test/                   e2e tests (Vitest + Supertest)
```

Each feature folder follows the same pattern: `*.module.ts` → `*.controller.ts` → `*.service.ts`, plus `dto/` for input validation and `*.spec.ts` for unit tests.
