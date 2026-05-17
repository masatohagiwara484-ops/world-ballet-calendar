# Day 8 Report — Globe Integration + Brand + Conversion + SEO
# Day 8 レポート — 地球儀連携 + ブランド + コンバージョン + SEO

**Date / 日付:** 2026-05-17
**Status / ステータス:** ✅ COMPLETE / 完了
**Branch / ブランチ:** `claude/check-ballet-calendar-progress-diGRr` → `main`
**DRI:** Frontend Engineer ×2 (Opus 4.7, parallel)

---

## 1. Working Backwards Goal / ゴール

**EN:** When Day 8 completes, the user gets a globe that reacts to calendar
filters, a fully branded company experience, an Affiliate Partners page that
builds trust, conversion-optimized ticket CTAs, and machine-readable SEO data.

**JP:** Day 8 完了時点でユーザーが得るもの — カレンダーフィルターに反応する
地球儀、完全にブランディングされた company 体験、信頼を構築する Affiliate
Partners ページ、コンバージョン最適化されたチケット CTA、機械可読な SEO データ。

---

## 2. Implemented / 実装内容

### Globe ↔ Calendar Integration / 地球儀↔カレンダー連携

**EN:**
- Country selection in CalendarSidebar flies the hero globe camera to that
  country's companies (GSAP 1.5s, `power2.inOut` — ballet-flow easing).
- Date selection highlights matching company markers with scale-up + emissive
  pulse glow.
- Globe is now drag-rotatable (OrbitControls); auto-rotation pauses while
  dragging and resumes ~2.5s after release.
- Globe sphere recolored navy `#1B2A4A`; hover tooltip migrated to white.

**JP:**
- CalendarSidebar の国選択で、ヒーローの地球儀カメラがその国の company へ
  フライ（GSAP 1.5秒、`power2.inOut` — バレエの流れを表現するイージング）。
- 日付選択で該当 company マーカーが拡大 + emissive パルスで発光。
- 地球儀がドラッグ回転可能に（OrbitControls）。ドラッグ中は自動回転が停止し、
  指を離して約2.5秒後に再開。
- 地球儀の球体をネイビー `#1B2A4A` に変更。ホバーツールチップを白基調へ移行。

### Brand & Storytelling / ブランド & ストーリーテリング

**EN:**
- `companies/[slug]` page fully migrated from dark theme to White Gradient
  Luxury (this file was missed in the Day 6 migration).
- Company hero now uses `hero_image` as a background with a white gradient
  overlay for legibility; falls back to a text hero.
- Added a heritage label (`{2026 − founded_year}+ years of heritage`).
- `description` upgraded to a serif narrative block.

**JP:**
- `companies/[slug]` ページをダークテーマから White Gradient Luxury へ完全移行
  （このファイルは Day 6 の移行で漏れていた）。
- Company ヒーローが `hero_image` を背景に使用し、可読性のため白グラデーション
  オーバーレイを重ねる。画像がない場合はテキストヒーローへフォールバック。
- heritage ラベルを追加（`{2026 − founded_year}+ years of heritage`）。
- `description` をセリフ体のナラティブブロックへ格上げ。

### Affiliate Partners Page / アフィリエイトパートナーページ

**EN:**
- New static route `/partners` with White Gradient Luxury design.
- Ticketing Partners: Royal Opera House, Paris Opéra, Bolshoi Theatre,
  Metropolitan Opera. Travel Partners: SkyTeam Travel, Global Air Partners,
  Maison Stay Collection.
- Cards with serif monogram placeholders + rotating accent bars.
- Transparent affiliate disclosure block (honest commission statement).
- "Partners" link added to the Navbar.

**JP:**
- 新規静的ルート `/partners` を White Gradient Luxury デザインで作成。
- Ticketing Partners: Royal Opera House、Paris Opéra、Bolshoi Theatre、
  Metropolitan Opera。Travel Partners: SkyTeam Travel、Global Air Partners、
  Maison Stay Collection。
- セリフ体モノグラムのプレースホルダ + 色ローテーションのアクセントバー付き
  カード。
- 透明性あるアフィリエイト開示ブロック（正直なコミッション表記）。
- Navbar に "Partners" リンクを追加。

### Conversion / コンバージョン

**EN:**
- PerformanceModal ticket CTA is now a prominent gold-filled "Book Tickets"
  button (hover scale + shadow), full-width on mobile.
- Link prefers `affiliate_url`, falls back to `ticket_url`; `price_range`
  shown as a small label. PerformanceCard also prefers `affiliate_url`.

**JP:**
- PerformanceModal のチケット CTA を目立つゴールド塗りの "Book Tickets"
  ボタンに変更（ホバーで拡大 + シャドウ）。モバイルでは全幅表示。
- リンクは `affiliate_url` を優先し、`ticket_url` へフォールバック。
  `price_range` を小ラベルで表示。PerformanceCard も `affiliate_url` を優先。

### SEO Structured Data / SEO 構造化データ

**EN:**
- `companies/[slug]` injects JSON-LD: a `PerformingGroup` organization object
  plus an array of `TheaterEvent` objects (name, dates, `Place` location,
  performer, `Offer` with ticket URL + availability). Undefined fields omitted.

**JP:**
- `companies/[slug]` が JSON-LD を埋め込み — `PerformingGroup` 組織オブジェクト
  と `TheaterEvent` オブジェクトの配列（名称、日付、`Place` 会場、出演者、
  チケット URL + 在庫状況を持つ `Offer`）。未定義フィールドは省略。

---

## 3. Build Quality / ビルド品質

**EN:** Production build succeeds — 10/10 pages generated, 0 TypeScript errors.
`/partners` statically prerendered, `/companies/[slug]` SSG. Homepage First
Load JS 147 kB, shared 87.9 kB.

**JP:** 本番ビルド成功 — 10/10 ページ生成、TypeScript エラー 0。`/partners` は
静的プリレンダー、`/companies/[slug]` は SSG。トップページ First Load JS は
147 kB、共有チャンク 87.9 kB。

---

## 4. Files Changed / 変更ファイル

**Modified / 変更:**
- `src/components/map/GlobeView.tsx` — camera fly-to, marker highlight, drag, white tooltip
- `src/components/calendar/CalendarSidebar.tsx` — `onCountryChange` callback
- `src/components/hero/HeroSection.tsx` — forward `focusCountry` / `highlightedCompanyIds`
- `src/app/page.tsx` — globe ↔ calendar state wiring
- `src/app/companies/[slug]/page.tsx` — white migration + storytelling + JSON-LD
- `src/components/layout/Navbar.tsx` — Partners link
- `src/components/modals/PerformanceModal.tsx` — gold ticket CTA
- `src/components/performance/PerformanceCard.tsx` — white migration + affiliate-first

**Created / 新規:**
- `src/app/partners/page.tsx`
- `docs/PROJECT_BRIEFING_DAY8.md`
- `reports/day-08-report.md`

---

## 5. Bar Raiser Checklist / バーレイザー チェックリスト

- [x] Globe ↔ Calendar integration works / 地球儀↔カレンダー連携が動作
- [x] Globe drag-rotatable / 地球儀がドラッグ回転可能
- [x] companies/[slug] fully white-migrated / company 詳細ページが完全白移行
- [x] /partners page live / Partners ページ公開
- [x] Gold ticket CTA + affiliate link / ゴールドのチケット CTA + アフィリエイトリンク
- [x] JSON-LD structured data valid / JSON-LD 構造化データが有効
- [x] 0 TypeScript errors / TypeScript エラー 0

---

## 6. Next: Day 9 / 次回: Day 9

**EN:** Final polish + deployment — Lighthouse audit to 90+/95+/88+, mobile
375px final check, CDN cache strategy, Vercel production verification, and the
30万PV growth roadmap.

**JP:** 最終仕上げ + デプロイ — Lighthouse を 90+/95+/88+ まで監査、モバイル
375px の最終確認、CDN キャッシュ戦略、Vercel 本番検証、そして 30万PV 成長
ロードマップ。

---

**EN:** Day 8 implemented by 2 parallel Frontend Engineers (Opus 4.7). Bar Raiser GO.
**JP:** Day 8 は2名の Frontend Engineer（Opus 4.7）の並列実装。Bar Raiser GO 判定。
