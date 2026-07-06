<div align="center">

# première

### *The world's great stages — worth the journey.*

**Discover a performance. Plan the journey. Book the trip.**

🌐 **Live:** [worldballetoperacalender.vercel.app](https://worldballetoperacalender.vercel.app)

</div>

---

## What it is

**première** is a curated travel product for the world's greatest ballet & opera
houses. It is where a balletomane discovers a performance *and books the trip
around it* — season calendar, venue maps, verified dates, and trip planning in
one editorial, season-brochure-grade interface.

We are deliberately **not** a coverage aggregator. We win on a curated set of
the world's great houses with perfect accuracy, visible provenance, travel
integration, and design — never on raw volume.

**The four moats:** Curation · Trust · Travel · Design

## Architecture & repo map

```
src/
  app/          Next.js 14 App Router — routes (calendar, companies, cities,
                performances, works, people, map, journal, this-week, partners),
                API routes, OG image routes, sitemap/robots
  components/   UI — hero globe, Lucid Glass season calendar, curated rail,
                venue maps, share cards, newsletter capture
  lib/          Core logic — data.ts (Supabase → bundled-dataset fallback),
                types, search, entity graph, OG renderer, telegram, affiliate
  data/         Curated bundled dataset (the "never empty" floor)
scripts/
  ingest/       Ingestion pipeline — fetch/render → extract (feed-first, else
                Haiku) → normalize → resolve → diff → pending + Telegram digest
  seed.ts       Seed Supabase with the curated dataset
supabase/       SQL migrations (schema, entity graph, ingestion tables)
docs/           Current operational docs (see docs/README.md index)
reports/        Daily work records — day-XX-report.md (bilingual EN/JA)
.claude/        Agent definitions & skills (contract-driven, see CLAUDE.md §5)
```

## Data pipeline & trust

```
crawl / operator-saved HTML (--local)
   → extract → normalize → resolve → diff
   → review_status = 'pending'            ← nothing publishes automatically
   → owner approves (Telegram tap / CLI)
   → published + last_verified stamp → site revalidates
```

**Trust policy (absolute):** no fabricated data, ever. An empty state beats a
wrong date. Every published row carries visible provenance (`last_verified`,
`source_url` → the VerifiedDates badge). Operator runbook:
[`docs/INGESTION_SETUP.md`](./docs/INGESTION_SETUP.md).

## Tech stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (PostgreSQL) ·
Leaflet / Google Maps · GSAP · next/og · Vercel

## Getting started

```bash
npm install
cp .env.example .env.local   # or create .env.local — see the table below
npm run dev                  # http://localhost:3000
```

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase (public) — optional; the bundled dataset renders without it |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only writes (seed, ingest, approval webhook) |
| `ANTHROPIC_API_KEY` | LLM extraction in the ingest pipeline |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` / `TELEGRAM_WEBHOOK_SECRET` | Approval flow |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Optional — venue maps upgrade from Leaflet to Google Maps |

Common commands: `npm run build` · `npm run seed` ·
`npm run ingest -- --all --live` · `npm run ingest:local -- --source <slug>` ·
`npm run review:pending`

## Documentation

| Doc | Content |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | Constitution: owner priority, Brand Charter, agents, immutable rules |
| [`docs/ROADMAP.md`](./docs/ROADMAP.md) | **The single execution plan** — backlog, status, priorities |
| [`docs/README.md`](./docs/README.md) | Index of all current operational docs |
| [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md) | White Gradient Luxury tokens, typography, motion |

---

<div align="center">

# première（日本語）

### *The world's great stages — worth the journey.*

**公演と出会い、旅程を組み、旅を予約する。**

</div>

## これは何か

**première** は、世界最高峰のバレエ・オペラハウスに特化したキュレーション型の
トラベルプロダクトです。バレエファンが公演を発見し、**その公演を中心に旅を予約する**
場所 — シーズンカレンダー、劇場マップ、検証済み日付、旅行プランを、季刊パンフレット
品質のエディトリアルな UI に統合しています。

網羅型アグリゲーターでは**ありません**。厳選された世界最高の劇場群 × 完璧な正確さ ×
可視化された出典 × 旅行統合 × デザインで勝負します。量では戦いません。

**4つの堀:** Curation（キュレーション） · Trust（信頼） · Travel（旅行） · Design（デザイン）

## データパイプラインと信頼

```
クロール / オペレーター保存HTML (--local)
   → 抽出 → 正規化 → 名寄せ → 差分
   → review_status = 'pending'      ← 自動公開は一切なし
   → オーナー承認（Telegramタップ / CLI）
   → published + last_verified 付与 → サイト再検証
```

**信頼ポリシー（絶対）:** データの捏造は決して行わない。誤った日付を出すくらいなら
空欄を出す。公開行はすべて出典を可視化（`last_verified` / `source_url` →
VerifiedDates バッジ）。運用手順は [`docs/INGESTION_SETUP.md`](./docs/INGESTION_SETUP.md)
（日本語版: [`docs/INGESTION_SETUP_JA.md`](./docs/INGESTION_SETUP_JA.md)）。

## はじめかた

上記英語セクションの手順・環境変数表と同一です。`npm install` → `.env.local` 作成 →
`npm run dev`。Supabase 未設定でも同梱データセットでサイトは完全に描画されます。

## ドキュメント

- [`CLAUDE.md`](./CLAUDE.md) — 憲法（オーナー優先原則・ブランド憲章・エージェント・不変ルール）
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — **唯一の実行計画**
- [`docs/README.md`](./docs/README.md) — 現行運用ドキュメントの索引
- 日次記録は `reports/day-XX-report.md`（日英併記）
