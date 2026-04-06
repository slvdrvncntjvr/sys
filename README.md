# System Board

Private owner-only clipboard + bulletin board web app for `sys.vincentrj.me`.

## Architecture Summary

- Framework: Next.js App Router + TypeScript + Tailwind CSS
- Auth: NextAuth credentials provider (owner-only, no registration)
- Session strategy: secure JWT session cookies (production-safe defaults via NextAuth)
- Data: Postgres + Prisma ORM
- Validation: Zod request validation
- Sanitization: `sanitize-html` plain-text sanitization for title/content/tags
- Security layers:
	- Protected routes via middleware (`/board`, `/archive`, `/trash`)
	- Server-side session and owner checks in layouts and API handlers
	- Login rate limiting (Upstash Redis when configured, in-memory fallback)
	- Input validation/sanitization across all note mutations

## Database Schema

See `prisma/schema.prisma`.

```prisma
enum UserRole {
	OWNER
}

model User {
	id           String   @id @default(cuid())
	email        String   @unique
	passwordHash String
	role         UserRole @default(OWNER)
	createdAt    DateTime @default(now())
	updatedAt    DateTime @updatedAt
	notes        Note[]
}

model Note {
	id         String   @id @default(cuid())
	title      String
	content    String
	tags       String[] @default([])
	isPinned   Boolean  @default(false)
	isArchived Boolean  @default(false)
	isTrashed  Boolean  @default(false)
	metadata   Json?
	userId     String
	user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
	createdAt  DateTime @default(now())
	updatedAt  DateTime @updatedAt
}
```

## Folder And File Structure

```text
prisma/
	schema.prisma
	seed.ts

src/
	app/
		(protected)/
			layout.tsx
			loading.tsx
			board/page.tsx
			archive/page.tsx
			trash/page.tsx
		api/
			auth/[...nextauth]/route.ts
			notes/route.ts
			notes/[id]/route.ts
		login/page.tsx
		layout.tsx
		page.tsx
		globals.css

	components/
		board-client.tsx
		login-form.tsx

	lib/
		auth.ts
		note-queries.ts
		prisma.ts
		rate-limit.ts
		sanitize.ts
		validators/note.ts

	types/
		note.ts
		next-auth.d.ts

middleware.ts
.env.example
```

## Setup And Run Steps

1. Install dependencies.

```bash
npm install
```

2. Create local env file.

```bash
cp .env.example .env
```

3. Set values in `.env`:
- `DATABASE_URL`
- `NEXTAUTH_URL` (local: `http://localhost:3000`)
- `NEXTAUTH_SECRET` (strong random string)
- `OWNER_EMAIL`
- `OWNER_PASSWORD`
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (recommended in production)

4. Initialize database and Prisma client.

```bash
npm run db:generate
npm run db:migrate -- --name init
```

5. Seed owner account.

```bash
npm run db:seed
```

6. Start dev server.

```bash
npm run dev
```

7. Open `http://localhost:3000/login` and sign in with owner credentials.

## API Summary

- `GET /api/notes?view=board|archive|trash&q=term`
- `POST /api/notes`
- `PATCH /api/notes/:id`
- `DELETE /api/notes/:id`

Delete behavior:
- From board/archive: soft-delete to trash
- From trash: permanent delete

## Production Auth And Security Checklist

- `NEXTAUTH_SECRET` is strong and unique per environment
- `NEXTAUTH_URL` uses `https://sys.vincentrj.me` in production
- TLS enabled (Vercel default)
- Owner credentials are strong and rotated when needed
- Registration is not exposed anywhere
- Middleware protects app routes
- API handlers re-check owner server-side
- Login rate limiting active (configure Upstash for multi-instance safety)
- Zod validation active for all note writes
- Sanitization active for text fields
- No client-side logging of sensitive auth data

## Deploy To Vercel

1. Push repository to GitHub.
2. In Vercel: "New Project" -> import repo.
3. Set environment variables in Vercel Project Settings:
- `DATABASE_URL`
- `NEXTAUTH_URL` = `https://sys.vincentrj.me`
- `NEXTAUTH_SECRET`
- `OWNER_EMAIL`
- `OWNER_PASSWORD`
- Optional: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
4. Set build command to default (`next build`).
5. Deploy.
6. Run migrations on production database (via CI/CD or `prisma migrate deploy`).
7. Run seed once with production owner credentials.

## Map Custom Domain `sys.vincentrj.me`

1. In Vercel project, go to Settings -> Domains.
2. Add `sys.vincentrj.me`.
3. In DNS provider, create record as instructed by Vercel:
- Usually `CNAME` for `sys` -> `cname.vercel-dns.com`
4. Wait for DNS propagation and certificate issuance.
5. Confirm `https://sys.vincentrj.me/login` loads.

## Manual Test Checklist

- Login page renders at `/login`
- Invalid password is rejected
- Multiple failed attempts trigger rate limit
- Unauthenticated access to `/board`, `/archive`, `/trash` redirects to `/login`
- Quick capture creates a note
- Edit updates title/content/tags
- Pin/unpin works
- Archive from board and restore from archive work
- Trash from board/archive works
- Restore from trash works
- Permanent delete from trash works
- Search filters by content and tags
- Mobile layout remains usable
- Keyboard shortcuts work (`/`, `n`, `Ctrl/Cmd+Enter`)
