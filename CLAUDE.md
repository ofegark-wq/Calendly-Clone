# Calendly clone

## What this is
Hosts sign in, create appointment types, and set weekly availability.
Invitees open a public page, pick an open slot, and book it with name + email.

Full phase-by-phase build plan: `Calendly Clone — Build Plan with Claude Code.md`.

## Stack
- Next.js (App Router, TypeScript), Tailwind
- Supabase Auth + Postgres, via @supabase/ssr
- GitHub -> Vercel (auto-deploy from main)

## Rules
- All times are Africa/Lagos (UTC+1, no DST). Store timestamptz; display with timeZone 'Africa/Lagos'.
- Never commit .env.local. Only the public Supabase URL and anon/publishable key go in the browser.
- Never use the service role key anywhere in this app.
- Every table has Row Level Security enabled.
- SQL changes go in supabase/migrations/NNN_name.sql.
- Keep it simple: ask before adding a new library.

## How we work
- For each phase: show a plan first. No code until it's approved.
- Build only the current phase. No jumping ahead, no extras.
- When a phase is done, say exactly how to test it and what the user needs to
  do themselves (Supabase dashboard, Vercel, keys).
- Briefly explain important decisions in plain language, especially SQL, RLS
  policies, and anything security-related.
- If a request is unclear or looks risky, ask before building.

## Out of scope
External calendar sync, SMS reminders, team/round-robin scheduling,
payments, custom branding, time-zone conversion.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
