# notion-clone

Notion-style workspace (Next.js App Router) with Supabase Postgres, RLS, and Google OAuth.

## Local setup

1. Copy `.env.example` to `.env` and set Supabase URL + anon key.
2. Enable Google provider in Supabase Auth; redirect URL: `http://localhost:3000/auth/callback`.
3. `pnpm install` (or `npm install`) then `pnpm dev`.

## Vercel

- Connect the project to GitHub **`main`** (latest commit). Do not redeploy an old failed deployment — that reuses the old Git SHA.
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Add production redirect URL in Supabase: `https://<your-domain>/auth/callback`.
