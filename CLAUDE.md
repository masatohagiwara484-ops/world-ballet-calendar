# première — World Ballet & Opera Calendar

## 0. Owner priority / オーナー優先原則（最重要）

**The owner's explicit instructions in the conversation ALWAYS override this file.**
CLAUDE.md is the default when no instruction is given — never a reason to slow down
or reinterpret what the owner asked for.
**オーナーの明示的な指示は常に本ファイルに優先する。** CLAUDE.md は指示がないときの
デフォルトに過ぎない。

## 1. What this is / プロダクト定義

**première** is where a balletomane discovers a performance *and books the trip
around it* — a curated travel product for the world's greatest ballet & opera
houses. Not an Operabase coverage clone: we win on ~30–80 houses with perfect
accuracy, design, trust, and travel — never on raw volume.
カレンダーではなく **「発見 → 旅程 → 予約」を最も美しく信頼できる形で繋ぐ旅行プロダクト**。
量では戦わず、厳選＋深さで勝つ。

- **Tagline:** *The world's great stages — worth the journey.*
- **Live:** https://worldballetoperacalender.vercel.app
- **Plan:** `docs/ROADMAP.md` is the single execution plan. Daily records: `reports/day-XX-report.md`.

## 2. Brand Charter — première / ブランド憲章

Four moats / 4つの堀: **Curation · Trust · Travel · Design.**

Quality is defined by our own standards, not by reference to other brands
（品質基準は自前の行動基準で定義する。他社ブランド名の借用はしない）:

1. **Never a wrong date.** Provenance is visible (`last_verified`/`source_url` →
   VerifiedDates badge). Empty state > wrong date. Fabricated data: never.
2. **Every surface feels like a printed season brochure.** 全UIは上質な季刊
   パンフレットの質感 — White Gradient Luxury: base `#FAFAF8`/`#FFFFFF`/`#FAF8F5`,
   gradient `linear-gradient(135deg,#FFFFFF 0%,#F5F0EA 100%)`, gold `#D4AF37`,
   jewel accents navy `#1B2A4A` / forest `#1A3A2E` / purple `#2D1B4E`,
   Playfair Display + Inter. (Tokens: `docs/DESIGN_SYSTEM.md`.)
3. **Motion has purpose.** GSAP 0.8s+, purposeful depth — animation supports the
   function, never decorates it. `prefers-reduced-motion` always respected.
4. **Editorial voice, not aggregator voice.** Confident, restrained, a curator.
   Never over-promise scale while the catalogue is curated. No dead "Coming Soon"
   pages in public nav.

## 3. Tech stack & commands

Next.js 14 (App Router) · TypeScript · Tailwind · Supabase (PostgreSQL) ·
Leaflet/Google Maps · GSAP · Vercel (push → auto deploy).

```bash
npm run dev / build / lint            # develop · verify production build
npm run seed                          # load curated companies/performances
npm run ingest -- --all --live        # crawl → write pending + Telegram digest
npm run ingest:local -- --source <slug>  # extract from browser-saved HTML (no 403)
npm run ingest:selftest               # diff-engine self-check
npm run review:pending [-- --publish] # terminal review queue
```

Ingestion ops runbook: `docs/INGESTION_SETUP.md`. The `review_status` gate is
absolute: nothing publishes without owner approval (Telegram or `--publish`).

## 4. Environment variables

| Var | Where |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | GitHub Secrets + Vercel (server) + `.env.local` — never client-side |
| `ANTHROPIC_API_KEY` | GitHub Secrets + `.env.local` (Haiku extraction) |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` / `TELEGRAM_WEBHOOK_SECRET` | approval flow |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | optional — Google Maps for venue maps, else Leaflet |

## 5. Agents / エージェント

Roster = the five definitions in `.claude/agents/` (contract-driven: mission,
file boundaries, frozen contracts, definition of done):
`backend_engineer` · `frontend_engineer` · `design_director` · `code_reviewer` · `sre_devops`.

- **Model: do not pin.** Agents inherit the session model — always the best
  available. モデルは明示指定しない（セッション継承＝常に最高性能）。
- Non-trivial changes get a `code_reviewer` pass before shipping; UI changes are
  visually verified (`verifier-web` skill) — "compiles" is not "renders".

## 6. Immutable rules / 不変ルール

1. **Trust:** no fabricated data, ever; the approval gate stays between crawl and site.
2. **Day Reports** (`reports/day-XX-report.md`) are bilingual — English first, then 日本語.
3. **`docs/ROADMAP.md` is the only plan.** Update it when priorities change; don't
   spawn parallel plan documents.
