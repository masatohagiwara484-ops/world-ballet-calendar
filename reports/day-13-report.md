# Day 13 Report — Travel-Brand Features & Plan Consolidation

> Bilingual report (English first, then 日本語) — per the immutable Day Report rule.

---

## 1. Working-Backwards goal / 今回のゴール（逆算）

**EN:** When the owner opens the site, the product should *feel* like a curated
travel brand, not a database: a hand-picked season rail, a world map of the great
houses, and a visible trust signal on every confirmed date. In parallel, the plan
and brand direction (now travel-integrated) must live in one place so no future
session wastes time hunting across stale docs.

**JA:** オーナーがサイトを開いたとき、DBではなく**キュレーションされた旅行ブランド**
だと*感じられる*こと——手選びの季節レール、世界の名門館の地図、確定日付に必ず付く信頼
バッジ。同時に、（旅行を統合した）計画とブランド方針を**一箇所**に集約し、今後どの
セッションも古い散在ドキュメントを探さずに済むようにする。

---

## 2. Shipped today / 本日の成果

**EN:**
- **#6 Curated rail** (`CuratedRail`) — an editorial "Unmissable this season" row
  of poster cards on the home page (reuses the `is_featured` editor's-pick flag).
- **#7 Venue map** (`VenueMap` / `VenueMapLoader`) — `/map` world explorer with a
  geolocation "Near me" control, plus a per-house map on company pages. Gold pins
  on a quiet dark basemap, luxury popups linking to each house.
- **#1 Verified-dates badge** (shipped in the prior step) — `VerifiedDates` on the
  performance page and list cards; `last_verified` / `source_url` surfaced.
- **Newsletter popup** (`NewsletterPopup`) — intent-triggered, tasteful, once per
  visitor; captures deep-page traffic for "The Première Edit."
- **Docs consolidation** — new `docs/ROADMAP.md` (single source of truth for the
  #1–#13 backlog) and a `CLAUDE.md` §"Strategic Direction v2" capturing the
  travel-integrated business plan, brand voice, and marketing strategy.

**JA:**
- **#6 キュレーションレール**（`CuratedRail`）— ホームに「今季の必見」ポスターカードの
  編集レール（`is_featured` を再利用）。
- **#7 会場地図**（`VenueMap` / `VenueMapLoader`）— `/map` の世界地図＋「Near me」
  現在地、団体詳細ページに単一会場マップ。暗色ベースマップに金ピン、luxury popup から
  各館ページへ。
- **#1 検証済みバッジ**（前ステップで実装）— 公演ページ／カードに `VerifiedDates`。
- **ニュースレター・ポップアップ**（`NewsletterPopup`）— 控えめな意図トリガー、訪問者
  あたり1回。深層ページの流入を「The Première Edit」へ。
- **ドキュメント集約** — `docs/ROADMAP.md`（#1–#13 の単一計画書）と `CLAUDE.md`
  §「Strategic Direction v2」（旅行統合事業・ブランド・マーケ戦略）。

---

## 3. Live verification / 検証状況

**EN:**
- `npm run build` passes (types + lint) after each change, post-`main` merge.
- Because the live server can't run persistently in this environment, UI was
  verified by rendering the components against the **compiled Tailwind CSS** and
  screenshotting via Playwright (`file://`). The rail and badge render on-brand;
  the Leaflet map initialises with luxury controls/popups (basemap tiles need a
  networked browser, i.e. the deployed site).
- **Important honest caveat:** #1 and #6 are **data-gated** — they render only
  when verified / featured rows exist. With published data currently ≈ empty, the
  live site shows little visible change. #7 renders immediately (coords exist).

**JA:**
- 変更ごとに `npm run build` 成功（型・Lint、main統合後も）。
- 本環境ではサーバー常駐起動ができないため、UIは**コンパイル済み Tailwind CSS** に対し
  コンポーネントを描画し Playwright（`file://`）でスクショ検証。レール／バッジは基調どおり
  描画、Leaflet 地図は luxury コントロール／popup で初期化（ベースマップのタイルは
  ネットワーク接続のあるブラウザ＝本番配信で表示）。
- **正直な注記：** #1・#6 は**データ依存**で、検証済み／featured 行がある時のみ表示。
  現在は公開データがほぼ空のため、ライブでの見た目変化は僅少。#7 は座標があるため即表示。

---

## 4. Owner's question — "Is it a problem that #6 isn't visible to me?" / オーナーの質問への回答

**EN:** It is **not a code defect** — it is *by design*. Both #1 and #6 degrade
gracefully (hide) when there's no data, which is the correct behaviour (never show
an empty editorial promise or a fake "verified" claim). **But it IS a real product
problem at the system level:** the site has almost nothing to show visitors until
**#3 (data verification & publishing)** is done. #3 is the root cause of "the site
looks blank," and it is the single highest-leverage next step. Recommended fixes
(pick one):
1. **Populate verified data** — run the ingestion pipeline (Telegram approval) or
   hand-seed a handful of flagship runs with `last_verified` + `source_url`, then
   `npm run seed`. This makes #1 and #6 visible *and* makes the whole site real.
2. **Temporary preview fixture** — I can add a dev-only fixture so you can QA #1/#6
   on a preview deploy before real data lands (clearly marked, never public).

**JA:** これは**コードの不具合ではなく*仕様***です。#1・#6 はデータが無いとき優雅に
非表示になる正しい挙動（空の編集枠や偽の「検証済み」表示を出さないため）。**ただし
システム全体としては実在の課題**で、**#3（データ検証・公開）**が終わるまでサイトは
訪問者にほぼ何も見せられません。#3 こそ「サイトが空に見える」根本原因で、次の最重要
ステップです。推奨対応（いずれか）：
1. **検証済みデータ投入** — 取り込みパイプライン（Telegram 承認）を回す、または旗艦館の
   数公演を `last_verified` + `source_url` 付きで手動シードし `npm run seed`。これで
   #1・#6 が表示され、サイト全体が実体化。
2. **一時プレビュー用フィクスチャ** — 本番前に #1/#6 をプレビューで確認できる開発専用
   フィクスチャを追加可能（明示ラベル付き・非公開）。

---

## 5. Next tasks (planned, not yet shipped) / 次のタスク（計画・未実装）

**EN (in the agreed order #9 → #10, then quality):**
- **#9 Editorial long-tail SEO** — `/journal` + content templates (travel guides,
  work explainers, company stories). Compounding search funnel → affiliate.
- **#10 Auto social cards** — beautiful "this week's performances" share cards;
  our unique visual distribution edge.
- **#11 tests**, **#12 ingestion 403/automation**, **#13 bios** — hardening/scale.
- **Bigger bets:** performance-trip bundle, editorial journal, premium tier,
  data-model flip (houses push feeds). See `docs/ROADMAP.md`.

**JA（合意順 #9 → #10、その後 品質）:**
- **#9 編集ロングテールSEO** — `/journal` ＋コンテンツ・テンプレ（旅行ガイド／演目解説
  ／カンパニー物語）。複利的な検索導線 → アフィリエイト。
- **#10 SNS用 自動カード** — 「今週の公演」美麗シェアカード。唯一のビジュアル流通エッジ。
- **#11 テスト**、**#12 取り込み403/自動化**、**#13 人物bio** — 品質・スケール。
- **大きな賭け：** 公演トリップ・バンドル、編集ジャーナル、プレミアム、データモデル反転。
  詳細は `docs/ROADMAP.md`。

---

## 6. Process change / 運用の変更
**EN:** From now on, every working session is recorded as a `reports/day-XX-report.md`
(bilingual) capturing the day's record and outcomes. The single live plan is
`docs/ROADMAP.md`; durable direction/brand/marketing is in `CLAUDE.md`
§"Strategic Direction v2."

**JA:** 今後は作業ごとに `reports/day-XX-report.md`（バイリンガル）で記録と成果を残し
ます。実行計画の単一ソースは `docs/ROADMAP.md`、恒久的な方針・ブランド・マーケは
`CLAUDE.md` §「Strategic Direction v2」。
