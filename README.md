# Praxis — Project Management System

Full-stack app: **Next.js 14 (App Router) + Prisma + PostgreSQL + NextAuth + Supabase Storage.**

## 1. What's implemented

- Credentials auth (bcrypt-hashed passwords, JWT sessions via NextAuth). No credentials are ever sent to the client beyond the signed-in user's own name/role.
- Two roles — `ADMIN`, `PROJECT_INCHARGE` — enforced **server-side in every API route** (`lib/permissions.ts`), not just hidden in the UI. Middleware only redirects signed-out visitors; it is not the security boundary.
- Projects: create (admin-only), edit, delete (admin-only, cascades to all child records and deletes the underlying files from object storage), assignment/reassignment (admin-only), status toggle, search/filter.
- Documents & media: browser uploads directly to Supabase Storage via short-lived signed PUT URLs (the Next.js server never buffers file bytes), with server-side file-type and size validation before a URL is even issued. Downloads use presigned GET URLs, minted only after the server re-checks the caller has access to that file's project.
- Finance (revenue/expenditure) with working date-range filtering, and four optional charge types (labour/material/transport/extra) — all full CRUD, all persisted in Postgres.
- Deleting a document/media item is restricted to admins or the original uploader; finance and charge entries are full-CRUD for both admin and the assigned in-charge, per spec.
- **Amount Paid by Admin vs Project Expenses** (added on top of the base build): a single admin-entered payment figure per project, kept deliberately separate from and never overwritten by expenses. Full ADD/EDIT/DELETE is ADMIN-ONLY, enforced server-side in `app/api/projects/[id]/payment/route.ts` — a Project In-Charge session hitting that route directly gets a 403, not just a hidden button. "Total Project Expenses" reuses the existing Expenditure + four Charge ledgers (Expenditure + Labour + Material + Transport + Extra) rather than a duplicate Expense table, per the spec's own instruction not to duplicate existing functionality. Remaining/Extra Cost/Usage %/Savings/Status are all derived by one shared function (`computeExpenseSummary` in `lib/shared.ts`) so the project card, project detail page, and Finance dashboard can never disagree with each other. An append-only `PaymentHistoryEntry` log records every add/edit/delete with who and when, visible to admins via "View amount history" on the project page.
- Empty states, confirmation dialogs, toasts, loading skeletons, responsive layout.

## 2. Project structure

```
prisma/schema.prisma      Data model
prisma/seed.ts             Creates the two required accounts
lib/auth.ts                 NextAuth config
lib/permissions.ts          getSessionUser / canAccessProject — the real authorization boundary
lib/storage.ts               Signed upload/download URL helpers (Supabase Storage)
app/api/**                  All server routes (see below)
app/dashboard/**            Pages (shared by both roles; content is scoped by API responses)
components/**                Shared UI
```

### API surface

| Route | Method | Notes |
|---|---|---|
| `/api/auth/[...nextauth]` | — | NextAuth handler |
| `/api/projects` | GET, POST | GET scoped to caller's role; POST is admin-only |
| `/api/projects/:id` | GET, PATCH, DELETE | PATCH blocks in-charge reassignment unless admin; DELETE is admin-only |
| `/api/projects/:id/documents` | POST | Records metadata after a direct-to-storage upload |
| `/api/projects/:id/documents/:docId` | DELETE | Admin or original uploader only |
| `/api/projects/:id/media` | POST | Same pattern as documents |
| `/api/projects/:id/media/:mediaId` | DELETE | Admin or original uploader only |
| `/api/projects/:id/ledger/:type` | POST | `type` ∈ revenue \| expenditure \| labour \| material \| transport \| extra |
| `/api/projects/:id/ledger/:type/:entryId` | PATCH, DELETE | Open to admin + assigned in-charge |
| `/api/upload-url` | POST | Issues a signed upload token (for `uploadToSignedUrl`) after validating size/type |
| `/api/download-url` | GET | Issues a presigned GET URL after re-checking project access |
| `/api/users` | GET, POST | GET returns the in-charge directory (no password hashes); POST (admin-only) creates new in-charge accounts |
| `/api/finance` | GET | Flattened revenue + expenditure across every project the caller can see (admin sidebar "Finance" page) |
| `/api/documents` | GET | Flattened documents across every visible project ("Documents" page) |
| `/api/media` | GET | Flattened photos/videos across every visible project ("Media" page) |
| `/api/account/password` | PATCH | Self-service password change; requires the current password, never accepts a target user id |
| `/api/projects/:id/payment` | POST, DELETE | The "Amount Paid by Admin." ADMIN ONLY on both methods — POST upserts (add or edit), DELETE removes it back to "Not Added." Both write a `PaymentHistoryEntry`. |
| `/api/finance/payments` | GET | Per-project Amount-Paid vs Expenses breakdown plus dashboard-wide totals (Total Amount Paid, Total Expenses, Total Remaining, Total Extra Cost, Total Savings), scoped by role |

## 3. Setup

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL, NEXTAUTH_SECRET, SUPABASE_* values
npx prisma migrate dev --name init
npm run seed               # creates the two required accounts
npm run dev
```

Visit `http://localhost:3000`.

**Seeded credentials** (change both immediately in production — see §5):

```
Admin           ID: Praxis2026    Password: Praxis@482
Project In-Charge  ID: Praxis123  Password: Praxis@2026
```

## 4. Object storage (Supabase Storage)

Uses the same Supabase project as your database — no AWS, no separate paid storage service.

1. In your Supabase dashboard: **Storage** → **New bucket**. Create it (any name — e.g. `praxis-pms-files`) and leave it **Private**. Keep it private: the app only ever hands out short-lived signed URLs after checking the requester actually has access to that project, so a public bucket would let anyone with a leaked/guessed URL bypass that check permanently.
2. Go to **Project Settings** → **API** and copy: the **Project URL**, the **`service_role`** secret key, and the **`anon`/`public`** key (yes, both keys — see why below).
3. Set in `.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, and also `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` (same values, just also under the `NEXT_PUBLIC_` names — see `.env.example` for exactly which key goes where).

No RLS policies and no CORS configuration are needed. The server (`lib/storage.ts`, using the `service_role` key, never sent to the browser) mints a short-lived signed *upload token* only after `canAccessProject()` already passed. The browser then calls Supabase's own `storage.uploadToSignedUrl(path, token, file)` method (via `lib/supabase-browser.ts`, using the public `anon` key) to actually push the bytes — using Supabase's official SDK method here, rather than hand-building the upload request, avoids subtle header/encoding mismatches. The `anon` key shipped to the browser grants no access by itself; the signed token is what actually authorizes that one upload, to that one path, for a few minutes.

Downloads work the same way in reverse: the server mints a signed *download* URL (`getDownloadUrl` in `lib/storage.ts`) after re-checking project access, and the browser just opens that URL directly — no client-side Supabase call needed for downloads.

Documents, photos, and videos all go through this same helper — video upload/playback already exists in the Media tab (the "Upload Videos" button and the `<video>` player in the lightbox), it just needed working storage underneath it, which this fixes.

## 5. Deploying

This app is **server-rendered with API routes, a database, and NextAuth** — it is not a static site. That matters for where you deploy it:

### Recommended: Vercel + Railway/Neon/Supabase

Vercel is built by the Next.js team specifically for this stack and needs **zero extra config** — no plugins, no `netlify.toml` equivalent, no build-command overrides.

1. Push this folder to a GitHub repo, then import it in Vercel ("New Project" → pick the repo). Vercel auto-detects Next.js.
2. In the Vercel project's Environment Variables, add everything from your `.env` (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` — set this to your actual `https://your-app.vercel.app` domain, not localhost — and the `SUPABASE_*` values).
3. Deploy. Then run `npx prisma migrate deploy` once against the production `DATABASE_URL` (run it from your own machine with `DATABASE_URL` temporarily pointed at prod, or via Railway/Neon's built-in SQL/shell console) and `npm run seed` once, the same way.
4. Rotate both seeded passwords immediately after your first production login (see §6).

### If you deploy on Netlify instead

**This is almost certainly what caused the "Page not found" error you hit.** Netlify's default static-site build doesn't know how to run Next.js's server-side routes (every page here, all of `app/api/**`, and NextAuth all need a live server, not just static HTML) — so it deployed an empty/partial site and every real page 404'd.

The fix is already in this codebase now: `netlify.toml` and the `@netlify/plugin-nextjs` dev dependency, which tell Netlify to run Next.js through its serverless-functions runtime instead of treating it as static output. To use it:

1. `npm install` again locally first (to pull in the new `@netlify/plugin-nextjs` package), then push/redeploy.
2. In the Netlify UI, set the same environment variables listed above (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` = your Netlify URL, `SUPABASE_*`) under Site settings → Environment variables — Netlify does not read your local `.env` file.
3. Redeploy. Netlify will now run `prisma generate && next build` and route through its Next.js runtime instead of serving a static folder.
4. Run `npx prisma migrate deploy` and `npm run seed` against production the same way as the Vercel instructions above.

If you still get errors after this, they're most likely one of: (a) `DATABASE_URL` not set in Netlify's environment variables, (b) `NEXTAUTH_URL` not matching your live Netlify domain exactly, or (c) Prisma's query engine binary not matching Netlify's function runtime — if you hit that specific error, add `binaryTargets = ["native", "rhel-openssl-3.0.x"]` to the `generator client` block in `prisma/schema.prisma` and redeploy.

## 6. Known gaps / next steps

- No audit/activity log (the spec listed this as optional).
- No forgot-password flow for a user who is locked out entirely (self-service change while logged in is implemented — see `/dashboard/settings` and `PATCH /api/account/password`); a locked-out user needs an admin to reset their row directly via `prisma studio` or a short script using `bcrypt.hash`.
- Video preview in the lightbox assumes the browser can play the uploaded container/codec directly from the presigned URL — that's true for standard `mp4`/`webm` but not for all formats.
- The in-charge directory (`/dashboard/incharges`) is read-only in the UI; `POST /api/users` exists to create new in-charge accounts but isn't wired to a form yet — call it directly or add a small "+ New In-Charge" modal following the `ProjectFormModal` pattern.
