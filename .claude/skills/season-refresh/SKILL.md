---
name: season-refresh
description: The owner-light data refresh loop for première. Use when asked to "refresh the data", "update performances", "run the weekly refresh", or when published dates are stale. Runs ON THE OWNER'S MAC (residential IP + real Chrome) — crawl every house, repair broken sources by reading the official site in Chrome, verify each change against its source, then publish only after the owner says yes.
---

# Season refresh — crawl → repair → verify → one approval

## Why this exists
Three things made real data painful: cloud machines get 403 from the houses,
listing URLs rot (Paris was a 404, Vienna an empty shell), and the owner had to
find URLs by hand and review rows in a terminal. An agent session on the owner's
Mac removes all three: it has the residential IP, it can read the official site
in the owner's Chrome to find the right page itself, and it does the first-pass
verification so the owner only answers one question.

**Where this runs:** a Claude session on the owner's Mac, in this repo, with
`.env.local` present. In a cloud container it cannot work — house sites and
Supabase are unreachable there. If you are in the cloud and no computer is
attached, say so and stop; never substitute mocked or remembered data.

## The rules that do not bend
1. **Nothing publishes without the owner's explicit yes in this conversation.**
   Publishing goes through `npm run review:pending -- --publish`, which applies
   the shared guard (`src/lib/review-guard.ts`). Never write `published` any
   other way. A yes for one batch is not a yes for the next.
2. **No fabricated data.** A date you could not confirm on the house's own page
   stays pending or is rejected. Empty beats wrong.
3. **Read like a visitor.** Open public pages only. Never solve a CAPTCHA, log
   in, or defeat an active challenge — a house that challenges is skipped and
   reported, not bypassed (`docs/SOURCES.md` tiers).
4. Secrets stay in `.env.local`; never print them.

## Protocol

### 1. Baseline
```bash
git pull --ff-only
npm ci            # only if node_modules is missing or the lockfile changed
npm run audit:published -- --suspicious   # what is already live and doubtful
npm run review:pending                    # what is already waiting
```
Note the counts — the report at the end is a before/after.

### 2. Crawl everything
```bash
npm run ingest -- --all --live
```
Each source is isolated; one failure never stops the run. From the output, sort
every house into: **ok** (rows found) · **empty** (0 rows) · **blocked**
(403/401/challenge) · **error**.

### 3. Repair the ones that failed — this is the step a script cannot do
For each *empty / blocked / error* house, open its official site in Chrome and
find out why:
- **The listing moved** (new season path, redesigned site): find the page that
  lists the season, update its entry in `scripts/ingest/run-ingest.ts`, re-run
  `npm run ingest -- --source <slug> --live`.
- **The page only renders in a real browser** (plain fetch blocked, Chrome
  fine): save the rendered listing HTML to `scripts/ingest/.local/<slug>.html`
  and run `npm run ingest:local -- --source <slug>`.
- **No combined listing exists** (per-production pages): add the production URLs
  as `extraUrls` on the source.
- **Active challenge / login wall:** leave it. Report it as blocked.

Commit source-config fixes on a branch; they are code changes like any other.

### 4. Verify before asking — the first-pass review
`npm run review:pending` lists what the crawl wrote. For each house with pending
rows, open the row's `source_url` (or the house listing) in Chrome and check:
- title and run dates match the official page (watch the year on runs that
  cross New Year, and two engagements merged into one long run);
- it is a performance — not a class, talk, tour, workshop or broadcast;
- a **date change** on an already-published row really changed on the site;
- a **cancellation** is stated by the house, not inferred from a missing row.

Reject what is wrong (`-- --slug <slug> --reject` when a whole house is bad;
otherwise fix the cause and re-crawl that house). Keep a short list of anything
you could not confirm either way.

Also clear what is already live and wrong:
```bash
npm run clean:published            # dry run: non-performances that slipped through
npm run audit:published -- --suspicious
```

### 5. One question to the owner
Send a single summary, not a queue:
- per house: new · date-changed · cancelled · rejected-by-you (with the reason);
- the **few rows that need a human eye**, each with its official link;
- houses still blocked, and why.

Then ask once: publish these? Wait for the answer.

### 6. Publish (only after the yes)
```bash
npm run review:pending -- --publish          # or -- --slug <slug> --publish
npm run clean:published -- --yes             # only if the owner approved the hides
```
Read the receipt — the guard names anything it withheld. Then confirm on the
live site (`/calendar`, one house page, `/this-week`): the rows are there and
the VerifiedDates badge shows today's date.

### 7. Close out
- Push the branch with any source-config fixes and tell the owner what changed.
- Report before/after: houses with data, upcoming performances, rows still
  pending, houses blocked.
- Add an entry to the current `reports/day-XX-report.md` (bilingual) only when
  the refresh changed code or uncovered something worth recording.

## Cadence
Weekly is enough — seasons do not move daily. Run it more often only around
season announcements (spring) and when an on-sale date is near.
