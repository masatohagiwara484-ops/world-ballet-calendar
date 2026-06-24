# Day 14 Report — Real-Data Surfacing, Google Maps & The Journal (#9)

> Bilingual report (English first, then 日本語) — per the immutable Day Report rule.

---

## 1. Goal / ゴール

**EN:** Act on owner feedback: (1) make the verified badge (#1) and curated rail
(#6) actually show against the real performance data already in Supabase, (2)
move the map to Google Maps (more universally usable) with company 📍 pins, and
(3) ship #9 — the editorial long-tail SEO layer (The Journal).

**JA:** オーナーのフィードバックに対応：(1) Supabase 上の実公演データで検証バッジ(#1)・
キュレーションレール(#6)を実際に表示、(2) 地図を Google Maps（より汎用的）に置換し
カンパニーを📍表示、(3) #9 編集ロングテールSEO（The Journal）を実装。

---

## 2. Shipped / 成果

**EN:**
- **#1/#6 surface on real data.** The rail now falls back to the soonest upcoming
  runs (one per company) when nothing is flagged `is_featured`, so it shows
  whenever performance data exists. The verified badge now renders on
  `last_verified` (full "dates confirmed" claim) OR `source_url` (precise "listing
  from the official source" link — no overclaim).
- **Google Maps with Leaflet fallback.** New `GoogleVenueMap`
  (@vis.gl/react-google-maps): gold 📍 pins for every house, InfoWindow → house
  page, geolocation "Near me", dark scheme. `VenueMapLoader` uses Google when
  `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set, else the key-less Leaflet/CARTO map.
- **#9 The Journal.** `/journal` + `/journal/[slug]`: 5 evergreen articles
  (travel guides, work explainers, company stories), per-article SEO + Article
  JSON-LD + sitemap, related-house cross-links, and trip/newsletter CTAs.
  Drafted via parallel subagents, integrated and verified.

**JA:**
- **#1/#6 を実データで表示。** レールは `is_featured` が無ければ「今季の upcoming を
  団体ごとに1件」へフォールバックし、データがあれば必ず表示。バッジは `last_verified`
  （完全な「日付確認済み」表示）または `source_url`（正確な「公式ソースの掲載」リンク、
  過剰主張なし）で表示。
- **Google Maps ＋ Leaflet フォールバック。** `GoogleVenueMap` を新設（金の📍ピン、
  InfoWindow→ハウス、Near me、ダーク）。キー設定時は Google、未設定なら Leaflet。
- **#9 The Journal。** `/journal` と記事ページ。常緑5記事、記事ごとSEO＋JSON-LD＋
  sitemap、関連ハウスリンク、旅行/ニュースレターCTA。並列サブエージェントで起稿し統合。

---

## 3. Verification / 検証
**EN:** `npm run build` passes (types + lint) throughout. Journal generates 5
static article pages. Components verified via compiled-CSS Playwright snapshots
(prose, quote, list, related pills render on-brand). Caveats: the Google map needs
a key + networked browser (renders on the deployed site, or Leaflet without a
key); #1/#6 are verified by logic + build, to be confirmed by the owner on
production where the real Supabase data lives.

**JA:** 期間中 `npm run build` 成功（型・Lint）。Journal は5記事を静的生成。コンパイル
済みCSS＋Playwright で描画確認（本文・引用・リスト・関連ピル）。注記：Google 地図は
キー＋ネットワークのあるブラウザが必要（本番で表示、キー無しは Leaflet）。#1/#6 は
ロジック＋ビルドで検証済み、実データのある本番でオーナー確認をお願いします。

---

## 4. Owner actions / オーナー対応事項
**EN:**
1. **(Optional) Google Maps key** — add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to
   Vercel + `.env.local` to switch the map from Leaflet to Google Maps. Steps:
   Google Cloud → enable "Maps JavaScript API" → create an API key → restrict it
   to your domains → paste it in. Until then the Leaflet map works for free.
2. **Confirm #1/#6 on production** — open a performance page (badge) and the home
   page (rail) on the live site to confirm they now show with the real data.

**JA:**
1. **（任意）Google Maps キー** — `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` を Vercel と
   `.env.local` に追加すると地図が Google Maps に切替。手順：Google Cloud →「Maps
   JavaScript API」有効化 → APIキー発行 → ドメイン制限 → 貼り付け。未設定でも
   Leaflet 地図が無料で動作。
2. **本番で #1/#6 を確認** — 公演ページ（バッジ）とホーム（レール）を開き、実データで
   表示されることをご確認ください。

---

## 5. Next / 次
**EN:** #10 — auto-generated "this week's performances" social cards (our unique
visual distribution edge). Then bigger bets per `docs/ROADMAP.md`:
performance-trip bundle, premium tier, data-model flip.

**JA:** #10 — 「今週の公演」SNS用カードの自動生成（唯一のビジュアル流通エッジ）。
その後は `docs/ROADMAP.md` の大きな賭け（トリップ・バンドル、プレミアム、データモデル
反転）。
