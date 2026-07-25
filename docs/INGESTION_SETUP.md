# Ingestion — Operator Setup Runbook

The autonomous ingestion + Telegram approval system is **built**. This is the
owner-only checklist to switch it on. Nothing publishes without your approval.

## Pipeline at a glance

```
GitHub Actions (every 2 days)  scripts/ingest/run-ingest.ts
  discover → fetch → extract (feed-first, else Haiku) → normalize → resolve
  → diff → write review_status='pending'  → Telegram digest per company
Telegram tap (Approve/Reject)  POST /api/telegram/webhook
  → flips pending → published (+ last_verified) → revalidates the site
```

Cost is near-zero: feeds never call the model, an unchanged page (content-hash
cached) is skipped, and only changed HTML pages spend one `claude-haiku-4-5`
call (~$0.025). Realistic spend at 10–15 houses is **< $1–2/month**.

## 1. Supabase (new project)

1. Create a new Supabase project.
2. SQL editor → run, in order:
   `002_rebuild_schema.sql` → `003_entity_graph.sql` → `004_ingestion.sql`.
3. Copy the **Project URL**, **anon key**, and **service-role key**.

## 2. Environment variables

| Variable | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + `.env.local` | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + `.env.local` | public |
| `SUPABASE_SERVICE_ROLE_KEY` | **GitHub Secrets** + Vercel (server) + `.env.local` | NEVER the browser/anon path |
| `ANTHROPIC_API_KEY` | GitHub Secrets + `.env.local` | set a monthly budget + usage alert |
| `TELEGRAM_BOT_TOKEN` | GitHub Secrets + Vercel | from @BotFather |
| `TELEGRAM_CHAT_ID` | GitHub Secrets + Vercel | your numeric id (e.g. @userinfobot) |
| `TELEGRAM_WEBHOOK_SECRET` | Vercel | random string; passed to setWebhook |

## 3. Seed + verify

```bash
npm run seed            # load the 25 curated companies / ~155 performances
npm run validate:data   # must be green
```

The live site reads `review_status='published'` rows (seed rows default to
published), so the catalogue is populated immediately and is never empty.

## 4. Telegram bot

1. Create a bot via **@BotFather** → `TELEGRAM_BOT_TOKEN`.
2. Get your numeric **chat_id** (e.g. message @userinfobot).
3. Choose a random `TELEGRAM_WEBHOOK_SECRET`.
4. After deploying, register the webhook (one curl):

```bash
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -d "url=https://worldballetoperacalender.vercel.app/api/telegram/webhook" \
  -d "secret_token=${TELEGRAM_WEBHOOK_SECRET}"
```

The webhook verifies the `X-Telegram-Bot-Api-Secret-Token` header on every tap.

## 5. Sources

Pick the initial **10–15 houses** and fill their rows in `docs/SOURCES.md`
(listing URL, feed, affiliate, robots/ToS). **Check each robots.txt + Terms** —
prefer official feeds/affiliate APIs; mark `forbidden` so the crawler skips.

Register each source in `scripts/ingest/run-ingest.ts` → `SOURCES`:

```ts
'royal-ballet': { companySlug: 'royal-ballet', url: '<listing-url>', kind: 'ical' },
// kind: 'ical' | 'rss' | 'jsonld'  → deterministic, no LLM
// kind: 'html'                     → Haiku extraction (or attach a CSS `adapter`)
```

The three existing CSS adapters (`royal-ballet`, `paris-opera-ballet`,
`wiener-staatsoper`) are HTML templates; copy one for a CSS-stable site.

Optionally pre-seed `ingest_sources` rows with `robots_ok`/`tos_ok`. A source
earns `auto_approve` automatically after **3** consecutive clean human
approvals (any reject resets it); date-changes and cancellations always stay
manual regardless.

## 5b. Ingestion tiers & 30-house routing (first-principles)

**The one hard constraint is trust: never publish a wrong date.** Everything
below is derived from it. A house is routed to the *most deterministic tier it
allows*, because a parser cannot hallucinate a date but a model can. Reliability
and cost both rank **A > B > C** — always try to promote a house up a tier.

| Tier | How | Fetch | Extract | Confidence | Cost |
|---|---|---|---|---|---|
| **A · Feed** | Official structured data | plain fetch *or* render | deterministic parse (`ical`/`rss`/`jsonld`/`wp-ajax`) | 1.0 | ~free |
| **B · Render + LLM** | JS listing, no feed | headless Chrome (real UA) | one Haiku call, hash-cached | 0.85 | ~$0.025/changed page |
| **C · Operator-local** | 403/SPA blocks even the Mac's Chrome | owner saves the page in their **own** browser → `scripts/ingest/.local/<slug>.html` | same as its kind | as above | manual save |

Two guardrails make even Tier B safe to auto-run: (1) **plausibility validators**
reject implausible rows before they reach the queue (e.g. a run spanning >200
days is two merged engagements, not one show); (2) **the human approval gate** —
nothing publishes without a Telegram tap. Tier A still passes the same gate.

**Fetch rule of thumb:** a `jsonld` house whose plain `fetch` 403s (Cloudflare/
Akamai bot wall) should carry `render: true` — headless Chrome clears the wall,
then the JSON-LD is parsed out of the rendered HTML deterministically (still no
model call). This is exactly how `metropolitan-opera` is wired.

### Current routing of the target houses

Status legend: ✅ verified extracting · ⚠️ registered, needs a live check ·
🔧 known issue (see below) · ⬜ not yet registered.

**Tier A — deterministic feed**
- ✅ `american-ballet-theatre` — `wp-ajax` (replicates the site's own calendar POST)
- ✅ `metropolitan-opera` — `jsonld` + `render:true` (renders past the 403, parses JSON-LD)

**Tier B — render + LLM** (all `kind:'html', render:true`)
- ✅ `royal-ballet` · `royal-opera` (one RBO site, split by `hotFilter`)
- ✅ `new-york-city-ballet` · `san-francisco-ballet` (SF: graph-link FK, see below)
- ✅ `hamburg-ballett` · `stuttgart-ballet` · `bayerische-staatsoper`
- ⚠️ `wiener-staatsoper` · `wiener-staatsballett`
- ⚠️ `teatro-alla-scala` · `royal-danish-ballet` · `dutch-national-ballet`
- ⚠️ `national-ballet-of-canada` · `australian-ballet`
- ⚠️ `tokyo-ballet` · `new-national-theatre-tokyo`
- ⚠️ `teatro-colon` · `opera-australia`
- 🔧 `paris-opera-ballet` · `opera-national-de-paris` — render returns a listing-
  less shell (SPA/consent wall): 0 booking-links, identical HTML for both URLs.
  Needs a live diagnostic (`waitForSelector`, or promote to Tier C).

**Runway to ~30:** the remaining seats are new Tier-B rows (a real what's-on URL
is all that's needed) or Tier-A promotions where a house exposes a feed. Add one
house at a time, run it alone (`npm run ingest -- --source <slug> --live`),
confirm the digest, then leave it in `--all`.

### Known issues & their blast radius

- **Stale ghost rows (`…-0026`/`…-0027`)** — an *old* year-parse bug wrote slugs
  with a stripped century. The parser is fixed (`fixLowYear`/`withFixedYear` in
  `scripts/scrapers/normalize.ts`), so **no new ghosts are created**; the current
  crawl only sees them as "missing" and the 2-miss debounce is cleaning them out.
  They can be purged directly — see `npm run` purge below. **No real show is at
  risk** (the debounce holds genuine absences too).
- **`works_slug_key` duplicate + FK** (Royal, SF) — the same work (e.g. *Manon*)
  is minted with a fresh `work_id` per company crawl, colliding on the unique
  `slug`. The listing still publishes: the writer falls back to storing the
  performance **without** graph links (the site doesn't yet query them). A proper
  fix is shared cross-company work resolution — deferred, no data loss today.

## 6. Run it

- Manual: GitHub → Actions → **Ingest** → Run workflow (or `npm run ingest -- --all --live`).
- Scheduled: every 2 days (`.github/workflows/ingest.yml`).
- Dry run offline: `npm run ingest -- --all --fixture` (writes nothing).
- Diff self-check: `npm run ingest:selftest`.

You'll get one Telegram digest per company per run. Tap **✅ Approve all** /
**🚫 Reject all**. Approved rows appear on the site within minutes (the webhook
revalidates `/`, `/search`, the company, and the touched work/people/performance
pages).

## 7. `--local` — the Mac / browser-saved HTML path (recommended for launch)

Most major houses return **403 to any datacenter IP** (GitHub Actions, Vercel),
so the scheduled crawl can't reach them — this is the root cause of the site
looking empty (ROADMAP #3 / #12). The fix is to let **your own browser** fetch
the page (residential IP, logged in, fully JS-rendered) and feed that HTML to the
exact same pipeline. Nothing is fabricated and nothing publishes without your
Telegram approval — only the *fetch* step changes.

**Per company (≈30 seconds each):**

1. Open the house's what's-on page in Chrome/Safari.
   - Don't know the URL? Run `npm run ingest:local -- --source <slug>` with no
     file saved — it prints the exact URL and the filename to use.
2. **File → Save As →** "Webpage, HTML Only" (Chrome) / "Page Source" (Safari).
3. Save it as `scripts/ingest/.local/<slug>.html` (e.g. `tokyo-ballet.html`).
4. Run the ingest:
   ```bash
   npm run ingest:local -- --source tokyo-ballet   # just this house
   npm run ingest:local -- --all                   # every house you've saved
   ```
5. Approve in Telegram → live within minutes.

Requirements: `.env.local` must have `SUPABASE_SERVICE_ROLE_KEY` (to write the
pending rows) and `ANTHROPIC_API_KEY` (Haiku extraction, ~$0.025/page). Saved
HTML is git-ignored — never committed. The page-hash cache means re-saving an
unchanged page costs nothing; only changed pages spend a model call.

See `scripts/ingest/.local/README.md` for the same checklist next to the folder.

## 8. Reader email — what approval actually sends

Approving a batch does **not** email everyone. The daily crawl exists for
freshness; a reader who follows twenty houses must never get twenty emails a
day. So the send is split:

| When | What | Who |
|---|---|---|
| On approval (instant) | **Date changes only** (`change_kind='date-changed'`) | followers of that company / touched works |
| Thursday 07:00 JST (cron) | **The weekly digest** — this week on stage · worth the journey (12 weeks out, every house, never repeated to the same reader) · newly announced | every subscriber, including newsletter-only ones |

A reader with nothing in all three sections is skipped that week — an empty
letter costs more trust than a missed one. Both paths are idempotent
(`notification_log` keyed by `digest:<ISO-week>` or the batch id), so a retry
or a double-tap can't double-send. Cast is never listed; every entry links to
the company's own site and the source listing, under a standing "confirm with
the house before booking" note.

Setup: run `007_notifications.sql` + `008_digest.sql`, set `RESEND_API_KEY`
(and later `EMAIL_FROM` once the domain is verified) and `CRON_SECRET` in
Vercel. Test with `npx tsx scripts/test-digest.ts you@example.com` (dry run),
then `--send`; re-running must report `sent: 0`.
