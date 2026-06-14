# Day 10 Report — White Gradient Luxury Renewal + Cross-Cutting Search

**Date:** 2026-06-14 · **Branch:** `claude/eloquent-sagan-n2q7vy`
**Live target:** https://worldballetoperacalender.vercel.app

---

## EN — Executive summary

The keyword-search foundation built in a prior session lived on an unmerged
branch (`claude/modest-fermat-4jv93k`) and was never present on `main`. This
session brought that foundation in, then executed the owner's renewal goals on
top of it:

1. **Theme rebrand → "White Gradient Luxury."** Migrated the entire site from
   the dark "Champagne Noir" palette to a bright, gallery-lit warm-white system
   while keeping the luxury feel and improving readability.
2. **Unified typography for brand identity.** All headlines now use
   **Cormorant Garamond** (couture serif); all body/UI uses **Manrope** (refined
   sans). One type system, site-wide.
3. **Keyword search ("one word → every performance on Earth").** The
   cross-cutting, entity-graph search is live and render-verified: a search-first
   homepage hero, faceted `/search`, autocomplete, and result cards.
4. **Large-scale UI/UX renewal.** Company directory and magazine-style company
   profiles rebuilt; calendar, performance detail, navbar, footer, and all
   states re-themed.
5. **SEO entity pages (the moat).** New server-rendered `/works/[slug]` and
   `/people/[slug]` pages (58 works + 86 people prerendered) with JSON-LD and
   sitemap entries — "every company's Swan Lake worldwide" and an artist's whole
   catalogue.
6. **Credibility fix.** The fictional partners (e.g. SkyTeam, Maison Stay) were
   removed; the partners page is now an honest, forward-looking "performance
   trip" vision.

### How it was built (methodology)
- **Working Backwards** from "what the user sees": a bright, readable, search-first
  luxury site.
- **Opus** built the load-bearing design-system foundation (light tokens, glass
  classes, fonts) as a *frozen contract*; **four Sonnet sub-agents** ran in
  parallel on non-overlapping file sets (Home+Search · Companies/Calendar ·
  Shell/Partners · SEO entity pages).
- **Smart token remap** (`stage`→white surfaces, `ivory`→dark ink) flipped most
  components to light automatically, minimizing churn.
- **Verified renders, not just builds** — `verifier-web` screenshots on desktop
  and mobile confirmed real content (not a blank hero).

### Verification
- `npm run build`: green — **180/180** pages.
- Routes returning 200: `/`, `/search?q=swan lake`, `/companies`,
  `/companies/royal-ballet`, `/works/swan-lake`, `/people/marius-petipa`,
  `/calendar`, `/partners`.
- Screenshots confirmed: search-first hero, cross-cutting Swan Lake results with
  working autocomplete + credit links, company directory, the `/works` moat page,
  and a clean mobile layout (no horizontal overflow).

### Risks / notes
- Data is still the curated seed dataset; real ingestion (the `data-ingest`
  skill, `docs/SOURCES.md`) remains a future step.
- The orphaned globe components remain in the repo but are no longer rendered by
  any page; they can be removed in a cleanup pass.
- Rebrand to a new project name is deferred per the owner's choice ("decide
  later").

### Next steps
1. Populate Supabase entity tables from the built graph; optionally switch search
   to the RPC (keep in-memory fallback).
2. Email capture + on-sale alerts (Pillar A).
3. PWA (installable + web push).
4. Real data ingestion via the `data-ingest` skill.

---

## 日本語 — 要約

前セッションで構築されたキーワード検索基盤は未マージのブランチ
(`claude/modest-fermat-4jv93k`) にのみ存在し、`main` には入っていませんでした。
本セッションではまずその基盤を取り込み、その上にオーナーの刷新目標を実装しました。

1. **テーマ刷新 →「White Gradient Luxury」。** サイト全体をダークな
   「Champagne Noir」から、明るくギャラリーのような暖かい白基調へ移行。高級感を
   維持しつつ視認性を向上。
2. **ブランド統一のためのフォント統一。** 見出しは **Cormorant Garamond**
   (クチュール調セリフ)、本文/UI は **Manrope**(上質サンセリフ)に全ページ統一。
3. **キーワード検索(「一語 → 世界中の公演」)。** エンティティグラフによる横断検索
   が稼働・描画確認済み。検索ファーストのトップヒーロー、ファセット付き `/search`、
   オートコンプリート、検索結果カード。
4. **大規模 UI/UX リニューアル。** カンパニー一覧と雑誌風カンパニー詳細を再構築。
   カレンダー・公演詳細・ナビ・フッター・各状態画面も再テーマ化。
5. **SEO エンティティページ(モート/堀)。** サーバーレンダリングの新規
   `/works/[slug]`・`/people/[slug]`(作品58・人物86を事前生成)。JSON-LD と
   サイトマップ対応。「世界中の白鳥の湖」やアーティストの全カタログを実現。
6. **信頼性の修正。** 架空のパートナー(SkyTeam, Maison Stay 等)を削除し、
   パートナーページを誠実で前向きな「公演トリップ」構想に刷新。

### 進め方(方法論)
- ユーザー体験から逆算する **Working Backwards**:明るく読みやすい検索ファーストの
  高級サイト。
- **Opus** が土台(ライトトークン、ガラスクラス、フォント)を*凍結された契約*として
  構築し、**4体の Sonnet サブエージェント**が重複しないファイル群で並列実装。
- **トークンの賢い再マッピング**(`stage`→白面、`ivory`→濃いインク)で大半の
  コンポーネントを自動的にライト化し、変更量を最小化。
- **ビルドだけでなく描画を検証** — `verifier-web` で PC/モバイルのスクリーンショットを
  確認し、実コンテンツの表示を担保。

### 検証
- `npm run build`:成功 — **180/180** ページ。
- 200 を返すルート:`/`, `/search?q=swan lake`, `/companies`,
  `/companies/royal-ballet`, `/works/swan-lake`, `/people/marius-petipa`,
  `/calendar`, `/partners`。
- スクリーンショット確認:検索ファーストヒーロー、横断的な白鳥の湖の検索結果
  (オートコンプリート+クレジットリンク動作)、カンパニー一覧、`/works` モートページ、
  モバイルの崩れなし。

### リスク / 備考
- データは現状キュレーション済みシードのまま。実データ取り込み(`data-ingest`
  スキル、`docs/SOURCES.md`)は今後の工程。
- 孤立した地球儀(globe)コンポーネントは残存するがどのページからも描画されない。
  クリーンアップで削除可能。
- プロジェクト名のリブランドはオーナーの選択により保留(「後で決める」)。

### 次のステップ
1. 構築済みグラフから Supabase エンティティテーブルへ投入。検索を RPC に切替も可能
   (メモリ内フォールバックは維持)。
2. メール取得 + チケット発売アラート(Pillar A)。
3. PWA(インストール可能 + Web プッシュ)。
4. `data-ingest` スキルによる実データ取り込み。
