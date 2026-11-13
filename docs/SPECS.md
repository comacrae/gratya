# Grat v2 — Build Specs

_Written 2026-11-11. Revised 2026-11-11 (revision 2; see "What changed in revision 2" at the end)._

## How to use this document

Each milestone is written so you can build it yourself with Claude in tutor mode. A good opening prompt is:

> I'm working on Milestone 4, step 3 of docs/SPECS.md. Tutor me through it; don't write the code for me.

Every milestone has the same sections:

- **Goal** — one sentence on what exists when you're done.
- **Size** — S, M or L. A rough guide to effort, not a deadline. S is a sitting or two. L is the better part of two weeks of evenings.
- **Concepts** — what you'll learn. Ask the tutor to explain any you don't know before you start. Every term is also in the glossary (Part J).
- **Steps** — in order. Most are one sitting. Some end with a **Check:** line, which is a command or action that proves the step worked before you move on.
- **Acceptance** — the checks you run before opening the PR. If one fails, you're not done.
- **Pitfalls** — the mistakes that cost the most time.
- **Be able to explain** — questions you should be able to answer afterward without looking anything up. If you can't, ask the tutor to quiz you.

Open one PR per milestone unless a milestone says otherwise. Every PR description says what changed, how you tested it, and anything you're unsure about.

Three rules for when things go wrong:

1. **Read the error message first, all of it.** Most errors say what is wrong and where.
2. **The 30-minute rule.** If you've been stuck for 30 minutes, stop and ask the tutor. Paste the exact error and say what you already tried.
3. **Current docs beat this spec.** Tools change. If a command or config in this spec doesn't match the tool's current official documentation, follow the documentation and add a line to `docs/DECISIONS.md`. Revision 1 of this spec had Prisma 6 syntax in it; that kind of drift will happen again.

---

## The big picture

**Grat** is a gratitude journal. You write a post made of 1 to 10 short items, each with an optional photo. A post is either private or shared with one **circle**, a small group that people join with an invite code.

```
 ┌──────────┐  Bearer token  ┌──────────────┐  Prisma   ┌──────────────┐
 │  Phone   │───────────────▶│ Next.js API  │──────────▶│  Postgres    │
 │  (Expo)  │                │  (Vercel)    │           │  (Supabase)  │
 └────┬─────┘                └──────┬───────┘           └──────────────┘
      │ sign in / sign up           │ secret key
      ▼                             ▼
 ┌──────────┐                ┌──────────────┐
 │ Supabase │                │   Storage    │◀── the phone uploads photos
 │   Auth   │                │  post-media  │    straight here, using a signed
 └──────────┘                └──────────────┘    URL the API hands out
```

**Life of one request** (you build this path in Milestones 1 to 4, and every later feature reuses it):

1. The user signs in. Supabase Auth gives the phone an access token (a JWT).
2. The phone calls your API with `Authorization: Bearer <token>`.
3. The API verifies the token to learn *who* is calling (authentication).
4. The API validates the request body with a Zod schema.
5. The API checks whether this user may do this thing (authorization, in `lib/permissions.ts`).
6. The API reads or writes Postgres through Prisma.
7. The API returns JSON, and TanStack Query on the phone caches it and re-renders the screen.

The one rule everything hangs on: **the phone never talks to the database or Storage directly.** The API is the only door, so there is exactly one place to get security right.

### What each milestone teaches

| Milestone | Core full-stack concept | What it lets you say in an interview |
|---|---|---|
| M1 Skeleton | Client and server, monorepos | "I set up a TypeScript monorepo with a React Native app and a Node API sharing code." |
| M2 Schema | Relational modelling, migrations | "I designed a Postgres schema and manage it with versioned migrations." |
| M3 Auth | Authentication, JWTs | "The API verifies JWTs server-side; it never trusts a user ID from the client." |
| M4 Private posts | REST, validation, transactions, pagination, testing | "I built and tested a CRUD API with keyset pagination and transactional writes." |
| M5 CI and deploy | CI/CD, environments, config as code | "Every PR runs lint, types and tests against a real Postgres before it can merge." |
| M6 Circles | Authorization, many-to-many data | "I wrote the permission layer and the tests that prove non-members are locked out." |
| M7 Photos | Object storage, signed URLs | "Uploads go direct to object storage with signed URLs, the same pattern as S3." |
| M8 TestFlight | Monitoring, release pipelines | "It's on real phones, with error monitoring and source maps." |
| M11 Events | Async work, queues, idempotency | "I built a transactional job queue on Postgres with retries and a dead-letter state." |
| M12 AWS | Cloud infrastructure, infrastructure as code, IAM | "I moved delivery to SQS and Lambda, provisioned with Terraform under least-privilege IAM." |

Infrastructure as code doesn't appear from nowhere in M12. You practise the idea three times before that: Prisma migrations are your schema as code (M2), `supabase/config.toml` is your local platform as code (M2), and `ci.yml` is your pipeline as code (M5). Terraform in M12 is the same idea applied to cloud resources.

### Deliberately not in this project

| Left out | Why |
|---|---|
| Running the core app on AWS (RDS, Cognito, ECS) | It adds weeks of networking and IAM work before you have a working app, and it teaches operations rather than full-stack development. M12 adds AWS where it solves a real problem. |
| Writing Dockerfiles, Kubernetes | Vercel and Lambda don't need them. You do use Docker daily (the local Supabase stack runs in it), which is the part most roles expect. |
| Microservices, GraphQL, Redis | Nothing in this app needs them. Adding technology the product doesn't need is the mistake interviewers look for. |

A finished, shipped app with one well-explained AWS slice is worth more than a half-built app that touches every logo.

---

## Part A — Fixed decisions

These are settled. Don't reopen them mid-build; write a note in `docs/DECISIONS.md` if you change one later.

| Area | Decision |
|---|---|
| Repo | `comacrae/gratya` on GitHub. pnpm workspaces monorepo: `apps/mobile`, `apps/server`, `packages/shared`. Packages are scoped `@gratya/*`. |
| Branching | `main` only. Feature branch per PR. Squash merge. Never commit straight to `main`. |
| Mobile | Expo (managed), TypeScript, Expo Router, TanStack Query, React Hook Form + Zod, NativeWind, expo-secure-store |
| API | Next.js (App Router, route handlers only, no pages), Prisma 7, Zod, Vitest |
| Platform | Supabase for Postgres, Auth, Storage. Vercel for the API. EAS for app builds. Sentry for errors. AWS only in Milestone 12. |
| Schema owner | Prisma migrations. Never change tables in the Supabase dashboard. |
| Data access | The phone never talks to Postgres or Storage directly. The Supabase **Data API is disabled** in both hosted projects and locally. Every table has row-level security enabled with no policies, as a second lock in case the Data API is ever switched back on. |
| Auth | Supabase Auth, email + password only for MVP. |
| User rows | The API creates the `User` row the first time it sees a valid token for that user (get-or-create in `requireUser`). No DB triggers. |
| Environments | `local` (Supabase CLI in Docker), `staging` (hosted project `gratya-staging`, Vercel previews), `production` (hosted project `gratya-prod`, Vercel prod) |
| IDs | UUIDs everywhere except `jobs.id` (bigserial, Milestone 11) |
| Timestamps | Stored as `timestamptz`. Named `createdAt` / `updatedAt` (`joinedAt` on memberships). Never set by clients: `createdAt` is a database default, `updatedAt` is set by Prisma Client. |

---

## Part B — Conventions

### B0. The PR loop

You repeat this for every milestone. If any command here is new to you, ask the tutor to walk through it during Milestone 0.

1. `git switch main && git pull` to start from the latest `main`.
2. `git switch -c m1-skeleton` to create a branch named after the milestone.
3. Work in small commits. A commit message says what changed and why in one line.
4. `git push -u origin m1-skeleton`, then `gh pr create`.
5. Wait for CI (from Milestone 5 on). Read your own diff in the GitHub UI top to bottom before merging.
6. Squash merge. Delete the branch. Close the milestone's issue on the project board.

### B1. Folder layout

```
gratya/
├── apps/
│   ├── mobile/
│   │   ├── app/                  Expo Router screens
│   │   │   ├── (auth)/           login.tsx, signup.tsx
│   │   │   ├── (tabs)/           journal.tsx, circles.tsx, settings.tsx
│   │   │   ├── post/             new.tsx, [id].tsx
│   │   │   └── circle/           new.tsx, join.tsx, [id].tsx
│   │   ├── lib/                  api.ts (fetch wrapper), supabase.ts, auth.tsx (session context)
│   │   ├── features/             one folder per resource: posts/, circles/ — hooks + components
│   │   └── components/ui/        shared primitives (Button, Input, Screen)
│   ├── server/
│   │   ├── app/api/              route handlers, one folder per resource
│   │   ├── lib/
│   │   │   ├── prisma.ts         singleton client
│   │   │   ├── auth.ts           requireUser()
│   │   │   ├── permissions.ts    all authorization rules
│   │   │   ├── errors.ts         ApiError + handler wrapper
│   │   │   ├── storage.ts        signed URL helpers
│   │   │   └── validate.ts       parse body with a Zod schema → 422 on failure
│   │   ├── prisma/               schema.prisma, migrations/
│   │   ├── prisma.config.ts      Prisma CLI config (which database migrations run against)
│   │   ├── generated/            Prisma Client output. Git-ignored; rebuilt by `prisma generate`.
│   │   └── tests/                Vitest; mirrors app/api structure
│   └── worker/                   Milestone 12: the Lambda function
├── packages/
│   └── shared/
│       └── src/
│           ├── schemas/          Zod: posts.ts, circles.ts, uploads.ts, auth.ts
│           └── types.ts          z.infer exports
├── infra/                        Milestone 12: Terraform
├── docs/
│   ├── SPECS.md                  this file
│   └── DECISIONS.md              short dated entries: decision, why, alternatives
├── .github/workflows/ci.yml
├── supabase/                     config.toml only (for `supabase start`); no migrations here
└── README.md
```

### B2. HTTP conventions

- Authentication: `Authorization: Bearer <supabase access token>` on every request except `GET /api/health`.
- Request bodies are JSON and validated with the shared Zod schema. Unknown keys are stripped.
- Success responses return the resource directly (an object or an array). Lists that paginate return `{ items: [...], nextCursor: string | null }`.
- Error responses always have this shape:

```json
{ "error": { "code": "FORBIDDEN", "message": "Only the author can edit this post" } }
```

| Status | Code | When |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Missing or invalid token |
| 403 | `FORBIDDEN` | The caller can see the resource but may not do this to it (see B3) |
| 404 | `NOT_FOUND` | The resource doesn't exist, or the caller isn't allowed to know it exists (see B3) |
| 409 | `CONFLICT` | Invite code generation collided 3 times in a row |
| 422 | `VALIDATION` | Body or query failed Zod; include `details` with Zod's flattened issues |
| 500 | `INTERNAL` | Anything unhandled; logged to Sentry; message is generic |

### B3. Permission rules

All rules live in `apps/server/lib/permissions.ts` as named functions that take `(userId, ...)` and return a boolean or throw `ApiError`. Route handlers call these; they never inline a `where userId = ...` check as their only guard.

| Rule | Definition |
|---|---|
| `canReadPost(user, post)` | user is author, OR post has a circle and user is a member |
| `canWritePost(user, post)` | user is author |
| `canPostToCircle(user, circleId)` | user is a member |
| `canReadCircle(user, circleId)` | user is a member |
| `isCircleOwner(user, circleId)` | circle.ownerId = user |

**One rule decides between 404 and 403, everywhere:**

> If the caller can't *see* the thing, answer 404, exactly as if it didn't exist. If the caller can see it but isn't allowed to do *this action*, answer 403.

A 403 confirms that something exists. Someone who isn't in a circle shouldn't be able to learn anything about it, including whether its ID is real.

| Situation | Response |
|---|---|
| Read, edit or delete someone else's private post | 404 |
| Edit or delete another member's post in a circle you belong to | 403 |
| Anything on a circle you're not a member of (view, feed, post into it, leave, delete) | 404 |
| A member who isn't the owner deletes the circle | 403 |
| The owner tries to leave their own circle | 403 |

### B4. Environment variables

**`apps/server/.env`** (local) / Vercel project settings (staging, production):

| Name | Notes |
|---|---|
| `DATABASE_URL` | What the running API connects with. Hosted: Supabase's **Transaction pooler** string (port 6543). |
| `DIRECT_URL` | What migrations connect with (read by `prisma.config.ts`). Hosted: Supabase's **Session pooler** string (port 5432). Don't use the "Direct connection" string: it is IPv6-only unless you pay for the IPv4 add-on, and most home networks and CI runners can't reach it. Locally, both variables are the same URL. |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase's server-side key: the **secret** key (`sb_secret_…`), called `service_role` on older projects. Server only. Never in the mobile app. |
| `STORAGE_BUCKET` | `post-media` |
| `SENTRY_DSN` | Milestone 8 |
| `CRON_SECRET` | Milestone 11 |
| `SQS_QUEUE_URL`, `GRAT_AWS_REGION`, `GRAT_AWS_ACCESS_KEY_ID`, `GRAT_AWS_SECRET_ACCESS_KEY` | Milestone 12 |

**`apps/mobile/.env`** — all prefixed `EXPO_PUBLIC_`, which means they ship inside the app and must be safe to expose:

| Name | Notes |
|---|---|
| `EXPO_PUBLIC_API_URL` | Local: `http://<your Mac's LAN IP>:3000`. Staging/prod: Vercel URL. |
| `EXPO_PUBLIC_SUPABASE_URL` | |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase's public key: the **publishable** key (`sb_publishable_…`), called `anon` on older projects. Only used for Auth. |
| `EXPO_PUBLIC_SENTRY_DSN` | Milestone 8 |

Commit `.env.example` files with every key and no values. Never commit a real `.env` file. The repo is public.

### B5. Scripts (root `package.json`)

| Script | Does |
|---|---|
| `pnpm dev:server` | `next dev` in apps/server |
| `pnpm dev:mobile` | `expo start` in apps/mobile |
| `pnpm db:migrate` | `prisma migrate dev` against local |
| `pnpm db:deploy` | `prisma migrate deploy` (used by CI and before promoting to staging or prod) |
| `pnpm db:generate` | `prisma generate` (rebuilds the typed client after a schema change or a fresh clone) |
| `pnpm db:studio` | Prisma Studio |
| `pnpm test` | Vitest in apps/server |
| `pnpm lint` / `pnpm typecheck` | Across all workspaces |

---

## Part C — Data model

Prisma 7 splits its setup across three files. Each has one job:

| File | Job | Reads |
|---|---|---|
| `apps/server/prisma/schema.prisma` | Describes the tables | nothing |
| `apps/server/prisma.config.ts` | Tells the Prisma **CLI** which database to run migrations against | `DIRECT_URL` |
| `apps/server/lib/prisma.ts` | Creates the client your **running API** queries with | `DATABASE_URL` |

`apps/server/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id           String         @id                      // = Supabase auth.users.id
  email        String                                  // informational; identity is `id`
  displayName  String?
  createdAt    DateTime       @default(now()) @db.Timestamptz(3)
  posts        Post[]
  memberships  CircleMember[]
  ownedCircles Circle[]
}

model Post {
  id        String     @id @default(uuid())
  authorId  String
  circleId  String?                                    // null = private
  createdAt DateTime   @default(now()) @db.Timestamptz(3)
  updatedAt DateTime   @updatedAt @db.Timestamptz(3)
  author    User       @relation(fields: [authorId], references: [id])
  circle    Circle?    @relation(fields: [circleId], references: [id], onDelete: SetNull)
  items     PostItem[]

  @@index([authorId, createdAt])
  @@index([circleId, createdAt])
}

model PostItem {
  id        String  @id @default(uuid())
  postId    String
  content   String
  photoPath String?                                    // Storage object path, never a URL
  position  Int
  post      Post    @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([postId, position])
}

model Circle {
  id         String         @id @default(uuid())
  name       String
  inviteCode String         @unique
  ownerId    String
  createdAt  DateTime       @default(now()) @db.Timestamptz(3)
  owner      User           @relation(fields: [ownerId], references: [id])
  members    CircleMember[]
  posts      Post[]
}

model CircleMember {
  circleId String
  userId   String
  joinedAt DateTime @default(now()) @db.Timestamptz(3)
  circle   Circle   @relation(fields: [circleId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id])

  @@id([circleId, userId])
  @@index([userId])
}
```

`apps/server/prisma.config.ts`:

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DIRECT_URL") },
});
```

`lib/prisma.ts` creates the client with the Postgres driver adapter (`@prisma/adapter-pg`), passing it `DATABASE_URL`. You write that file in Milestone 2.

Notes on this schema:

- `@db.Timestamptz(3)` is required on every `DateTime`. Without it Prisma creates a `timestamp` column with no time zone, which breaks the Part A decision.
- `User.email` is not unique on purpose. A person's identity is their `id` from Supabase Auth. A unique email would make the API fail with a 500 if an auth account were ever deleted and re-created with the same address.
- Row-level security can't be written in `schema.prisma`. You add it by hand to the migration SQL in Milestone 2.

Rules the schema enforces for you: deleting a post deletes its items; deleting a circle removes memberships and makes its posts private; a user can't join the same circle twice; item positions are unique within a post.

Rules the API must enforce: a post can only be created in a circle the author belongs to; `photoPath` must begin with the author's user ID; a post has between 1 and 10 items; `content` is 1–500 characters after trimming.

---

## Part D — API contract

Shared Zod schemas live in `packages/shared/src/schemas/`. The request shapes below are those schemas.

### `GET /api/health`
No auth. Returns `{ ok: true, db: true }` after running `SELECT 1`. If the DB is unreachable, `{ ok: false, db: false }` with status 503.

### `GET /api/me`
Returns the caller's `User` row, creating it first if this is their first request (see `requireUser` in Milestone 3):
`{ id, email, displayName, createdAt }`.

### `PATCH /api/me`
Body `{ displayName: string (1–40) }`. Returns the user.

### `DELETE /api/me`
Milestone 10. Deletes the user's posts, memberships, owned circles, Storage objects, and finally the Supabase Auth user (via the admin API). Returns 204.

### `GET /api/posts?cursor=&limit=`
Caller's own posts (private and circle), newest first, including items. `limit` default 20, max 50. Returns `{ items: Post[], nextCursor }`.

Pagination is keyset, not `OFFSET`. The cursor is an opaque string the client passes back untouched: the base64url encoding of the last post's `createdAt` and `id` together. The next page is the posts where `(createdAt, id) < (cursor.createdAt, cursor.id)`. A cursor that doesn't decode is a 422.

Post shape in responses:
```json
{
  "id": "…", "authorId": "…", "circleId": null,
  "createdAt": "…", "updatedAt": "…",
  "author": { "id": "…", "displayName": "…" },
  "items": [
    { "id": "…", "position": 0, "content": "…", "photoPath": null, "photoUrl": null }
  ]
}
```
`photoUrl` is a signed read URL valid for 1 hour. Never store it. Sign all the photos in a response with one batch call to Storage, not one call per photo.

### `POST /api/posts`
Body:
```json
{ "circleId": "uuid | null", "items": [ { "content": "string", "photoPath": "string | null" } ] }
```
Positions are assigned from array order. Permission: if `circleId` is set, `canPostToCircle`, else 404. Validate each `photoPath` starts with `${userId}/`. Creates post + items in one transaction. Returns 201 with the post.

### `GET /api/posts/:id`
Permission: `canReadPost`, else 404. Returns the post.

### `PATCH /api/posts/:id`
Body `{ items: [...] }` same item shape. Permission: 404 if the caller can't read the post, 403 if they can read it but aren't the author. In one transaction: delete all items, insert the new ones, and set the post's `updatedAt` to now. (Replacing items doesn't touch the `Post` row, so `updatedAt` won't move unless you update it yourself.) `circleId` is not editable; moving a post between circles is out of scope. Returns the post.

### `DELETE /api/posts/:id`
Permission: same as `PATCH`. Deletes the post, then deletes any Storage objects its items referenced. Returns 204.

**Order rule for anything that touches both the database and Storage:** commit the database change first, delete files second. A database transaction can't undo a file deletion. If the file delete fails afterwards you have a harmless orphaned file; the other order can leave a live post pointing at a photo that's gone.

### `GET /api/circles`
Circles the caller belongs to, with `memberCount` and `role: "owner" | "member"`. Returns an array.

### `POST /api/circles`
Body `{ name: string (1–60) }`. Generates an 8-character invite code from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no 0/O/1/I), using a cryptographically secure random source. On unique-constraint collision, regenerate up to 3 times, then 409. In one transaction: create circle, add creator as member. Returns 201 with `{ id, name, inviteCode, ownerId, memberCount: 1, role: "owner" }`.

### `POST /api/circles/join`
Body `{ inviteCode: string }`. Normalize to uppercase, trim. Unknown code → 404 `NOT_FOUND` with message "Invite code not found". Already a member → 200 with the circle (idempotent, never 409). Otherwise insert membership, return 200 with the circle.

### `GET /api/circles/:id`
Permission: `canReadCircle`, else 404. Returns circle with members `[ { id, displayName, joinedAt } ]`. `inviteCode` is included only when the caller is the owner.

### `GET /api/circles/:id/feed?cursor=&limit=`
Permission: `canReadCircle`, else 404 (the same answer whether the circle doesn't exist or the caller isn't in it). Posts in this circle from all members, newest first, same pagination as `/api/posts`.

### `POST /api/circles/:id/leave`
Non-member → 404. Owner → 403, "Owner cannot leave; delete the circle instead". Otherwise removes the membership and returns 204. The member's posts stay in the circle.

### `DELETE /api/circles/:id`
Non-member → 404. Member who isn't the owner → 403. Owner → 204. Posts become private via `onDelete: SetNull`.

### `POST /api/uploads`
Body `{ contentType: "image/jpeg" | "image/png", byteSize: number (≤ 5_000_000) }`.
Generates `path = ${userId}/${uuid}.${ext}`, calls Storage `createSignedUploadUrl(path)`, returns `{ path, signedUrl, token }`. The client uploads directly to Storage with these. The path is only "real" once it's saved on a post item; orphaned uploads are acceptable for MVP (note it in DECISIONS.md).

The API only sees the size and type the client *claims*. The bucket's own 5 MB limit and MIME allowlist (set in Milestone 0) are what check the real file.

---

## Part E — Mobile screens

Keep screens thin: each screen composes a hook from `features/` and components. All server state goes through TanStack Query; no `useEffect` + `fetch`.

| Route | Shows | Actions |
|---|---|---|
| `(auth)/login` | email, password | Sign in → tabs. Link to signup. |
| `(auth)/signup` | email, password, display name | Sign up, sending the display name along with the signup call → tabs. If email confirmation is on, show "Check your email" instead. |
| `(tabs)/journal` | all your posts, infinite scroll; circle posts carry a small circle badge | Tap → `post/[id]`. FAB → `post/new` |
| `(tabs)/circles` | list of circles with member counts | Tap → `circle/[id]`. Buttons → `circle/new`, `circle/join` |
| `(tabs)/settings` | display name, email, sign out | Edit name. Milestone 10: delete account. |
| `post/new` | 1–10 item inputs, add/remove item, optional photo per item, circle picker (Private or one of your circles) | Save → back to journal or circle |
| `post/[id]` | post detail, photos full width | Edit (author only) → same form prefilled. Delete with confirm. |
| `circle/new` | name | Create → `circle/[id]` showing invite code with a Share button |
| `circle/join` | code input | Join → `circle/[id]` |
| `circle/[id]` | feed with infinite scroll, members sheet, invite code (owner) | Compose into this circle. Leave / delete. |

Every screen handles three states explicitly: loading, empty, error (with retry). Write these as components in `components/ui/` and reuse them.

Session handling: `lib/auth.tsx` provides `{ session, signIn, signUp, signOut }` using the Supabase client, persisting the session securely on the device (with a localStorage fallback on web). `lib/api.ts` reads the current access token and attaches it; on 401 it signs out. Supabase refreshes tokens automatically; the API wrapper should call `supabase.auth.getSession()` each time rather than caching the token.

---

## Part F — Milestones

### Milestone 0 — Accounts and decisions

**Goal:** Every external account exists and is configured; nothing is coded yet.

**Size:** S

**Concepts:** environments (local, staging, production), secrets and where they live, public keys vs. secret keys, the PR loop (B0).

**Steps**
1. The GitHub repo exists: `comacrae/gratya`. It is public, so from the first commit on, nothing secret goes in it.
2. Create two Supabase projects in one organisation: `gratya-staging`, `gratya-prod`. Same region, close to where Vercel will run the API.
3. In both projects: turn **off** "Enable Data API" (Project Settings → Data API) and "Automatically expose new tables". Leave "Enable automatic RLS" off; you add RLS in a migration in Milestone 2 so that every environment gets it.
4. In both projects: Storage → create bucket `post-media`. Public **off**, file size limit 5 MB, allowed MIME types `image/jpeg` and `image/png`, no Storage policies.
5. Save to your password manager, one entry per project: database password, Transaction pooler URL (port 6543), Session pooler URL (port 5432), project URL, publishable key, secret key. Mark the prod entry so you can't mistake it for staging.
6. Create a Vercel account and connect the GitHub repo (it will have nothing to deploy yet; that's fine).
7. Create an Expo account. Install the Expo Go app on your phone.
8. Install locally: Node 22 LTS, pnpm, Docker Desktop, Supabase CLI, EAS CLI.
9. On a branch, commit `docs/SPECS.md` and create `docs/DECISIONS.md` with dated entries (decision, why, alternatives considered) for: the stack (Part A, two sentences of your own reasoning); `main`-only branching; Data API off plus RLS by migration; Session pooler for migrations. Open your first PR and merge it using the B0 loop.

**Acceptance**
- `supabase --version`, `pnpm --version`, `docker ps` all work.
- You can log into all four dashboards.
- The Data API is disabled on both Supabase projects, and both have a private `post-media` bucket with the size and type limits.
- `docs/SPECS.md` and `docs/DECISIONS.md` are on `main` via a merged PR.

**Pitfalls**
- On Supabase's free plan a project pauses after about a week without activity. A paused project looks exactly like a wrong connection string. Check the dashboard first when a hosted database suddenly can't be reached.
- `docker ps` fails unless Docker Desktop is actually running, not just installed.

**Be able to explain:** why the phone must not have the secret key; what someone holding only the publishable key can still do once the Data API is off (hint: which Supabase services are still reachable?); why staging and production are separate projects.

---

### Milestone 1 — Skeleton

**Goal:** The monorepo runs locally and your phone displays the response from `GET /api/health` served by your Mac.

**Size:** M

**Concepts:** client and server, HTTP requests and JSON, pnpm workspaces, Next.js route handlers, Expo Router file routing, environment variables on each side, LAN networking between phone and laptop.

**Steps**
1. `pnpm init` at root; create `pnpm-workspace.yaml` listing `apps/*` and `packages/*`.
2. Scaffold `apps/server` with `create-next-app` (TypeScript, App Router, no Tailwind, `src/` off). Delete the default page; add `app/api/health/route.ts` returning `{ ok: true }` for now. **Check:** `curl http://localhost:3000/api/health` prints `{"ok":true}`.
3. Scaffold `apps/mobile` with `create-expo-app` using the default (Expo Router) template. Strip the example screens down to a single `index.tsx`. **Check:** the app opens in Expo Go on your phone.
4. Create `packages/shared` with a `package.json`, `tsconfig.json`, and `src/index.ts` exporting a single constant (e.g. `APP_NAME`). Import it in both apps to prove workspace linking works.
5. Add root scripts from B5 (only the ones that make sense yet), a root `tsconfig.base.json`, ESLint + Prettier config shared across workspaces.
6. In the mobile app, read `EXPO_PUBLIC_API_URL` and fetch `/api/health` on the index screen; show the JSON. (A plain `fetch` in a `useEffect` is fine here. TanStack Query replaces it in Milestone 4.)
7. Add `.gitignore`, `.env.example` files, and a one-paragraph README.

**Acceptance**
- `pnpm dev:server` serves `http://localhost:3000/api/health`.
- Phone on the same Wi-Fi shows `{ "ok": true }` from your Mac's LAN IP.
- `pnpm lint` and `pnpm typecheck` pass from root.
- Both apps import something from `@gratya/shared`.

**Pitfalls**
- `localhost` on the phone is the phone. Use the LAN IP.
- macOS firewall may block port 3000; allow Node when prompted.
- Expo caches env vars; restart with `expo start -c` after changing `.env`.

**Be able to explain:** what happens, step by step, between the phone calling `fetch` and the JSON appearing on screen; what a workspace symlink is and why `@gratya/shared` resolves; the difference between a route handler and a page; why `EXPO_PUBLIC_` is required and what it implies.

---

### Milestone 2 — Schema

**Goal:** The Part C schema is applied to local and staging by Prisma migrations, with row-level security enabled on every table.

**Size:** M

**Concepts:** relational tables, primary and foreign keys, ORMs vs. query builders vs. raw SQL, migrations as versioned schema history, connection pooling and why serverless needs it, row-level security.

**Steps**
1. `supabase init` at root. In `supabase/config.toml`, disable the local Data API and declare the `post-media` bucket with the same limits as hosted, so local behaves like staging (check the Supabase CLI config reference for the exact keys). Then `supabase start` and note the local DB URL it prints.
2. In `apps/server`: install `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg` and `dotenv`. Create `prisma/schema.prisma` and `prisma.config.ts` from Part C. Add `generated/` to `.gitignore`.
3. Set `DATABASE_URL` and `DIRECT_URL` in `apps/server/.env` to the local URL (the same value for both).
4. Create the first migration without applying it: `prisma migrate dev --create-only --name init`. Read the generated SQL in `prisma/migrations/` and understand every line. Confirm the timestamp columns say `TIMESTAMPTZ(3)`.
5. At the bottom of that SQL file, add `ALTER TABLE "<name>" ENABLE ROW LEVEL SECURITY;` for each of the five tables. Then apply it with `pnpm db:migrate`. Editing a migration is only allowed before it has been applied anywhere, which is the case here. **Check:** `pnpm db:studio` shows five empty tables.
6. Create `lib/prisma.ts`: a singleton client using the `PrismaPg` adapter and `DATABASE_URL` (the standard `globalThis` pattern, so `next dev` hot reload doesn't leak connections).
7. Make `/api/health` run `SELECT 1` via Prisma and report `db: true/false`.
8. Apply the migration to staging. Put the staging `DIRECT_URL` in a git-ignored `apps/server/.env.staging` and run `DOTENV_CONFIG_PATH=.env.staging pnpm db:deploy`, so you never edit your local `.env` to point at a hosted database. Confirm the tables exist in the staging dashboard (Table Editor is fine for *viewing*).

**Acceptance**
- `pnpm db:studio` shows the five tables locally.
- Staging shows the same five tables plus `_prisma_migrations`.
- Row-level security shows as enabled on all five tables, locally and in staging.
- `/api/health` returns `db: true`; stopping Docker makes it return 503.

**Pitfalls**
- Don't `prisma db push` — it skips migration history. Always `migrate dev` locally, `migrate deploy` elsewhere.
- After a fresh clone or any schema change, run `pnpm db:generate`. The typed client lives in `generated/`, which isn't committed. "Cannot find module …/generated/prisma" means you forgot.
- **Every future migration that creates a table must also enable RLS on it.** Prisma won't do it for you and won't warn you. A test in Milestone 3 catches a table you forget.
- Tutorials older than 2026 show `url = env("DATABASE_URL")` inside `schema.prisma` and a `?pgbouncer=true` suffix. Both are from Prisma 6 and earlier. If you get prepared-statement errors against the Transaction pooler, read Prisma's current Supabase guide rather than guessing.

**Be able to explain:** what a foreign key guarantees; what a migration file is and why you'd never edit one that has already been applied somewhere; what a connection pooler does and why Vercel functions need one; why RLS with no policies still lets your API read and write (hint: who owns the tables?); what `@updatedAt` does and where (hint: not in the database).

---

### Milestone 3 — Auth

**Goal:** You can sign up and log in on the phone; `GET /api/me` returns your user; unauthenticated requests get 401.

**Size:** L

**Concepts:** authentication vs. authorization, JWTs (what's in one, who signs it, how it's verified), access vs. refresh tokens, Bearer auth, HTTP status codes, React context for session, automated tests.

**Steps**
1. **API:** `lib/errors.ts` — `ApiError(status, code, message)` and a `handler()` wrapper that catches `ApiError` → JSON per B2, `ZodError` → 422, anything else → 500 (log it). Every route handler is wrapped from now on.
2. **API:** `lib/auth.ts` — `requireUser(req)`: read the Bearer token, verify it with a server Supabase client (`auth.getUser(token)`), throw 401 on failure. Then look up the `User` row by `id`. If it doesn't exist, create it with the token's `email` and the `display_name` from the token's user metadata (trimmed, at most 40 characters, or null). Creation must be safe if two first requests arrive at the same moment. Return the user.
3. **API:** `GET /api/me`, `PATCH /api/me` with `UpdateMeSchema` in shared. **Check:** `curl` without a token returns the 401 envelope.
4. **Tests:** set up Vitest in `apps/server` against the local Supabase Postgres, truncating tables between tests. Make `requireUser` injectable so tests can act as a given user without a real token. Write the Part G tests for M3.
5. **Mobile:** `lib/supabase.ts` with the publishable key and a secure storage adapter; `lib/auth.tsx` session provider; root layout redirects to `(auth)` when no session, `(tabs)` when there is one.
6. **Mobile:** `lib/api.ts` — `api.get/post/patch/delete`, attaches the token, parses the B2 error envelope into a thrown `ApiError` on the client too.
7. **Mobile:** login screen with React Hook Form + `SignInSchema` from shared.
8. **Mobile:** signup screen with `SignUpSchema`. Pass the display name in the signup call's options as user metadata (`display_name`). Don't call `PATCH /api/me` from signup. If signup returns no session, show "Check your email to confirm your account".
9. **Mobile:** settings tab showing email and display name (from `GET /api/me`), edit name, sign out.

**Acceptance**
- Sign up on the phone, kill the app, reopen: still logged in.
- Settings screen shows your email and the display name you chose at signup; editing the name persists.
- `curl` to `/api/me` without a token → 401 envelope.
- Tests pass.

**Pitfalls**
- Supabase email confirmation is on by default; turn it off in the local `config.toml` and in staging Auth settings for now. You turn it back on in Milestone 8, and the signup screen's "Check your email" state is what makes that switch painless.
- The display name travels in user metadata because, once confirmation is on, a new user has no session until they click the email link, so the app can't call the API right after signup. User metadata can be edited by the user: fine for a display name, never acceptable for a permission decision.
- `expo-secure-store` has a size limit per value (historically 2048 bytes) and a Supabase session can exceed it. If you see a size warning, use the storage approach from Supabase's current Expo guide.
- `auth.getUser(token)` makes a network call per request. Acceptable now; note in DECISIONS.md that the upgrade is local JWT verification via Supabase's JWKS endpoint.
- Don't trust `email` or a user ID from the request body. Identity comes from the token.

**Be able to explain:** the three parts of a JWT and which one you can't forge; why the API must verify the token rather than trust a `userId` in the body (this is the exact bug the old app had); why `requireUser` creates the row itself and what could go wrong if two requests did that at once; the difference between 401 and 403.

---

### Milestone 4 — Private posts

**Goal:** Full CRUD on your own posts, with permission and validation tests. This is the milestone where the whole request path exists for the first time.

**Size:** L. The biggest milestone before circles. Expect it to take a while; that's normal.

**Concepts:** REST resource design, Zod schema sharing, Prisma transactions and nested writes, keyset pagination, test-first development, TanStack Query (queries, mutations, invalidation, infinite queries), form arrays.

**Steps**
1. **Shared:** `CreatePostSchema`, `UpdatePostSchema`, `PostItemInputSchema` (content trimmed, 1–500; photoPath nullable string), items array 1–10.
2. **API:** `lib/permissions.ts` with the B3 functions (circle ones can be stubs that throw "not implemented" until Milestone 6). `lib/validate.ts` to parse a body.
3. **API, test first:** write the Part G tests for `POST /api/posts`, watch them fail, then implement it (private only for now; reject non-null `circleId` with 422 until M6). **Check:** `curl -X POST /api/posts` with `{}` returns a 422 with `details`.
4. **API, test first:** `GET /api/posts` with keyset pagination and the opaque cursor from Part D.
5. **API, test first:** `GET /api/posts/:id`, `PATCH /api/posts/:id`, `DELETE /api/posts/:id`. Write the "another user gets 404" tests before the handlers.
6. **Mobile:** `features/posts/` — `usePosts()` (infinite query), `usePost(id)`, `useCreatePost()`, `useUpdatePost()`, `useDeletePost()`. Mutations invalidate the list and the detail.
7. **Mobile:** journal tab with infinite scroll, pull to refresh, empty state.
8. **Mobile:** `post/new` with a field array of items (add, remove, 1–10).
9. **Mobile:** `post/[id]` with edit (the same form, prefilled) and delete with confirm.

**Acceptance**
- Create a 3-item post, edit it to 2 items, delete it — all reflected without manual refresh.
- Scroll past 20 posts and the next page loads.
- Tests: another user cannot read, edit, or delete your private post (404 each); empty content and 11 items are rejected (422); editing a post moves its `updatedAt`.
- `curl -X POST /api/posts` with `{}` returns a 422 with `details`.

**Pitfalls**
- `OFFSET` pagination skips/duplicates rows when new posts arrive. Keyset: `where (createdAt, id) < (cursor.createdAt, cursor.id)`.
- A `PATCH` that deletes items then inserts them must be one transaction or a crash mid-way loses the post's content.
- `PATCH` only writes `PostItem` rows unless you also update the post, so `updatedAt` silently stays put. Set it in the same transaction.
- TanStack Query keys: use arrays like `['posts']` and `['posts', id]` so invalidating `['posts']` covers both.

**Be able to explain:** why pagination uses a cursor and why the cursor carries two values; what a transaction guarantees and what it doesn't; what "invalidate" means in TanStack Query and what happens next; why the same Zod schema runs on both sides and which side's result you trust; why you wrote the permission tests before the code.

---

### Milestone 5 — CI and deploy

**Goal:** Every PR runs lint, typecheck, and tests; the API is live on Vercel staging and production; the phone works against staging.

**Size:** M

**Concepts:** CI as a gate, service containers, environment separation, preview deployments, secrets management, migration-before-deploy ordering, backward-compatible migrations, configuration as code.

**Steps**
1. `.github/workflows/ci.yml`: on `pull_request` and `push` to `main`. Jobs: install (pnpm with cache) → `prisma generate` → lint → typecheck → test. The test job uses a `postgres` service container whose major version matches your local Supabase database (see `major_version` in `supabase/config.toml`); set `DATABASE_URL`/`DIRECT_URL` to it, run `prisma migrate deploy`, then `vitest run`.
2. Branch protection on `main`: require CI green, require PR.
3. Vercel: root directory `apps/server`, framework Next.js, install command `pnpm install --frozen-lockfile` from repo root (Vercel has a monorepo setting for this). Make the build run `prisma generate` before `next build`. Add env vars: Preview environment → staging Supabase values; Production environment → prod Supabase values.
4. Run `pnpm db:deploy` against prod once, manually, from your machine, using a git-ignored `.env.production` the same way as staging in Milestone 2.
5. Record the migration rule in DECISIONS.md (see below), and that the upgrade is a CI job that runs `migrate deploy` on merge.
6. Build the mobile app's `EXPO_PUBLIC_API_URL` from a `.env.staging` and switch to it with a script; confirm the phone works end to end against staging.
7. Open a PR that intentionally breaks a test; confirm CI blocks it; fix; merge.

**The migration rule (for every PR that changes the schema):**

1. Migrations are **additive**: add tables and columns; don't rename or drop anything the currently deployed code still uses. That way old code keeps working against the new schema.
2. When the PR is green and you're ready to merge, apply the migration to **staging**, check the preview deployment, then apply it to **prod**, then merge.
3. Never apply an unfinished branch's migration to a hosted database. Staging is shared by every preview, so a preview for a schema PR will be broken until you do step 2. That is expected.

**Acceptance**
- A PR shows green checks and a Vercel preview comment.
- `https://<staging-preview>/api/health` and `https://<prod>/api/health` both return `db: true`.
- The phone, pointed at staging, can sign up and create a post.

**Pitfalls**
- Vercel needs to know the monorepo root for pnpm; set "Root Directory" to `apps/server` and enable "Include source files outside Root Directory".
- "Cannot find module …/generated/prisma" on Vercel or in CI means `prisma generate` didn't run before the build or typecheck.
- Service container Postgres takes a few seconds to be ready; use the `options: --health-cmd pg_isready` pattern.
- Never put prod secrets in GitHub Actions. CI only needs the throwaway service container.

**Be able to explain:** why migrations run before the new code deploys, and what happens if you get that backwards; why a migration that renames a column is dangerous even when the order is right; the difference between a preview and production environment variable on Vercel; what `--frozen-lockfile` protects against.

---

### Milestone 6 — Circles

**Goal:** Create a circle, join it from a second account with the invite code, post into it, and see each other's posts in the feed. Non-members are rejected, with tests proving it.

**Size:** L

**Concepts:** many-to-many via join table, authorization beyond ownership, hiding existence (404 vs. 403), idempotent endpoints, generating safe random codes, composite primary keys, `onDelete` behaviors.

**Steps**
1. **Shared:** `CreateCircleSchema`, `JoinCircleSchema`.
2. **API, test first:** implement the circle permission functions for real, then `POST /api/circles`, `POST /api/circles/join`, `GET /api/circles`.
3. **API, test first:** `GET /api/circles/:id`, `GET /api/circles/:id/feed`, `POST /api/circles/:id/leave`, `DELETE /api/circles/:id`. Apply the B3 404/403 table exactly.
4. **API, test first:** lift the `circleId` restriction on `POST /api/posts` (delete the M4 test that expected 422), and add the 403 path to `PATCH`/`DELETE /api/posts/:id` for circle posts.
5. **Mobile:** `features/circles/` hooks; circles tab; `circle/new` (show invite code + native Share sheet); `circle/join`.
6. **Mobile:** `circle/[id]` with feed, members, leave/delete; circle picker in `post/new`; circle badge on journal posts.
7. Test with two real accounts on two devices (or phone + web via `expo start --web`).

Start your Apple Developer Program enrollment now (see Milestone 8, step 3). Approval can take days and you don't want to wait for it later.

**Acceptance**
- Account A creates a circle, shares the code; account B joins; both post; both see both posts in the feed; neither sees the other's private posts.
- Joining twice returns 200 and doesn't duplicate membership.
- Owner cannot leave; owner can delete; after delete, the posts still appear in their authors' journals as private.
- Tests: a non-member gets 404 for the circle, its feed, and posting into it; a member gets 403 editing another member's post; invite code is not returned to non-owners.

**Pitfalls**
- Case sensitivity: normalize invite codes on both sides.
- Generate invite codes with a cryptographically secure source (`crypto.randomInt`), not `Math.random()`. The code is the only thing protecting a circle.
- The feed query filters by `circleId`; make sure the index from Part C exists (check the migration SQL).
- It's easy to return 403 where B3 says 404. Check the member case and the non-member case separately for every circle endpoint.

**Be able to explain:** why `CircleMember` has a composite primary key; the difference between authentication and authorization using this milestone's bugs as examples; why a non-member gets 404 rather than 403, and what a 403 would give away; why `join` is idempotent and `create` isn't.

---

### Milestone 7 — Photos

**Goal:** Attach a photo from the camera roll to a post item; members see it in the feed; non-members can't get the file even with the path.

**Size:** M

**Concepts:** object storage vs. database, signed URLs (upload and read), direct-to-storage uploads, why you can't trust what a client declares, why URLs aren't stored.

**Why uploads skip the API:** Vercel caps a request body at about 4.5 MB and bills for the whole time a slow phone is uploading. So the API only *authorises* the upload (a tiny JSON request), and the phone sends the bytes straight to Storage. This is the same pattern as S3 presigned URLs.

**Steps**
1. **Shared:** `CreateUploadSchema`.
2. **API:** `lib/storage.ts` — `createSignedUpload(path)`, `signedReadUrls(paths, 3600)` (one batch call), `deleteObjects(paths)` using the secret-key client. `POST /api/uploads`.
3. **API:** add `photoUrl` to post serialization. Validate the `photoPath` prefix on create and update. Test it.
4. **API:** delete Storage objects after the database commit in `DELETE /api/posts/:id`, and in `PATCH` for any photo path that was in the old items but isn't in the new ones.
5. **Mobile:** `expo-image-picker` → convert to JPEG and resize on the device with `expo-image-manipulator` → ask the API for a signed upload → `uploadToSignedUrl` → put the returned `path` on the item. Show upload progress state.
6. **Mobile:** render `photoUrl` with `expo-image`, using the stable `photoPath` as its cache key so a fresh signed URL doesn't force a re-download.
7. Confirm with two accounts that a non-member cannot open the photo: try the raw path without a signature, and try a `photoUrl` after it has expired.
8. Take a photo with location turned on, upload it, download it from the bucket, and inspect its metadata. Confirm the GPS coordinates are gone. If they aren't, strip them before upload and note it in DECISIONS.md.

**Acceptance**
- Photo attached, shows in journal and in circle feed for members, full width on detail.
- A 6 MB image is rejected with 422 before any upload happens.
- Uploading a file larger than 5 MB straight to a signed URL is refused by the bucket.
- Deleting a post removes its objects from the bucket (check the dashboard).
- Tests: `photoPath` for another user's prefix → 422; `contentType: "image/gif"` → 422.

**Pitfalls**
- iPhones produce HEIC. Converting to JPEG on the device means the API and bucket only ever accept JPEG and PNG.
- Phone photos carry GPS coordinates in their metadata. Sharing one to a circle could share where someone lives. Step 8 exists for this.
- Signed read URLs in a TanStack Query cache expire; set `staleTime` on feeds below 1 hour or regenerate on refetch.
- Database first, files second (Part D order rule).

**Be able to explain:** why the file never goes through your API; what a signed URL actually is (hint: HMAC) and why expiry matters; why `photoPath` is stored and `photoUrl` is computed; which check stops an oversized file, given that the API only sees the size the client claims.

---

### Milestone 8 — Ship to TestFlight

**Goal:** A polished build is installed on a friend's phone via TestFlight, with Sentry reporting errors from both sides.

**Size:** M, plus waiting on Apple and on builds.

**Concepts:** loading/empty/error states as product quality, error monitoring and source maps, native build pipeline (EAS), app signing, deep links, TestFlight internal vs. external testing.

**Steps**
1. **Polish pass:** every screen's three states; disabled buttons while mutating; toasts for errors; keyboard avoidance on forms; safe areas; dark mode at least not broken.
2. **Sentry:** `@sentry/nextjs` in the API with the `handler()` wrapper reporting 500s; `@sentry/react-native` in the mobile app with the Expo plugin so source maps upload on EAS builds. Tag events with environment.
3. **Apple:** enroll in the Apple Developer Program ($99/yr) if you didn't in Milestone 6. Create the app record in App Store Connect with bundle ID `com.<you>.grat`.
4. **EAS:** `eas build:configure`; a `production` profile with `EXPO_PUBLIC_API_URL` = prod. `eas build -p ios --profile production`; `eas submit` to TestFlight.
5. **Email confirmation:** set up a custom SMTP provider in prod Auth settings (Supabase's built-in sender is rate-limited to a handful of emails per hour). Give the app a URL scheme and pass it as the redirect in the signup call, so the confirmation link opens the app. Turn email confirmation on in prod. Test the whole signup flow on a real build.
6. Add yourself and 2–3 friends as internal testers. Watch Sentry for the first real crash; fix it; ship a second build.

**Acceptance**
- A friend installs from TestFlight, signs up, confirms their email, joins your circle, posts a photo — without you touching their phone.
- Their display name is set after confirming, without them typing it twice.
- Throwing a test error in the app appears in Sentry with a readable stack trace.
- A forced 500 in the API appears in Sentry.

**Pitfalls**
- EAS builds take 10–20 minutes; queue one early, do something else.
- App icon and splash are required for TestFlight; use Expo's defaults with your own icon PNG.
- Expo Go ≠ production build. Things that worked in Go (dev-only warnings, some permissions) behave differently. Budget time for this.
- If you're on Supabase's free plan, this is the point to upgrade: real users' data needs backups, and a paused database is now an outage.

**Be able to explain:** what a source map is and why Sentry needs it; what code signing proves; the difference between Expo Go, a development build, and a production build; how a link in an email ends up opening your app.

---

### Milestone 9 — Portfolio

**Goal:** Someone who has never spoken to you understands what you built and how, in five minutes.

**Size:** S

**Steps**
1. README: one-paragraph pitch; architecture diagram (Mermaid is fine, rendered by GitHub); stack table with one line of "why" each; screenshots or a GIF; "run it locally" in under 10 commands; "how it's deployed"; "what I'd do next" (Part I).
2. Two-minute screen recording: sign up, post, create circle, join from second device, photo in feed. Upload to YouTube unlisted, link from README.
3. `docs/DECISIONS.md`: make sure it has at least: stack choice, why no direct DB access (Data API off, RLS), why the API creates the user row, the 404-vs-403 rule, orphaned uploads accepted, migrations manual-before-merge, why no queue yet (with the threshold).
4. README section "Scaling notes": where caching goes (signed URLs, feed pages), where a queue goes (M11), what breaks first (`getUser` per request → JWKS verification), what you'd monitor.
5. Pin the repo on your GitHub profile. Come back and update the README and diagram after Milestones 11 and 12.

**Acceptance**
- A friend who codes can run it locally from the README alone.
- The README answers "why" for every major piece, not just "what".

---

### Milestone 10 — App Store release (optional)

**Size:** M

**Steps**
1. `DELETE /api/me` and a confirm screen in settings (Apple requires in-app account deletion). Order: database rows in one transaction, then Storage objects, then the Supabase Auth user.
2. Privacy policy page (a static page on the Vercel app is fine) and a support email.
3. Store screenshots via the simulator; App Store Connect listing.
4. Submit. Expect one rejection; read the reason carefully, fix, resubmit.

**Be able to explain:** what data the app collects and where it's stored, in plain language — you'll need it for the privacy questionnaire anyway.

---

### Milestone 11 — Events and notifications (the system-design piece)

**Goal:** When someone posts to a circle, members get a push notification, delivered by a worker that consumes a Postgres-backed job queue.

**Size:** L. Do this after Milestone 8: push notifications need a real build, not Expo Go.

**Concepts:** asynchronous work, transactional enqueue (why the job row is written in the same transaction as the post), `FOR UPDATE SKIP LOCKED`, at-least-once delivery and idempotency, retries with backoff, dead letters, push notifications via Expo's push service.

**Steps**
1. Write the design first, in `docs/DESIGN-events.md`: the job table, the claim query, the worker loop, failure handling, and the threshold at which you'd move to SQS or similar. Have the tutor review it before coding.
2. Prisma migration: `Job` model (`id BigInt autoincrement`, `type`, `payload Json`, `status`, `runAt`, `attempts`, `lastError`, `createdAt`) and `PushToken` model (`userId`, `token`, `platform`, unique on token). Enable RLS on both tables in the migration.
3. `POST /api/me/push-token` from the app on launch when permission granted.
4. In `POST /api/posts`, inside the existing transaction, insert a `notify_circle` job when `circleId` is set.
5. `POST /api/jobs/run` protected by a `CRON_SECRET` header; claims up to 20 jobs with the SKIP LOCKED query via `$queryRaw`, dispatches by `type`, marks done/failed; retries with `runAt = now() + attempts² minutes` up to 5 attempts.
6. Handler `notify_circle`: load post + members (excluding author), send via Expo Push API in one batch, record ticket errors on the job.
7. Trigger the worker two ways. Fast path: after `POST /api/posts` has sent its response, kick off a run (Next.js `after()`). Safety net: a scheduled call to `/api/jobs/run` that sweeps up anything the fast path missed.
8. Tests (Part G, M11).

**Acceptance**
- Post from account A; account B's phone buzzes within ~60 seconds.
- Kill the worker mid-batch (throw in the handler); the job is retried, not lost.
- `select * from "Job" where status = 'failed'` is your dead-letter queue and you can explain each row.

**Pitfalls**
- Vercel Cron on the free Hobby plan runs at most once a day (check the current limits). Options for the safety net: Vercel Pro, or a GitHub Actions `schedule` workflow that curls the endpoint every few minutes. This limitation is part of the motivation for Milestone 12.
- The fast path is best-effort. Never rely on it alone; the job row in the database is the source of truth.

**Be able to explain:** the dual-write problem and how the transactional insert avoids it; why the worker must be idempotent; what you lose by polling and what you'd gain from a broker; at what point you'd introduce SQS.

---

### Milestone 12 — AWS and infrastructure as code (optional stretch)

**Goal:** Notification delivery runs on AWS: the API publishes to an SQS queue, a Lambda function sends the pushes, failures land in a dead-letter queue that alerts you, and every AWS resource is created by Terraform.

**Size:** L. Do this last. It changes one slice of a working app, which is the realistic way AWS gets adopted.

**Why this slice:** Milestone 11's worker depends on polling and a cron you may not have. A managed queue retries for you, scales without thought, and has a dead-letter queue built in. The Postgres `Job` table stays as the **outbox**: the durable record, written in the same transaction as the post, of work that must be handed to the queue.

```
 POST /api/posts ──(one transaction)──▶ Post row + Job row (status: pending)
        │
        ▼ after the response, and again on the scheduled sweep
 /api/jobs/run: claim pending jobs → build the push messages → SQS SendMessage → status: enqueued
        │
        ▼
   SQS queue ──▶ Lambda `push-worker` ──▶ Expo Push API
        │ (5 failed receives)
        ▼
   Dead-letter queue ──▶ CloudWatch alarm ──▶ email to you
```

The Lambda never touches your database. Each SQS message carries everything needed to send: `{ jobId, tokens, title, body, data }`. That keeps the AWS side small and keeps database credentials out of AWS.

**Concepts:** infrastructure as code (declarative config, plan vs. apply, state), IAM and least privilege, managed queues, visibility timeout, dead-letter queues, serverless functions, the outbox pattern, cloud cost control.

**Steps**
1. Write `docs/DESIGN-aws.md` first: the diagram above in your own words, the message shape, what happens on each kind of failure, and what you'll name each resource. Have the tutor review it before you create anything.
2. **Account safety, by hand in the console:** create the AWS account; turn on MFA for the root user and then stop using it; create an admin identity for yourself with MFA; create a $5 monthly budget with an email alert. **Check:** you can run `aws sts get-caller-identity` as your admin identity, not as root.
3. **Terraform basics:** in `infra/`, configure the AWS provider and one region. Define the main queue and the dead-letter queue with a redrive policy (`maxReceiveCount = 5`). Run `terraform plan`, read it, `terraform apply`. Then `terraform destroy` and apply again, to feel that the code, not the console, is the source of truth.
4. **Remote state:** move Terraform's state from your laptop to an S3 bucket with locking enabled. Git-ignore local state files.
5. **Worker:** `apps/worker/` — a TypeScript Lambda handler that takes a batch of SQS messages, sends each to the Expo Push API, and reports per-message failures (partial batch response) so one bad message doesn't retry the whole batch. Bundle it with esbuild. In Terraform: the function, its execution role (write logs, read from this one queue, nothing else), and the SQS event source mapping.
6. **Publisher:** change `/api/jobs/run` so that instead of calling Expo it publishes to SQS and marks the job `enqueued`. In Terraform, create an IAM user for the API whose only permission is `sqs:SendMessage` on this one queue. Create its access key by hand with the AWS CLI, and put it in Vercel's env vars (B4).
7. **Alerting:** in Terraform, a CloudWatch alarm on the dead-letter queue's visible message count being above zero, notifying an SNS topic subscribed to your email. Bring the budget from step 2 under Terraform too.
8. **CI:** add `terraform fmt -check` and `terraform validate` to `ci.yml`. They need no AWS credentials. Stretch: run `terraform plan` on PRs that touch `infra/`, authenticating with GitHub's OIDC provider instead of stored keys.
9. **Second environment:** parameterise the Terraform with an `env` variable and stand up `prod` alongside `staging` from the same code. Update the README's architecture diagram and "how it's deployed", and add DECISIONS.md entries.

**Acceptance**
- `terraform plan` on a clean checkout reports no changes: everything in AWS is described in code.
- Post from account A; account B's phone buzzes, and the Lambda's CloudWatch logs show the invocation.
- Send a deliberately broken message; after 5 attempts it appears in the dead-letter queue and you receive the alarm email.
- The API's AWS credentials cannot do anything except send to that one queue (prove it: try to list queues with them and get denied).
- Nothing in the AWS console was created by clicking, apart from the account-safety items in step 2.

**Pitfalls**
- Vercel reserves the standard `AWS_*` environment variable names for its own use. Use the `GRAT_AWS_*` names from B4 and pass them to the SQS client explicitly.
- Never create an access key with Terraform: the secret would be stored in the state file. That's why step 6 creates it by hand.
- Never commit `*.tfstate` or `*.tfvars` files containing secrets. Add them to `.gitignore` before the first `apply`.
- Set the queue's visibility timeout to at least six times the Lambda's timeout, or messages get delivered again while still being processed.
- SQS delivers at least once, so a push can occasionally be sent twice. Decide whether that's acceptable (for a notification, it usually is) and write the reasoning down.
- Everything here fits in the AWS free tier at this scale, but the budget alert is not optional. Leaked keys and forgotten resources are how surprise bills happen.

**Be able to explain:** what Terraform state is and why it must be shared and locked; the difference between `plan` and `apply`; what least privilege means, using the two IAM identities you created as examples; what a visibility timeout is and what happens when it expires; how a message ends up in the dead-letter queue; why the `Job` table still exists now that SQS does the queueing; what this architecture costs at 100 users and at 100,000.

---

## Part G — Test list

Name tests exactly like this so the suite reads as a spec. Each `describe` is a route file in `tests/`.

**M3 — auth**
- `GET /api/me` → 401 without token
- `GET /api/me` → 200 and creates User row on first call
- `GET /api/me` → sets displayName from token metadata on first call
- `GET /api/me` → does not duplicate User on second call
- `PATCH /api/me` → 422 for empty displayName
- schema → every table in `public` has row-level security enabled

**M4 — posts**
- `POST /api/posts` → 201 creates post with items in order
- `POST /api/posts` → 422 for zero items
- `POST /api/posts` → 422 for 11 items
- `POST /api/posts` → 422 for blank content
- `POST /api/posts` → 422 for circleId before M6 (delete this test in M6)
- `GET /api/posts` → returns only caller's posts, newest first
- `GET /api/posts` → paginates with cursor and no duplicates across pages
- `GET /api/posts` → 422 for a malformed cursor
- `GET /api/posts/:id` → 404 for another user's private post
- `PATCH /api/posts/:id` → replaces items atomically
- `PATCH /api/posts/:id` → updates updatedAt
- `PATCH /api/posts/:id` → 404 for another user's private post
- `DELETE /api/posts/:id` → 204 and cascades items
- `DELETE /api/posts/:id` → 404 for another user's private post

**M6 — circles**
- `POST /api/circles` → 201, creator is owner and member, inviteCode is 8 chars from the allowed alphabet
- `POST /api/circles/join` → 200 adds membership
- `POST /api/circles/join` → 200 idempotent on repeat
- `POST /api/circles/join` → 404 for unknown code
- `POST /api/circles/join` → normalizes lowercase codes
- `GET /api/circles/:id` → hides inviteCode from non-owners
- `GET /api/circles/:id` → 404 for non-members
- `GET /api/circles/:id/feed` → 404 for non-members
- `GET /api/circles/:id/feed` → 404 for nonexistent circle
- `GET /api/circles/:id/feed` → includes all members' posts, excludes private posts
- `POST /api/posts` → 404 for circle caller isn't in
- `GET /api/posts/:id` → 200 for circle post when caller is member
- `PATCH /api/posts/:id` → 403 for another member's circle post
- `DELETE /api/posts/:id` → 403 for another member's circle post
- `POST /api/circles/:id/leave` → 403 for owner
- `POST /api/circles/:id/leave` → 404 for non-members
- `DELETE /api/circles/:id` → 403 for a member who isn't the owner
- `DELETE /api/circles/:id` → 404 for non-members
- `DELETE /api/circles/:id` → posts become private

**M7 — uploads**
- `POST /api/uploads` → 200 returns path under caller's prefix
- `POST /api/uploads` → 422 for byteSize over limit
- `POST /api/uploads` → 422 for disallowed contentType
- `POST /api/posts` → 422 for photoPath under another user's prefix

**M11 — jobs**
- `POST /api/posts` to a circle → creates one notify_circle job in the same transaction
- rolled-back post → no job
- `POST /api/jobs/run` → 401 without CRON_SECRET
- two concurrent runs → each job processed once
- handler throws → attempts incremented, runAt in future, status pending
- sixth failure → status failed

**M12 — AWS** (the SQS client and `fetch` are mocked; no test talks to real AWS)
- `POST /api/jobs/run` → publishes one message per job and marks it enqueued
- `POST /api/jobs/run` → leaves the job pending when the publish fails
- push-worker → sends every message in the batch to Expo
- push-worker → reports only the failed messages as batch item failures

---

## Part H — Definition of done for every PR

- CI green.
- New behavior has at least one test if it's in the API.
- No `any`, no `// eslint-disable` without a comment saying why.
- `.env.example` updated if a variable was added.
- A migration that creates a table also enables row-level security on it.
- DECISIONS.md updated if you made a choice that wasn't in this spec, or followed current docs where they differ from it.
- You can explain every line in the diff. If you can't, ask the tutor before merging, not after.

---

## Part I — Known gaps and backlog

These are deliberate omissions. They're fine for an MVP, and they make a good "what I'd do next" list for the README. Don't build them mid-milestone.

| Gap | Consequence today | Fix later |
|---|---|---|
| Invite codes never expire and can't be rotated | A leaked code works forever | `POST /api/circles/:id/rotate-code` (owner only) |
| The owner can't remove a member | The only remedy for an unwanted member is deleting the circle | `DELETE /api/circles/:id/members/:userId` |
| Orphaned uploads | Photos uploaded but never attached to a post stay in the bucket | A scheduled cleanup job (a natural second job type for M11) |
| No rate limiting | Someone could hammer `join` or `uploads` | Rate limit per user at the API edge |
| `auth.getUser` on every request | One extra network call per request | Verify JWTs locally with Supabase's JWKS |
| Stale push tokens after M12 | The Lambda can't delete tokens Expo reports as dead | A small authenticated callback endpoint, or a second queue back to the API |
| No password reset screen | Users who forget a password are stuck | Supabase's reset flow plus a deep link |

---

## Part J — Glossary

| Term | Plain meaning |
|---|---|
| API | The server program the phone talks to. Here: the Next.js app on Vercel. |
| Route handler | A function that answers one kind of HTTP request, e.g. `GET /api/posts`. |
| JSON | The text format the phone and API exchange data in. |
| Environment variable | A setting supplied from outside the code, so the same code can point at local, staging or prod. |
| Authentication | Proving who you are. |
| Authorization | Deciding what you, now identified, are allowed to do. |
| JWT / access token | A signed string that says who the user is. Anyone can read it; only Supabase can produce a valid signature. |
| Bearer token | A token sent in the `Authorization` header. Whoever holds ("bears") it is treated as the user. |
| ORM | A library (Prisma) that lets you query the database with typed function calls instead of hand-written SQL. |
| Migration | A numbered SQL file that changes the database schema. Applied in order, once each, everywhere. |
| Primary key / foreign key | A row's unique ID / a column pointing at another table's primary key, which the database keeps valid. |
| Transaction | A group of database writes that all succeed or all fail together. |
| Connection pooler | A service in front of Postgres that shares a few real connections among many short-lived clients. |
| Row-level security (RLS) | Postgres rules about which rows a database role may touch. On with no rules means "nobody but the table owner". |
| Schema validation (Zod) | Checking that incoming data has the right shape before using it. |
| Keyset pagination / cursor | Fetching the next page by "everything after this row" instead of "skip N rows". The cursor is the bookmark. |
| Idempotent | Safe to repeat: doing it twice has the same result as doing it once. |
| Object storage / bucket | A service for storing files (photos), separate from the database. A bucket is a named container of files. |
| Signed URL | A URL with an expiry time and a signature that grants temporary access to one file. |
| CI | A robot that runs your checks (lint, types, tests) on every PR. |
| Preview deployment | A temporary copy of the API that Vercel builds for each PR. |
| Source map | A file that translates a crash in bundled code back to your original line numbers. |
| Queue / job | A list of work to do later / one item on it. |
| Dead-letter queue | Where jobs go after failing too many times, so a human can look at them. |
| Outbox | A database table of messages that must be sent, written in the same transaction as the change that caused them. |
| Infrastructure as code (IaC) | Describing cloud resources in files (Terraform) instead of clicking in a console. |
| Terraform state | Terraform's record of which real resources it created, so it knows what to change next time. |
| IAM / least privilege | AWS's permission system / giving each identity only the permissions it needs and nothing more. |
| Lambda | AWS's service for running a function on demand without managing a server. |
| SQS | AWS's managed message queue. |

---

## What changed in revision 2

Log these in `docs/DECISIONS.md` in your own words as you reach them.

| Change | Why |
|---|---|
| Prisma 7 setup (`prisma.config.ts`, driver adapter, `prisma-client` generator) | Revision 1 used Prisma 6 syntax that is deprecated |
| `@db.Timestamptz(3)` on every timestamp | Revision 1 claimed `timestamptz` but the schema produced plain `timestamp` |
| Data API disabled, RLS enabled by migration | Stronger than "remove `public` from exposed schemas", and identical in every environment |
| `DIRECT_URL` is the Session pooler | Supabase's direct connection is IPv6-only |
| One 404-vs-403 rule (B3) | Revision 1 returned 403 for a circle's feed and 404 for the circle itself, and its reasoning leaked existence |
| 409 no longer listed for "already a member" | It contradicted the idempotent join endpoint |
| `requireUser` is get-or-create, not upsert-every-request | Avoids a database write on every request |
| `User.email` no longer unique | Identity is `id`; a unique email could turn a re-created account into a 500 |
| Display name sent with signup as user metadata | Revision 1's `PATCH /api/me` after signup breaks once email confirmation is on |
| Cursor encodes `createdAt` + `id` | An `id`-only cursor needs an extra lookup and breaks if that post is deleted |
| `PATCH /api/posts/:id` sets `updatedAt` | Replacing items never touched the post row |
| Database first, files second | Revision 1 didn't say which, and the wrong order loses photos |
| Batch-signed read URLs, stable image cache key | One Storage call per photo, and a re-download on every refresh, otherwise |
| JPEG/PNG only, converted on device; GPS metadata check | Matches the bucket; protects users' locations |
| M4, M3 and M6 split into smaller steps with checks | Several steps were far more than one sitting |
| M5 migration rule, CI Postgres version, `prisma generate` | Previews share staging; revision 1 didn't address it |
| M8 custom SMTP and deep link | Needed for email confirmation to work on real phones |
| M11 fast path plus sweep; cron plan limits | Per-minute cron isn't available on Vercel's free plan |
| New M12, big-picture section, glossary, backlog, PR loop | Novice on-ramp, and one bounded AWS + Terraform slice |
