# `.local/` — operator-saved HTML for the `--local` ingestion path

Drop here the **what's-on / season pages you saved from your own browser**.
This is the "前回同様 / html経由" workflow: because *your* logged-in, residential
browser fetched the page, there is no datacenter-IP `403` wall (ROADMAP #12), and
the page is fully JavaScript-rendered. The ingest then runs the normal pipeline
(extract → normalize → resolve → diff → **pending** → Telegram approval).

## How to use

1. Open a house's listing URL in Chrome/Safari (see the slug → URL table below).
2. **File → Save As → "Page Source"** (Safari) or **"Webpage, HTML Only"** (Chrome).
3. Name the file exactly `<company-slug>.html` (e.g. `tokyo-ballet.html`) and save
   it into this folder.
4. From the repo root:
   ```bash
   npm run ingest:local -- --source tokyo-ballet   # one house
   npm run ingest:local -- --all                   # every house you've saved
   ```
5. Approve the rows in Telegram. They publish to the live site within minutes.

Accepted file names: `<slug>.html`, `<slug>.htm`, `<slug>.txt`.

Raw saved pages are **git-ignored** (only this README is tracked) — never commit
scraped HTML.

## Slugs (run `npm run ingest:local -- --all` to see the full list)

The slug is the company slug — `tokyo-ballet`, `new-national-theatre-tokyo`,
`royal-ballet`, `paris-opera-ballet`, `wiener-staatsoper`, `teatro-alla-scala`, …
Running any `--local` command with a missing file prints that house's exact URL
and the filename to save it as.
