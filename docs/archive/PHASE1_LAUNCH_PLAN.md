# Phase 1 Launch Plan — Curated, Beautiful, Ballet-First

> Working-Backwards plan to ship a credible public launch **without** auto-
> scraping. Data is curated and human-verified; the differentiation is design,
> curation, and the start of travel monetisation. Bilingual (EN, then 日本語).
> Strategic basis: `docs/STRATEGY.md`.

---

## 1. Working-Backwards goal — what the user sees at launch

**EN:** A visitor lands on the most beautiful ballet/opera site they've ever
seen. They search one word ("Swan Lake", "Vienna", "MacMillan") and instantly
see every staging worldwide, on a luxury calendar and an interactive globe.
Every performance shows accurate dates, venue, and a **"Book tickets"** button.
A **"Plan the trip"** panel hints at hotels/flights near the venue. They can
**get alerts** for a company or work. Nothing on the site is wrong, because every
date is human-verified. It does not need 50,000 performances — it needs ~155
*perfect* ones, presented better than anyone on earth.

**JA:** 訪問者は、これまで見た中で最も美しいバレエ/オペラサイトに着地する。一語
（「白鳥の湖」「ウィーン」「マクミラン」）で検索すれば、世界中の上演がラグジュアリー
なカレンダーとインタラクティブな地球儀に即座に現れる。各公演には正確な日付・会場・
**「チケット予約」**ボタン。**「旅を計画」**パネルが会場近くのホテル/航空券を示唆。
カンパニーや演目の**アラート登録**ができる。すべての日付が人手検証済みなので、
サイトに誤りはない。5万公演は要らない——**完璧な約155公演**を、世界の誰よりも
美しく見せればいい。

---

## 2. Asset inventory — we are closer than it feels

**EN:** The build is already launch-grade (verified by codebase audit):
- ✅ Routes: home, `/search`, `/calendar`, `/companies`(+detail), `/works`,
  `/people`, `/performances`, `/partners`, dynamic `sitemap.ts` + `robots.ts`.
- ✅ White-gradient-luxury design fully implemented (Cormorant/Manrope/Italiana,
  gold/navy/forest/wine/plum, glass morphism, GSAP).
- ✅ Three.js interactive globe with 25 company markers.
- ✅ Faceted search (7 dimensions, live counts, sort, pagination) + autocomplete.
- ✅ 25 companies, ~155 performances, normalised entity graph (works/people/venues).
- ✅ SEO: per-page metadata, JSON-LD (TheaterEvent/Organization/CreativeWork), sitemap.
- ✅ Monetisation hooks: `ticket_url`/`affiliate_url` per performance, `bookingUrl()`
  prefers affiliate, `/partners` discloses the commission model.

**The gaps are few and known:** email alerts (placeholder copy only), travel
partners (coming-soon), Leaflet venue map (installed, unwired), i18n (English-only),
and a "verified" trust signal on dates.

**JA:** ビルドは既にローンチ水準（コード監査で確認済み）。ルート群・白グラデーション
ラグジュアリーデザイン・Three.js地球儀・ファセット検索・25館/約155公演の正規化
エンティティグラフ・SEO・アフィリエイト枠はすべて実装済み。**不足は少数かつ既知**：
メールアラート（文言のみ）、旅行パートナー（準備中）、Leaflet会場地図（未配線）、
多言語（英語のみ）、日付の「検証済み」信頼バッジ。

---

## 3. The data strategy for launch — trust without scraping

**EN:** Auto-scraping is **paused** (the pipeline stays in the repo, dormant).
Launch data is **curated + human-verified**:
1. **Verify the 155** against each house's official site/box office; stamp
   `last_verified` + `source_url` (already in schema).
2. **Add a visible "Verified" signal** on performance cards/pages ("Dates
   confirmed with the company · <date>") — turns our trust discipline into a
   *visible brand advantage* over Operabase's unattributed data.
3. **Ballet-first depth:** ensure the marquee ballet companies and the canonical
   works (Swan Lake, Nutcracker, Giselle, Romeo & Juliet, etc.) are complete and
   beautiful — depth in our wedge beats breadth everywhere.
4. **Quarterly refresh ritual** (manual, ~half a day) until legitimate feeds/
   partnerships come online via `docs/SOURCES.md` + `npm run discover:feeds`.

**JA:** 自動スクレイピングは**一時停止**（パイプラインは休眠状態でリポジトリに保持）。
ローンチデータは**キュレーション＋人手検証**：(1) 155件を各館の公式サイト/窓口で
照合し `last_verified`＋`source_url` を打刻（スキーマに既存）。(2) 公演カード/ページに
**「検証済み」表示**（「カンパニーと日付確認済み・<日付>」）を追加——我々の信頼規律を
Operabaseの出所不明データに対する*可視的なブランド優位*に変える。(3) **バレエ起点の
深さ**：主要バレエ団と定番演目（白鳥の湖、くるみ割り、ジゼル、ロミジュリ等）を
完全かつ美しく。くさび領域の深さは、どこでも広く浅くに勝つ。(4) 正規フィード/提携が
`docs/SOURCES.md`＋`npm run discover:feeds` で揃うまで、**四半期ごとの手動更新儀式**
（半日程度）。

---

## 4. Phase-1 build checklist (grounded in the audit)

**EN — ship-blockers (do before launch):**
- [ ] **Email alerts MVP** — the one missing consumer feature that creates an
  owned audience. Minimal: an email capture ("Alert me about <company/work>")
  → store in Supabase → manual/automated digest later. Replaces the "coming soon"
  copy on the home "How it works" step 3.
- [ ] **"Verified dates" trust badge** — render `last_verified`/`source_url` on
  performance pages + cards. Cheap, high-trust, on-brand.
- [ ] **Data verification pass** — confirm all ~155 dates; fix any drift; stamp
  provenance. (No code; editorial.)
- [ ] **Affiliate program applications** — apply to Tiqets / GetYourGuide /
  Booking.com; once approved, populate `affiliate_url` and flip `/partners` from
  "coming soon" to live for the first venues.
- [ ] **OG / share images** — ensure social-share cards render beautifully (the
  visual/social channel is our distribution edge; currently OG metadata exists,
  verify the rendered image).

**EN — fast-followers (right after launch):**
- [ ] **Curation/editorial layer** — a hand-picked "Unmissable this season" rail
  on the home page (editorial judgment = a moat + long-tail SEO).
- [ ] **Leaflet venue map** — wire the installed Leaflet into a venue/"near me"
  view to seed the travel experience.
- [ ] **"Plan the trip" panel** on performance pages — hotel/flight affiliate
  deep-links by venue lat/lng (the high-AOV money layer).

**JA — ローンチ前必須：** メールアラートMVP（唯一欠けた消費者機能＝保有オーディ
エンス生成。最小：メール取得→Supabase保存→後日ダイジェスト。home「How it works」
step3の"coming soon"を置換）／**「検証済み日付」信頼バッジ**（`last_verified`等を
カード・ページに表示）／**データ検証パス**（約155件の日付確認・出所打刻、コード不要）
／**アフィリエイト申請**（Tiqets/GetYourGuide/Booking.com、承認後 `affiliate_url`
投入＋`/partners` を順次公開）／**OG/シェア画像**（SNSは我々の流通の要、描画確認）。

**JA — ローンチ直後：** キュレーション層（home に「今季の必見」手選びレール＝堀＋
ロングテールSEO）／Leaflet会場地図（既存Leafletを「near me」ビューに配線）／公演
ページの「旅を計画」パネル（緯度経度でホテル/航空券アフィリンク＝高単価の収益層）。

---

## 5. Growth & distribution (the channels Operabase can't use)

**EN**
- **Visual/social:** the luxury design is *built to be screenshotted.* Seed
  Instagram/Pinterest/TikTok with beautiful "performance of the week" cards.
- **Editorial SEO long-tail:** work explainers, company stories, "ballet in
  <city>" destination guides — keywords Operabase doesn't target.
- **Owned audience:** email alerts → recurring, SEO-independent traffic.
- **Brand:** be unmistakably the *beautiful, trustworthy* one. Taste compounds.

**JA**
- **ビジュアル/SNS：** ラグジュアリーデザインは*スクショされるために作られている*。
  「今週の公演」美麗カードでInstagram/Pinterest/TikTokを起点化。
- **編集ロングテールSEO：** 演目解説・カンパニー物語・「<都市>のバレエ」旅行ガイド
  ——Operabaseが狙わないキーワード。
- **保有オーディエンス：** メールアラート→SEO非依存の再訪。
- **ブランド：** 紛れもなく*美しく信頼できる*存在になる。美意識は積み上がる。

---

## 6. Sequencing & success metrics

**EN**
- **Milestone A (launch):** ship-blockers done → public launch on Vercel.
  *Success:* site live, all dates verified, alerts capturing emails, ≥1 affiliate
  link live.
- **Milestone B (+4 weeks):** fast-followers → editorial rail + travel panel +
  venue map. *Success:* first affiliate bookings, first 100 alert subscribers,
  social channel seeded.
- **Milestone C (+quarter):** add houses only via legitimate feeds/partnerships;
  publish 3–5 destination guides. *Success:* organic long-tail traffic begins,
  repeat visitors via alerts.

**JA**
- **マイルストーンA（ローンチ）：** 必須項目完了→Vercel公開。*成功基準：*公開・全
  日付検証済み・アラートでメール取得・アフィリンク1件以上稼働。
- **マイルストーンB（+4週）：** 直後項目→編集レール＋旅行パネル＋会場地図。
  *成功基準：*初のアフィリエイト予約、アラート登録100人、SNS起点化。
- **マイルストーンC（+四半期）：** 正規フィード/提携経由でのみ館追加、旅行ガイド
  3〜5本公開。*成功基準：*オーガニックなロングテール流入開始、アラート経由の再訪。

---

## 7. Phase-1 non-goals (explicitly deferred)

**EN:** Auto-scraping at scale; global coverage / 50+ houses; multi-language
(i18n); user accounts/favourites; the casting/professional (B2B) market. These
are post-traction, *not* launch. Resist the urge to match Operabase's breadth.

**JA:** 大規模自動スクレイピング、全世界カバー/50館超、多言語(i18n)、ユーザー
アカウント/お気に入り、キャスティング(B2B)市場。これらはトラクション後であり、
ローンチ要件ではない。Operabaseの広さに張り合う誘惑に抗うこと。
