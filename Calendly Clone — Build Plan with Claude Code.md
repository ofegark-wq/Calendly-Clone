# Calendly Clone — Build Plan with Claude Code

Sep 28, 2026 · @ok

## Overview

We build the app in nine phases (0–8). Each phase ends deployed on Vercel with a "done when" check, before the next one starts. Claude Code writes most of the code; you make the decisions, review, and test.

- **What we're building:** hosts sign in, create appointment types, and set their weekly hours. Invitees open the host's public page, pick an open slot, and book it with their name and email.
- **Stack:** Next.js (App Router, TypeScript) · Supabase Auth + Postgres · GitHub · Vercel. Supabase Storage isn't needed, since there are no uploads.
- **Time zone:** everything runs on Africa/Lagos time (WAT, UTC+1, no daylight saving). Times are stored as `timestamptz` and always shown in Africa/Lagos.
- **Keys go in twice:** in `.env.local` on your laptop and in Vercel's Environment Variables, as in your diagram.

&#91;embedded content: build roadmap · 9 phases\]

Phases 3 and 4 both need sign-in and can be built in either order. The booking page needs both.

## Before you start

Set these up once, before Phase 0. It takes about an hour.

**Accounts**

- GitHub
- Vercel (sign in with GitHub so it can see your repos)
- Supabase (the free tier is enough)

**On your laptop**

- Node.js 20 or newer, and Git
- A code editor (e.g. VS Code)
- Claude Code: install it, then run `claude` inside the project folder

**Project memory: CLAUDE.md**

Claude Code reads `CLAUDE.md` at the project root at the start of every session. Put the rules there once, so you don't have to repeat them in every prompt. Start from this template in Phase 0:

```markdown
# Calendly clone

## What this is
Hosts sign in, create appointment types, and set weekly availability.
Invitees open a public page, pick an open slot, and book it with name + email.

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

## Out of scope
External calendar sync, SMS reminders, team/round-robin scheduling,
payments, custom branding, time-zone conversion.
```

**The loop for every phase**

1. Start a fresh Claude Code session, or run `/clear`.
2. Switch to plan mode (Shift+Tab), paste the phase prompt, and read the plan. Correct it before any code is written.
3. Let Claude Code build it.
4. Read the diff. Run `npm run dev` and test on `localhost:3000`.
5. Describe anything broken to Claude Code in plain words and let it fix it.
6. Commit and push. Vercel deploys automatically.
7. Run the phase's "done when" checks on the Vercel URL, then move on.

If you don't understand something Claude Code wrote, ask it to explain before moving on. Understanding the code is part of the bootcamp.

## Phase 0 — Pipeline setup

**Goal:** an almost-empty Next.js app, live on your Vercel URL and connected to Supabase.

**You do**

1. Create a Supabase project in the region nearest you. Save the database password somewhere safe.
2. Create an empty GitHub repo, e.g. `calendly-clone`.
3. Make a project folder on your laptop, open a terminal in it, and run `claude`.

**Prompt for Claude Code**

```text
Create a new Next.js app in this folder: TypeScript, App Router, Tailwind, ESLint.
Install @supabase/supabase-js and @supabase/ssr. Set up Supabase clients for
browser components, server components, and middleware, following the @supabase/ssr
docs. Read NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from env.
Add .env.example with those two names and no values. Confirm .env.local is in
.gitignore. Make the home page say "Calendly clone - coming soon".
Then create CLAUDE.md with the content I paste next.
```

Then paste the CLAUDE.md template from above.

**You do (keys go in twice)**

1. In Supabase, go to Project Settings → API. Copy the Project URL and the anon key (newer projects may call it the "publishable" key) into `.env.local`.
2. Run `npm run dev` and check `localhost:3000`.
3. Ask Claude Code to connect the folder to your GitHub repo and push.
4. In Vercel, click Add New → Project and import the repo.
5. Paste the same two keys into Vercel → Project → Settings → Environment Variables, then redeploy.

**Done when**

- [ ] `localhost:3000` shows the "coming soon" page
- [ ] Your `.vercel.app` URL shows the same page
- [ ] `.env.local` does **not** appear in the GitHub repo
- [ ] `CLAUDE.md` is committed

## Phase 1 — Database + security rules

**Goal:** four tables in Supabase, each locked down with Row Level Security (RLS), and the SQL saved in the repo.

| Table | Key columns | Who can read | Who can write |
| --- | --- | --- | --- |
| `profiles` | `id` (= auth user id), `username` (unique), `full_name` | Anyone, so the public page can find the host | The host, only their own row |
| `event_types` | `host_id`, `title`, `slug`, `duration_minutes` (15/30/45/60), `description`, `is_active`; slug unique per host | Anyone (active ones only); the host sees all of theirs | The host, only their own |
| `availability` | `host_id`, `weekday` (0–6), `start_time`, `end_time`; end must be after start; a weekday can have several rows, but they must not overlap | Anyone | The host, only their own |
| `bookings` | `event_type_id`, `host_id`, `start_at`, `end_at` (timestamptz), `invitee_name`, `invitee_email`, `status` (confirmed/cancelled) | The host, only their own. **Never the public** | Only through a database function (Phase 6); the host can cancel |

The double-booking guard goes into the database now: an exclusion constraint that stops two *confirmed* bookings for the same host from overlapping in time. It works across appointment types of different lengths, which a simple "unique start time" rule would not.

**Prompt for Claude Code**

```text
Plan mode first. Write supabase/migrations/001_schema.sql that creates the four
tables in the table I'll paste (profiles, event_types, availability, bookings) with
the columns and checks listed. Enable RLS on every table and add policies exactly
as described in the "who can read / who can write" columns. Anonymous users must
NOT be able to select from bookings. Enable btree_gist and add an exclusion
constraint on bookings: no two rows with the same host_id and overlapping
tstzrange(start_at, end_at) where status = 'confirmed'. Explain each policy in a
comment above it.
```

Paste the table above into the prompt. Then:

1. Read the SQL and ask Claude Code about anything unclear, especially the policies.
2. Paste the SQL into Supabase → SQL Editor and run it.
3. Commit and push.

**Done when**

- [ ] All four tables appear in the Supabase Table Editor, each marked as RLS enabled
- [ ] Inserting two overlapping confirmed bookings by hand in the SQL editor fails with a constraint error
- [ ] `supabase/migrations/001_schema.sql` is on GitHub

## Phase 2 — Host sign-in

**Goal:** a host can sign up with email, password, and a username, log in, reach a private dashboard, and log out. Invitees never need an account.

**You do**

1. In Supabase → Authentication → URL Configuration, set the Site URL to your Vercel URL. Add `http://localhost:3000/**` to the redirect URLs.
2. For faster testing, you can turn off "Confirm email" under Authentication → Providers → Email. Turn it back on before the demo if you want.

**Prompt for Claude Code**

```text
Plan mode first. Add host authentication with Supabase Auth (email + password):
- /signup: email, password, username (lowercase letters, numbers, hyphens; check
  it isn't taken). Pass username in the sign-up metadata.
- Migration 002: a trigger on auth.users that creates the profiles row from that
  metadata.
- /login and a logout button.
- /dashboard shows "Hi <username>" and the host's public link /<username>.
- Middleware: /dashboard/** requires a session and redirects to /login otherwise.
Use server actions, and show clear error messages on the forms.
```

Run migration 002 in the SQL Editor, then test.

**Done when**

- [ ] On the Vercel URL, you can sign up, land on `/dashboard`, and see your username
- [ ] A matching row appears in `profiles`
- [ ] Logging out, then visiting `/dashboard`, sends you to `/login`
- [ ] Signing up with a username that's already taken shows an error

## Phase 3 — Appointment types

**Goal:** a host can create, edit, deactivate, and delete appointment types, e.g. "30-min intro call".

**Prompt for Claude Code**

```text
Plan mode first. Build /dashboard/event-types:
- List the signed-in host's appointment types: title, duration, active/inactive,
  and a copy button for the public link /<username>/<slug>.
- Create and edit form: title, slug (auto-filled from the title, editable),
  duration (15, 30, 45 or 60 minutes), description, active toggle.
- Delete with a confirmation. If the type has upcoming bookings, only allow
  deactivating it.
Rely on RLS for security, and also filter by host_id in queries. Show a friendly
error if the slug is already used by this host.
```

**Done when**

- [ ] You can create "30-min intro call", change it to 45 minutes, and the change sticks after a refresh
- [ ] A second test host account can't see or edit the first host's types (sign up a second account in an incognito window to check)
- [ ] Deactivated types are marked clearly in the list

## Phase 4 — Weekly availability

**Goal:** a host sets their working hours for each day of the week. This is the "host creates and edits their own calendar" side your reviewer asked for.

Each day can have **several** time windows, e.g. 09:00–12:00 and 14:00–17:00 to leave a lunch break. Windows on the same day must not overlap.

**Prompt for Claude Code**

```text
Plan mode first. Build /dashboard/availability:
- Seven rows, Monday to Sunday. Each day has an on/off toggle and a list of
  time windows (start + end pickers in 30-minute steps).
- "+ Add window" adds another window to that day; a remove button deletes one.
- On first visit with no saved rows, prefill Mon-Fri 09:00-17:00 and weekends off.
- Save replaces all of this host's availability rows in one go (one row per
  window).
- Validate that each end is after its start, and that windows on the same day
  don't overlap. Show errors inline next to the window.
- Show each day's windows sorted by start time.
All times are Africa/Lagos local time and are stored as plain `time` values.
```

**Done when**

- [ ] You can set Monday to 09:00–12:00 **and** 14:00–17:00, and both windows are still there after a refresh
- [ ] Overlapping windows on the same day (e.g. 09:00–12:00 and 11:00–13:00) show an error and don't save
- [ ] An end time before its start time shows an error and doesn't save
- [ ] The rows in Supabase match what the page shows (one row per window)

## Phase 5 — Public booking page

**Goal:** at `/<username>/<slug>`, anyone can see the host's real open slots for the next 14 days and pick one.

How slots are worked out:

1. For each of the next 14 days, find all of the host's windows for that weekday.
2. Cut each window into slots of the appointment's length, e.g. 09:00, 09:30, 10:00… for 30 minutes. A slot that would run past the end time is dropped.
3. Drop slots that have already passed.
4. Drop slots that overlap an existing confirmed booking.

For step 4, the page needs to know which times are taken **without** seeing who booked them. A database function `get_busy_times(host, from, to)` returns only start and end times.

**Time zone rule:** Lagos is UTC+1 all year, so a Monday 09:00 slot is written `2026-10-05T09:00:00+01:00`. No time-zone library is needed.

**Prompt for Claude Code**

```text
Plan mode first.
1) Migration 003: SQL function get_busy_times(p_host_id uuid, p_from timestamptz,
   p_to timestamptz) returning only start_at, end_at of confirmed bookings.
   SECURITY DEFINER, set search_path, grant execute to anon and authenticated.
2) lib/slots.ts: a pure function generateSlots(availability, durationMinutes,
   busyTimes, now, days = 14) returning slots as ISO strings with +01:00
   (Africa/Lagos). Write Vitest tests: a slot ending exactly at end_time is
   included, one running past it is not, past slots and overlaps are excluded, and a day with two windows
   (09:00-12:00 and 14:00-17:00) has no slots in the gap between them.
3) Page /[username]/[slug]: load profile, active event type, availability and busy
   times, then show the days that have open slots and time buttons for the chosen
   day. Choosing a time shows a name + email form (submit comes in Phase 6).
   404 if the user or type doesn't exist. The page must be dynamic (no caching)
   so a refresh always shows fresh data.
4) Page /[username]: list the host's active appointment types.
```

**Done when**

- [ ] `npm test` passes
- [ ] In an incognito window, the booking page shows slots that match the host's hours
- [ ] You change the host's hours, refresh the public page, and the slots change. This is the first half of your "I \_\_\_, you refresh" test
- [ ] An unknown username or slug shows a 404 page

## Phase 6 — Booking, with no double-booking

**Goal:** an invitee submits their name and email, the booking is saved, and two people can never book the same time.

Bookings go through one database function, `create_booking`, instead of a direct insert. The function checks that the time is real, not in the past, and inside the host's hours. The exclusion constraint from Phase 1 rejects any overlap, even when two people press "Book" in the same second. The page's checks are for friendliness; the database's checks are what make it safe.

**Prompt for Claude Code**

```text
Plan mode first.
1) Migration 004: SQL function create_booking(p_event_type_id uuid,
   p_start_at timestamptz, p_name text, p_email text) returning the booking id.
   SECURITY DEFINER, set search_path. It must: load the active event type and
   its host; compute end_at from duration_minutes; reject past times; check the
   slot fits entirely inside one of the host's availability windows for that weekday in Africa/Lagos;
   validate name (1-100 chars) and email format; insert a confirmed booking.
   If the exclusion constraint fires, raise a clear 'slot_taken' error.
   Grant execute to anon and authenticated.
2) Wire the Phase 5 form to a server action that calls this function.
   On success, redirect to /[username]/[slug]/confirmed showing the date, time
   (Africa/Lagos), host and appointment type. On slot_taken, show "Sorry, that
   time was just booked. Please pick another." and reload the slots.
```

**Done when**

- [ ] Booking a slot shows the confirmation page, and the row appears in `bookings`
- [ ] Refreshing the booking page shows that slot as gone
- [ ] **Race test:** open the same slot in two browser windows, fill both forms, and submit both. One succeeds and the other shows the "just booked" message
- [ ] Booking a 60-minute slot that overlaps an existing 30-minute booking is also rejected

## Phase 7 — Host dashboard + the two-browser test

**Goal:** the host sees who booked what and can cancel a booking. Cancelling frees the slot again.

**Prompt for Claude Code**

```text
Plan mode first. Build /dashboard/bookings:
- Tabs: Upcoming (soonest first) and Past.
- Each row: date and time (Africa/Lagos), appointment type, invitee name + email,
  status.
- A Cancel button with confirmation that sets status = 'cancelled'.
On /dashboard, show the next 5 upcoming bookings and links to Event types,
Availability and Bookings. The pages must be dynamic so a refresh shows new
bookings.
```

**The two-browser test** (your "I \_\_\_, you refresh, and you see it")

Use two windows: **A** = a normal window signed in as the host, **B** = an incognito window as the invitee.

1. **A:** turn on Saturday 10:00–12:00 and save.
2. **B:** refresh the booking page. Saturday's slots now appear.
3. **B:** book Saturday 10:00.
4. **A:** refresh Bookings. The 10:00 booking is there.
5. **B:** refresh the booking page. 10:00 is gone.
6. **A:** cancel the booking.
7. **B:** refresh. 10:00 is open again.

**Done when**

- [ ] All seven steps pass on `localhost`
- [ ] Cancelled bookings show as cancelled and no longer block the slot

## Phase 8 — Live check + demo

**Goal:** everything works on the public Vercel URL, not just on your laptop, and you're ready to show it.

**Prompt for Claude Code (security review)**

```text
Review the whole codebase and all migrations against CLAUDE.md. List any problems,
especially: tables without RLS, policies that let anonymous users read bookings or
edit other hosts' data, any use of the service role key, secrets that could be
committed, and pages that are cached when they should be dynamic. Don't change
anything yet. Show me the list first.
```

**Checklist**

- [ ] Vercel has both Supabase keys under Environment Variables, and the latest deploy succeeded
- [ ] The Supabase Site URL is your Vercel URL
- [ ] The full two-browser test passes on the live URL
- [ ] The booking page works on a phone
- [ ] Test data is cleaned out. One demo host exists with 2 appointment types and realistic hours
- [ ] The README says what the app does, lists the stack, gives the live link, and notes what's cut
- [ ] You've posted in the Space with the link and a short screen recording of the two-browser test

## Schedule, cut list, and troubleshooting

**Suggested pace** (adjust to the days you have)

1. Day 1: Phases 0–1 (pipeline + database)
2. Day 2: Phases 2–3 (sign-in + appointment types)
3. Day 3: Phase 4, and start Phase 5
4. Day 4: finish Phase 5 (booking page + slot tests)
5. Day 5: Phases 6–7 (booking, double-booking guard, dashboard)
6. Day 6: Phase 8 (live check, clean-up, demo)

If you fall behind, protect Phases 5–6: they're the heart of the app. Polish can go.

**Not building** (from your scope check, plus time zones)

1. External Google/Outlook calendar sync
2. Automated SMS reminders
3. Team/round-robin scheduling
4. Payment collection
5. Custom branding
6. Time-zone conversion (everything is Africa/Lagos)

**Stretch goals, only if everything above is done:** email confirmations, a cancel link for invitees, buffer time between meetings.

**When something goes wrong**

| What you see | Likely cause | Fix |
| --- | --- | --- |
| Works on localhost, broken on Vercel | Keys missing in Vercel, or not redeployed after adding them | Add both env vars in Vercel, then redeploy |
| A query returns an empty list with no error | An RLS policy is blocking it | Ask Claude Code: "Which RLS policy applies to this query, and why does it return nothing?" |
| Refreshing doesn't show new data | Next.js cached the page | Make the page dynamic, or revalidate after saving |
| Slots are off by one hour | UTC and Lagos time got mixed | Build times with `+01:00` and display with `timeZone: 'Africa/Lagos'` |
| Sign-up email links go to localhost | Supabase Site URL still points to localhost | Set it under Authentication → URL Configuration |
| Claude Code keeps going in circles | The session has too much old context | `/clear`, restate the phase goal, and name the exact file and error |
