# Day 11 Report — Autonomous Ingestion + Telegram Human-in-the-Loop

## 1. Working Backwards goal / 目標（最終ユーザー体験）

**EN:** The site's promise — "every stage on earth, searchable from one word" —
is only credible with real, current data, and a wrong date is worse than a
missing one. The end state: real performances are scraped every 2 days, the
owner approves changes with one Telegram tap, and approved rows appear in live
search within minutes — while nothing reaches the public without approval.

**JA:** 本サイトの約束「世界中のあらゆる舞台を、一語から検索」は、実在し最新の
データがあって初めて成立し、間違った日付は欠落より悪い。最終状態は、2日に1回
実在公演を取り込み、オーナーが Telegram のワンタップで承認し、承認行が数分で
ライブ検索に反映される一方、承認なしには一切公開されないこと。

## 2. Completed outcomes / 完了した主要成果

**EN**
- [x] **P1 Live data** — `data.ts` filters `review_status='published'`; new
  `buildGraphAsync` feeds search/entity pages from Supabase (silent static
  fallback kept); `searchAsync`/`suggestAsync` wired into `/api/search`,
  `/api/suggest`, works & people pages; `dynamicParams` added to companies.
- [x] **P2 Diff + pending** — migration `004_ingestion.sql`; `scripts/ingest/`
  differ (new / date-changed / price-changed / unchanged / cancelled), resolver
  (reuses `buildGraph` as the single entity write path), state store; the crawl
  writes `pending` only.
- [x] **P3 Telegram** — `/api/telegram/webhook` (secret-token verified) flips
  pending→published, stamps `last_verified`, and on-demand revalidates the
  touched pages; one digest per company per run.
- [x] **P4 Extraction** — feed-first (iCal/RSS/JSON-LD, no model) + Haiku
  `messages.parse` for HTML-only sources, page-hash cost gate.
- [x] **P5 Scale** — earned auto-approve (3 clean approvals; date/cancel always
  manual), run-summary Telegram report, every-2-days scheduler.

**JA**
- [x] **P1 ライブデータ** — `data.ts` が `published` のみ抽出。`buildGraphAsync`
  が検索/エンティティページを Supabase 給電化（静的フォールバック維持）。
  `searchAsync`/`suggestAsync` を各呼び出し箇所へ。companies に `dynamicParams`。
- [x] **P2 差分＋pending** — マイグレーション `004`、`scripts/ingest/`（差分・
  リゾルバ＝`buildGraph` を唯一の書込経路として再利用・状態ストア）。取り込みは
  `pending` のみ書込。
- [x] **P3 Telegram** — webhook（シークレット検証）で pending→published、
  `last_verified` 打刻、該当ページを再生成。1ラン×1カンパニーに1ダイジェスト。
- [x] **P4 抽出** — フィード優先（モデル不使用）＋HTML のみ Haiku 抽出、
  ページハッシュのコストゲート。
- [x] **P5 拡大** — 獲得型自動承認（3回連続クリーン承認、日付/キャンセルは常に
  手動）、ラン要約 Telegram、2日に1回の cron。

## 3. Three defects fixed / 修正した3つの欠陥

**EN:** (1) the crawl auto-published because `review_status` defaults to
`published` — now writes `pending`; (2) `getPerformances` leaked pending rows —
now filters published; (3) `buildGraph()` defaulted to the static dataset so
approved rows never reached search — `buildGraphAsync` now feeds it from Supabase.

**JA:** (1) `review_status` の既定が `published` で自動公開されていた→`pending`
書込に修正。(2) `getPerformances` が pending を露出→published フィルタ追加。
(3) `buildGraph()` が静的データを既定使用し承認行が検索に届かなかった→
`buildGraphAsync` で Supabase 給電。

## 4. Verification / 検証

**EN:** `tsc` clean; production build generates 180 pages incl. the dynamic
webhook route; `npm run ingest:selftest` classifies all four change kinds;
`npm run ingest -- --all --fixture` runs the full pipeline offline; iCal/RSS/
JSON-LD extractors verified on synthetic inputs.

**JA:** `tsc` クリーン。本番ビルドは webhook（動的）含む180ページを生成。
`ingest:selftest` が4種の変更を分類。`ingest --all --fixture` がオフラインで
全工程を実行。iCal/RSS/JSON-LD 抽出を合成入力で検証。

## 5. Risks & mitigations / リスクと緩和

**EN:** legality → feed-first + robots/ToS gate + bot UA; mis-extraction →
review gate + zod + confidence threshold (LLM=0.85, below auto-approve);
cost → hash/etag cache + Haiku only + budget alert; key exposure → service role
only in Actions + server route, webhook authenticated by Telegram secret token.

**JA:** 適法性→フィード優先＋robots/ToS ゲート＋ボット UA。誤抽出→レビュー
ゲート＋zod＋信頼度しきい値（LLM=0.85、自動承認未満）。コスト→ハッシュ/etag
キャッシュ＋Haiku のみ＋予算アラート。鍵露出→サービスロールは Actions と
サーバルートのみ、webhook は Telegram シークレットで認証。

## 6. Next steps (owner) / 次のステップ（オーナー作業）

**EN:** Follow `docs/INGESTION_SETUP.md` — create the new Supabase project and
run `002→003→004`; set env vars (incl. service-role in GitHub Secrets);
`npm run seed` + `validate:data`; create the Telegram bot and call `setWebhook`;
obtain `ANTHROPIC_API_KEY` with a budget alert; fill 10–15 source rows in
`docs/SOURCES.md` (check robots/ToS) and register them in `run-ingest.ts`.

**JA:** `docs/INGESTION_SETUP.md` に従う。新規 Supabase 作成と `002→003→004`
実行、環境変数設定（サービスロールは GitHub Secrets）、`npm run seed` +
`validate:data`、Telegram ボット作成と `setWebhook`、`ANTHROPIC_API_KEY`（予算
アラート付）、`docs/SOURCES.md` に10〜15館を記入（robots/ToS 確認）して
`run-ingest.ts` に登録。
