# Data Sources — the ingestion fuel list

This is the authoritative list of where live performance data comes from. The
scraper/ingestion pipeline (see `docs/INGESTION_SETUP.md` and the `data-ingest` skill)
reads one **adapter** per source. The richer this list, the more of the world's
stages the catalogue covers.

## ⚡ Start here: auto-discover feeds (run from YOUR machine)

Don't hunt for feeds by hand. Run the probe — it opens every house and reports
which ones expose an official iCal / RSS / JSON-LD feed, writing a ready-to-read
table to `docs/FEED_DISCOVERY.md`:

```bash
npm run discover:feeds                      # all houses
npm run discover:feeds -- --slug royal-ballet   # one house
```

**Run it on your own Mac, not a server.** Many houses (Cloudflare) return `403`
to datacenter IPs but serve a normal browser, so a datacenter run reports every
site as `bot-blocked` — a local run sees the real feeds. The probe is read-only.

### Source tiers (legality-first — we never evade bot protection)

| Tier | What | Action |
|---|---|---|
| **A** | Official machine feed (iCal / RSS / public JSON-LD) | Ingest now — fill the Feed column below |
| **B** | Authoritative aggregator API with an official agreement | Apply, then integrate |
| **C** | Official partnership / data request to the house | Email the house's press/data team |
| **—** | No feed and no agreement | **Skip.** A missing house is fine; evading a site's Terms is not |

A house that the probe marks `bot-blocked` is **not** automatically Tier —;
re-check it in your browser. The feed may exist behind the bot wall.

> **Your job (the human-in-the-loop):** for each company below, fill the four
> `TODO` columns, then add new companies at the bottom. You do **not** need to
> write any code — just research and fill the table. An engineer (or the AI
> ingestion agent) turns each filled row into an adapter.

## Current ingestion status (two legitimate paths, never fabrication)

The catalogue is **empty** until verified data is ingested and approved. Two
paths feed it; both end at the Telegram approval gate (nothing publishes itself):

1. **Feed houses (Tier A, deterministic, no model).** `discover:feeds` found
   official feeds for 5 houses; they are wired in `scripts/ingest/run-ingest.ts`:
   Metropolitan Opera (JSON-LD), Hamburg Ballett & Stuttgart Ballet (iCal),
   Teatro Colón & Opera Australia (RSS). Paste each feed URL from
   `docs/FEED_DISCOVERY.md` into the constants at the top of the registry.

2. **No-feed houses (AI extraction, local browser).** Flagship ballet houses
   (Royal Ballet, Paris Opera Ballet, ABT, NYCB, SF Ballet) render their
   listings with JavaScript — a plain fetch sees nothing. These use the
   **local Playwright path**: a real headless browser renders the page, then
   Haiku extracts performances, then you approve in Telegram. Set up once:

   ```bash
   npm install -D playwright
   npx playwright install chromium
   ```

   Then fill each house's what's-on URL in `RENDER_SOURCES` and run the ingest.
   **Guardrail:** the browser only reads public pages a visitor can open; it
   never solves CAPTCHAs or defeats an active challenge. A house that challenges
   is left for Tier C (partnership), not bypassed.

**Run the ingest (from your own machine — residential IP + your keys):**

```bash
npm run ingest -- --all --live          # fetch → extract → write pending → Telegram
npm run ingest -- --source royal-ballet --live   # one house
```

## What to find for each source

| Column | What to put | Why it matters |
|---|---|---|
| **Listing URL** | The exact page that lists the *season / what's-on*, not the homepage. e.g. `…/season`, `…/whats-on`, `…/calendar`. | This is the page the scraper fetches. |
| **Feed** | Best machine-readable source, in priority order: `API` ▸ `iCal` ▸ `RSS` ▸ `JSON-in-page` ▸ `HTML`. Put the feed URL if one exists. | A real feed is 10× more robust than scraping HTML. Always prefer it. |
| **Affiliate** | Ticketing/affiliate options: does the house sell direct? Is it on a network we can join (e.g. Tiqets, GetYourGuide, See Tickets, Booking.com for the trip)? | This is how a listing earns revenue. |
| **robots/ToS** | `OK` / `restricted` / `forbidden` — does `…/robots.txt` and the Terms allow automated access to the listing page? | Legal/ethical gate. If forbidden, we use the official feed or skip. |

Rating the **Feed** honestly is the single highest-leverage thing you can do:
one `iCal` link saves days of brittle scraper maintenance.

---

## Tier 1 — already in the catalogue (seed data; verify & enrich)

These 25 houses already have curated (placeholder) data. Confirm the listing URL
and feed so we can replace the seed with live data first.

| Company | City, Country | Type | Homepage | Listing URL | Feed | Affiliate |
|---|---|---|---|---|---|---|
| The Royal Ballet | London, United Kingdom | ballet | https://www.rbo.org.uk | _TODO_ | _TODO_ | _TODO_ |
| The Royal Opera | London, United Kingdom | opera | https://www.rbo.org.uk | _TODO_ | _TODO_ | _TODO_ |
| Paris Opera Ballet | Paris, France | ballet | https://www.operadeparis.fr | _TODO_ | _TODO_ | _TODO_ |
| Opéra national de Paris | Paris, France | opera | https://www.operadeparis.fr | _TODO_ | _TODO_ | _TODO_ |
| Bolshoi Ballet | Moscow, Russia | ballet | https://www.bolshoi.ru | _TODO_ | _TODO_ | _TODO_ |
| Mariinsky Ballet | Saint Petersburg, Russia | ballet | https://www.mariinsky.ru | _TODO_ | _TODO_ | _TODO_ |
| American Ballet Theatre | New York, United States | ballet | https://www.abt.org | _TODO_ | _TODO_ | _TODO_ |
| New York City Ballet | New York, United States | ballet | https://www.nycballet.com | _TODO_ | _TODO_ | _TODO_ |
| The Metropolitan Opera | New York, United States | opera | https://www.metopera.org | _TODO_ | _TODO_ | _TODO_ |
| Teatro alla Scala | Milan, Italy | both | https://www.teatroallascala.org | _TODO_ | _TODO_ | _TODO_ |
| Wiener Staatsoper | Vienna, Austria | opera | https://www.wiener-staatsoper.at | _TODO_ | _TODO_ | _TODO_ |
| Wiener Staatsballett | Vienna, Austria | ballet | https://www.wiener-staatsballett.at | _TODO_ | _TODO_ | _TODO_ |
| Bayerische Staatsoper | Munich, Germany | opera | https://www.staatsoper.de | _TODO_ | _TODO_ | _TODO_ |
| Stuttgart Ballet | Stuttgart, Germany | ballet | https://www.stuttgart-ballet.de | _TODO_ | _TODO_ | _TODO_ |
| Hamburg Ballett | Hamburg, Germany | ballet | https://www.hamburgballett.de | _TODO_ | _TODO_ | _TODO_ |
| The Royal Danish Ballet | Copenhagen, Denmark | ballet | https://kglteater.dk | _TODO_ | _TODO_ | _TODO_ |
| Dutch National Ballet | Amsterdam, Netherlands | ballet | https://www.operaballet.nl | _TODO_ | _TODO_ | _TODO_ |
| San Francisco Ballet | San Francisco, United States | ballet | https://www.sfballet.org | _TODO_ | _TODO_ | _TODO_ |
| The National Ballet of Canada | Toronto, Canada | ballet | https://national.ballet.ca | _TODO_ | _TODO_ | _TODO_ |
| The Australian Ballet | Melbourne, Australia | ballet | https://australianballet.com.au | _TODO_ | _TODO_ | _TODO_ |
| The Tokyo Ballet | Tokyo, Japan | ballet | https://www.thetokyoballet.com | _TODO_ | _TODO_ | _TODO_ |
| New National Theatre, Tokyo | Tokyo, Japan | opera | https://www.nntt.jac.go.jp | _TODO_ | _TODO_ | _TODO_ |
| Teatro Colón | Buenos Aires, Argentina | both | https://teatrocolon.org.ar | _TODO_ | _TODO_ | _TODO_ |
| Opera Australia | Sydney, Australia | opera | https://opera.org.au | _TODO_ | _TODO_ | _TODO_ |
| Bolshoi Opera | Moscow, Russia | opera | https://www.bolshoi.ru | _TODO_ | _TODO_ | _TODO_ |

## Tier 2 — high-priority additions (candidates to expand coverage)

Suggested next houses to widen the map. Add the URLs/feeds as you research them,
then move rows up to Tier 1 once they have an adapter.

| Company | City, Country | Type | Homepage | Listing URL | Feed | Affiliate |
|---|---|---|---|---|---|---|
| English National Ballet | London, United Kingdom | ballet | https://www.ballet.org.uk | _TODO_ | _TODO_ | _TODO_ |
| Birmingham Royal Ballet | Birmingham, United Kingdom | ballet | https://www.brb.org.uk | _TODO_ | _TODO_ | _TODO_ |
| Berlin State Ballet (Staatsballett Berlin) | Berlin, Germany | ballet | https://www.staatsballett-berlin.de | _TODO_ | _TODO_ | _TODO_ |
| Deutsche Oper Berlin | Berlin, Germany | opera | https://www.deutscheoperberlin.de | _TODO_ | _TODO_ | _TODO_ |
| Mikhailovsky Theatre | Saint Petersburg, Russia | both | https://mikhailovsky.ru | _TODO_ | _TODO_ | _TODO_ |
| Boston Ballet | Boston, United States | ballet | https://www.bostonballet.org | _TODO_ | _TODO_ | _TODO_ |
| Houston Ballet | Houston, United States | ballet | https://www.houstonballet.org | _TODO_ | _TODO_ | _TODO_ |
| Pacific Northwest Ballet | Seattle, United States | ballet | https://www.pnb.org | _TODO_ | _TODO_ | _TODO_ |
| Joffrey Ballet | Chicago, United States | ballet | https://www.joffrey.org | _TODO_ | _TODO_ | _TODO_ |
| Lyric Opera of Chicago | Chicago, United States | opera | https://www.lyricopera.org | _TODO_ | _TODO_ | _TODO_ |
| Royal Swedish Ballet | Stockholm, Sweden | ballet | https://www.operan.se | _TODO_ | _TODO_ | _TODO_ |
| Finnish National Ballet | Helsinki, Finland | ballet | https://oopperabaletti.fi | _TODO_ | _TODO_ | _TODO_ |
| Hong Kong Ballet | Hong Kong, China | ballet | https://www.hkballet.com | _TODO_ | _TODO_ | _TODO_ |
| National Ballet of China | Beijing, China | ballet | http://www.nbc.org.cn | _TODO_ | _TODO_ | _TODO_ |
| Korean National Ballet | Seoul, South Korea | ballet | https://www.knballet.org | _TODO_ | _TODO_ | _TODO_ |
| Teatro Real | Madrid, Spain | opera | https://www.teatroreal.es | _TODO_ | _TODO_ | _TODO_ |
| Gran Teatre del Liceu | Barcelona, Spain | opera | https://www.liceubarcelona.cat | _TODO_ | _TODO_ | _TODO_ |
| La Monnaie / De Munt | Brussels, Belgium | opera | https://www.lamonnaiedemunt.be | _TODO_ | _TODO_ | _TODO_ |
| Hungarian State Opera | Budapest, Hungary | both | https://www.opera.hu | _TODO_ | _TODO_ | _TODO_ |
| Bavarian State Ballet | Munich, Germany | ballet | https://www.staatsballett.de | _TODO_ | _TODO_ | _TODO_ |

---

## How a filled row becomes live data

1. You fill a row (listing URL + feed + affiliate + robots).
2. An adapter is written under `scripts/scrapers/adapters/<slug>.ts` (the
   existing ones — `royal-ballet`, `paris-opera-ballet`, `wiener-staatsoper` —
   are the templates). For sites with a feed, the adapter parses the feed; for
   HTML-only sites it uses the LLM-extraction path (see `docs/INGESTION_SETUP.md`).
3. The scheduled job fetches → extracts → normalizes (`scripts/scrapers/
   normalize.ts`) → resolves entities (people/works) → writes to a **review
   queue** (`review_status = 'pending'`) in Supabase.
4. You approve in the review step; approved rows flip to `published` and appear
   on the site within minutes.

## Affiliate networks to apply to (revenue side)

While researching sources, apply to these so listings can earn:

- **Tiqets** / **GetYourGuide** — tours & cultural tickets (best fit; high CVR).
- **Booking.com** / **Expedia** — hotels near the venue (deep-link by lat/lng).
- **See Tickets** / national ticketing affiliates where houses use resellers.
- Travel/flight networks (e.g. **WayAway**/Aviasales) for the "performance trip".

Put your affiliate IDs in environment variables (never commit them); the
ingestion job stamps `affiliate_url` per performance.
