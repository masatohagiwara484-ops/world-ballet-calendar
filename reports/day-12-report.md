# Day 12 Report — Honest State of the Build, Business Odds & Scale Strategy
# 第12日レポート — 開発の正直な現状・事業成功確度・スケール戦略

> Owner-requested strategic assessment. Written to be honest, not flattering.
> オーナー依頼の戦略評価。お世辞ではなく正直に記述する。

---

## 1. Where the project actually stands / 開発の実際の段階

**EN:** The hard truth and the good news are the same fact: **the product is ~90%
built and genuinely strong — what is missing is not code, it is trustworthy data
flowing in at scale.** The site you can't yet see "full" is not unfinished
software; it is finished software waiting for verified data we deliberately
refuse to fake.

Built and working today (11 days of work, verified in the repo):
- **Full site** — 9 page types: globe/map home, season calendar, company list +
  profile, performance detail, people, works, search, partners. Design system in
  place (Playfair + Inter, white-gradient luxury).
- **25 world-class companies** modeled with geo-coordinates.
- **Complete ingestion pipeline** (`scripts/ingest/`): feed-first
  (iCal/RSS/JSON-LD, no model cost) → Haiku AI extraction for HTML → browser
  render path for JS pages → entity resolver → diff engine → pending queue.
- **Telegram human-in-the-loop**: webhook flips `pending → published`, stamps
  `last_verified`, revalidates pages in minutes. Nothing publishes without you.
- **Earned auto-approve** (3 clean approvals; date/cancel always manual) and an
  **every-2-days GitHub Action** (`scrape.yml`).
- **New this session**: `discover:feeds` (auto-find feeds), `inspect:feed`
  (prove a feed is performances not news), render path for 7 no-feed houses.

**JA:** 厳しい事実と良い知らせは同一です——**製品は約9割完成しており、質も高い。
欠けているのはコードではなく「信頼できるデータが大量に流れ込むこと」だけ**です。
まだ「満杯」に見えないのは未完成だからではなく、捏造を拒否した完成済みソフトが
検証済みデータを待っている状態です。

本日時点で稼働中（リポジトリで確認済み、11日間の成果）:
- **サイト全体** — 9種のページ（地球儀ホーム、シーズンカレンダー、カンパニー
  一覧＋詳細、公演詳細、人物、作品、検索、パートナー）。デザインシステム完備。
- **世界一流25カンパニー**を座標付きでモデル化。
- **取り込みパイプライン完成**: フィード優先→Haiku抽出→ブラウザ描画→エンティ
  ティ解決→差分→承認待ちキュー。
- **Telegram人間承認**: webhookで`pending→published`、数分で反映。承認なし公開ゼロ。
- **獲得型自動承認**＋**2日に1回のGitHub Action**。
- **本セッション追加**: `discover:feeds`、`inspect:feed`、無フィード7館の描画経路。

---

## 2. What is NOT done / 未実装・未解決の工程

**EN (ranked by impact):**
1. **Zero published data right now.** No house has yet been ingested end-to-end
   to publication. The machine runs; the fuel tank is empty.
2. **The automation contradiction (critical).** `scrape.yml` runs on GitHub's
   **datacenter IPs**, which get **HTTP 403** from exactly the bot-protected
   flagship houses (Royal, Paris, ABT…). So "automatic every 2 days" only works
   for the rare open feed (Met). The houses that matter can currently be
   ingested **only from your residential Mac, by hand.** This is the single
   biggest unresolved gap.
3. **Feeds barely exist.** Reality check from this session: of 5 "feeds"
   discovered, only **Met (JSON-LD) is a real season feed.** Hamburg & Stuttgart
   gave single-event `.ics` files; Teatro Colón & Opera Australia gave WordPress
   `/feed/` (news, not performances). The "feed-first" dream under-delivers —
   **the render+AI path is the real primary engine.**
4. **Render path unproven in production.** Playwright extraction works in theory;
   not yet validated against live pages; may meet challenges on some houses.
5. **Monetization not live.** `affiliate_url` is modeled and rendered, but no
   affiliate network is joined, no IDs, no revenue. `partners` page is a shell.
6. **No accounts / premium / auth.** Not started.
7. **Coverage is tiny** (25 of thousands of houses) and **tests are minimal**
   (verification is manual via the `verifier-web` skill).
8. **Smaller confirmed gaps** (from the full repo inventory): the homepage
   promises **on-sale alerts** that don't exist (no auth/email/notifications);
   **Leaflet is installed but unwired** (no venue map); the **Three.js globe
   render is unverified** (flagged in the Day 9 reassessment); **person bios are
   hardcoded placeholder text**; **no automated tests / test runner**; **English
   only** (no i18n); **no PWA**; `/partners` is an explicit "Coming Soon" page.

**JA（影響度順）:**
1. **現在、公開データはゼロ。** どの館もまだ公開まで到達していない。機械は動くが
   燃料タンクが空。
2. **自動化の矛盾（最重要）。** `scrape.yml`はGitHubの**データセンターIP**で動き、
   保護された主要館（Royal/Paris/ABT…）から**403**を食らう。つまり「2日に1回自動」
   は開放フィード（Met）でしか効かない。重要な館は**今はあなたのMac（住宅IP）から
   手動でしか**取り込めない。これが最大の未解決ギャップ。
3. **フィードはほぼ存在しない。** 今回判明：発見「5フィード」のうち本物のシーズン
   フィードは**Met（JSON-LD）のみ**。独2館は単一公演.ics、南米/豪2館はWordPressの
   ニュースフィード。「フィード優先」構想は期待外れで、**描画+AIが実質の主力**。
4. **描画経路は本番未検証。** 理論上は動くが実ページ未検証、館によっては課題あり。
5. **マネタイズ未稼働。** `affiliate_url`はモデル化・表示済みだが、ネットワーク未加入、
   ID無し、収益無し。`partners`ページは骨組みのみ。
6. **アカウント/プレミアム/認証は未着手。**
7. **カバレッジは僅少**（数千館中25館）、**テストも最小限**（検証は手動）。

---

## 3. Honest odds of business success / 事業成功の正直な確度

**EN:** Separate two bets, because they have very different odds.

- **Bet A — "Out-cover Operabase" (global database play): LOW odds.** Operabase
  has indexed opera/ballet since 1996 — 1M+ performances, 2,900 companies, with
  licensing relationships you cannot replicate by scraping. The 403 wall and the
  absence of real feeds mean breadth is expensive and slow. Fighting them on raw
  coverage is a losing race.

- **Bet B — "The most beautiful, trustworthy, traveler-grade experience for a
  curated set of world-class houses": MODERATE-to-GOOD odds.** Here your real
  assets win: the software and design are genuinely better than Operabase's dated
  UX, the trust discipline ("never a wrong date") is a real brand promise, and
  the globe/map + entity graph is a delightful discovery surface. You don't need
  10,000 houses to be loved — you need 30–80 of the world's greatest, kept
  perfectly accurate and gorgeously presented, monetized through travel.

**The iron triangle:** *full coverage + zero human effort + absolute accuracy* —
you can have any two, never all three at once. Today you correctly chose
**accuracy + low cost**, which is why coverage (and the site) is empty. The
winning reframe is to **stop maximizing coverage** and instead win on **depth +
design + trust** for a curated set. That is a fundable, defensible product.
Verdict: **as Bet A, I would not bet. As Bet B, I would — and the foundation you
have built is exactly right for it.**

**JA:** 賭けを2つに分けます。確度が全く違うからです。

- **賭けA「Operabase超えの世界DB」：低確度。** 1996年からの蓄積（100万公演超、
  2,900団体）とライセンス関係はスクレイピングで再現不能。403の壁と本物フィードの
  不在から、量での勝負は高コストかつ低速。正面勝負は負け戦。

- **賭けB「厳選された世界一流館に対する、最も美しく信頼でき旅行者品質の体験」：
  中〜高確度。** ここではあなたの本当の強みが効く——ソフトとデザインはOperabaseの
  古いUXより明確に上、「間違った日付は出さない」という信頼規律はブランド約束になり、
  地球儀＋エンティティグラフは発見体験として魅力的。1万館は不要。世界最高の30〜80館を
  完璧な正確さと美しさで提示し、旅行で収益化すればよい。

**鉄の三角形:** *全網羅・人手ゼロ・絶対正確* は、2つまで。3つ同時は不可能。今あなたは
正しく**正確さ＋低コスト**を選び、結果として網羅（とサイト）が空。勝ち筋は**網羅の
最大化をやめ**、厳選セットで**深さ＋デザイン＋信頼**に勝つこと。これは資金調達でき、
防御可能な製品です。結論：**賭けAなら張らない。賭けBなら張る——そして今ある土台は
まさにBに最適。**

---

## 4. Scale, monetization & ideas not yet on the table / スケール・収益・新規案

### 4.1 Revenue you can turn on soon / 近く着火できる収益

**EN:**
- **Travel affiliate (highest leverage, already modeled).** Tiqets /
  GetYourGuide (tours, high conversion), **Booking.com / Expedia (hotels near the
  venue by lat/lng — you already store coordinates)**, See Tickets & national
  ticketing affiliates, flights (WayAway/Aviasales). The killer unit is the
  **"performance trip" bundle**: ticket + hotel + flight around one show. Highest
  margin, and uniquely yours because you know *where* and *when*.
- **Editorial + SEO funnel.** Short beautiful guides ("first night at the
  ballet", "10 unmissable productions this season", "a ballet weekend in Paris")
  rank on search, then feed the affiliate funnel. Cheap to produce, compounding.

**JA:**
- **旅行アフィリエイト（最大レバレッジ、モデル化済）。** Tiqets/GetYourGuide、
  **Booking.com/Expedia（座標で会場近隣ホテル）**、See Tickets、航空券。決定打は
  **「公演トリップ」バンドル**（チケット＋ホテル＋航空券）。あなたは*いつ・どこ*を
  知っているため高マージンかつ独自。
- **編集＋SEO導線。** 美しい短ガイドで検索流入→アフィリエイト導線。低コストで複利。

### 4.2 Premium tier / プレミアム機能

**EN:** Turn a calendar into a *fan & travel* product (stickier, recurring):
- **Follow** companies / choreographers / dancers → a personal feed + **iCal
  export of only your shows** (the entity graph already supports this).
- **Alerts**: "notify me when Royal Ballet announces Swan Lake / when tickets
  open / when a price drops." This alone justifies a subscription.
- **Multi-city trip planner**: pick 3 cities, see overlapping ballet weeks, build
  an itinerary. Premium = ad-free + alerts + planner + early data access.

**JA:** カレンダーを*ファン＆旅行*製品へ（粘着・継続課金）:
- **フォロー**（団体/振付家/ダンサー）→個人フィード＋**自分の公演だけのiCal出力**。
- **アラート**（演目発表・発売・値下げ通知）。これ単体で課金理由になる。
- **多都市トリッププランナー**。プレミアム＝広告無し＋アラート＋プランナー＋先行データ。

### 4.3 Ideas not yet on the table / 構想に未登場の新規案

**EN:**
1. **Flip the data model — become the channel houses push INTO, not the scraper
   they block.** Start with mid-tier houses hungry for international audience;
   they will gladly hand you a clean feed for discovery. Coverage stops being a
   scraping war and becomes a partnership funnel. Big houses follow the audience.
2. **White-glove concierge booking** (premium/luxury tier): "get me two seats to
   opening night in Paris." High margin, fits the affluent ballet-travel buyer.
3. **B2B data widget / API**: once the verified graph is solid, license an
   embeddable "what's on at the world's great houses + book" widget to tourism
   boards, luxury hotels, and travel concierges (the Amex-Centurion audience).
4. **Fan/social layer**: following dancers turns visitors into returning fans —
   far stickier than a calendar, and a moat Operabase has no culture to build.

**On your "AI agent crawls each site" question:** that *is* the render+AI path,
and it is the right primary engine — but be clear-eyed about its limits: it
**cannot run on the GitHub datacenter IP (403)**, so it must run from your Mac, a
**residential-proxy**, or a self-hosted residential runner; it costs a cheap
Haiku call per *changed* page (hash-gated); and it needs per-site tuning. It
scales beautifully to a **curated ~30–80 houses**, not to thousands. For
thousands, only aggregator licensing or houses-push-data works. **Recommendation:
AI-crawl the curated flagship set now; pursue partnerships/aggregator for breadth
later.** This is buildable today — no theoretical blocker.

**JA:**
1. **データモデルを反転——スクレイパーではなく、館が「流し込む」チャネルになる。**
   国際露出に飢えた中堅館から開始。彼らは発見のため喜んでフィードを渡す。網羅は
   スクレイピング戦争ではなく提携ファネルになる。大館は観客を追って後から来る。
2. **白手袋コンシェルジュ予約**（プレミアム/ラグジュアリー）。「パリ初日に2席」。
   高マージン、富裕なバレエ旅行層に合致。
3. **B2Bデータウィジェット/API**。検証済グラフが堅牢化したら、観光局・高級ホテル・
   旅行コンシェルジュ向けに「世界の名門で何が上演中＋予約」ウィジェットをライセンス。
4. **ファン/ソーシャル層**。ダンサーをフォロー→訪問者がリピーターに。カレンダーより
   遥かに粘着し、Operabaseが文化的に作れない堀になる。

**「AIエージェントが各サイトを巡回」案について:** それが描画+AI経路そのもので、主力
エンジンとして正しい。ただし限界を直視すべき——**GitHubのデータセンターIPでは403で
動かない**ため、あなたのMac・**住宅プロキシ**・自前の住宅ランナーで動かす必要がある。
コストは*変更があった*ページごとに安価なHaiku 1回（ハッシュゲート付）、館ごとの調整も
要る。**厳選30〜80館には美しくスケールするが、数千館には不向き**。数千にはアグリゲータ
ライセンスか「館がデータを流す」しかない。**推奨：今は厳選フラッグシップをAI巡回し、
網羅は後から提携/アグリゲータで。** 今日から構築可能で、理論上の障害はない。

---

## 5. Recommended next steps / 推奨される次の一手

**EN:**
1. **Prove ONE house end-to-end this week.** Run `inspect:feed` on the two RSS
   URLs; ingest **Met (JSON-LD)** live from your Mac → approve in Telegram → see
   it on the live site. One real, correct house beats a hundred fake ones.
2. **Then prove the render path** on Royal Ballet from your Mac. If it extracts
   cleanly, the curated-flagship engine is validated.
3. **Resolve the 403/automation gap**: decide between (a) periodic manual Mac
   runs, (b) a paid residential proxy for the GitHub Action, or (c) a self-hosted
   residential runner. (I can implement any of these.)
4. **Join one affiliate network** (Tiqets or Booking.com) and wire real IDs —
   first revenue with near-zero extra code.
5. **Reframe the public goal** from "every stage on earth" to "the world's
   greatest stages, perfectly accurate, beautifully bookable."

**JA:**
1. **今週、1館をend-to-endで実証。** 2つのRSSに`inspect:feed`→**Met（JSON-LD）**を
   Macからライブ取り込み→Telegram承認→ライブサイトで確認。本物1館は偽物100館に勝る。
2. **次に描画経路をRoyal Balletで実証**（Macから）。綺麗に抽出できれば、厳選
   フラッグシップ・エンジンが検証完了。
3. **403/自動化ギャップの解消**：(a)定期的な手動Mac実行、(b)GitHub Action用の有料
   住宅プロキシ、(c)自前住宅ランナー、から選択。（いずれも実装可能。）
4. **アフィリエイト1社加入**（TiqetsかBooking.com）＋実ID配線。ほぼ追加コード無しで
   初収益。
5. **公開目標を再設定**：「地上のあらゆる舞台」から「世界最高の舞台を、完璧な正確さで、
   美しく予約可能に」へ。

---

*Verdict in one line / 一行結論:* **The build is excellent; the bottleneck is
data acquisition at scale, which is real but solvable for a curated set — so
narrow the ambition, win on depth + design + trust, and monetize through travel.**
／ **造りは優秀。ボトルネックは大規模データ取得で、これは実在するが厳選セットなら
解決可能——だから野心を絞り、深さ・デザイン・信頼で勝ち、旅行で収益化せよ。**
