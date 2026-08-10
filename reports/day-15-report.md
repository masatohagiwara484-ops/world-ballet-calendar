# Day 15 Report — Telegram Review: Authentication, Shared Guard & On-Demand Queue

> Bilingual report (English first, then 日本語) — per the immutable Day Report rule.

---

## 1. Goal / ゴール

**EN:** Move the owner's performance-data review off the terminal and onto
Telegram — visually, and without weakening the trust gate. Three things had to be
true before that migration was safe: the webhook must know *who* tapped, an
approval tap must be as strict as `review:pending --publish`, and the queue must
be reachable at any time, not only during a crawl.

**JA:** 公演データの確認を **ターミナルから Telegram へ**移す。ただし信頼ゲートを
緩めない。移行前に3点を満たす必要があった：Webhook が「誰が押したか」を検証すること、
承認タップが `review:pending --publish` と同等に厳格であること、そして巡回中以外でも
未承認キューをいつでも呼び出せること。

---

## 2. Shipped / 成果

**EN:**
- **Owner authentication (`src/lib/telegram-auth.ts`).** The webhook verified the
  Telegram secret header — which proves *Telegram* called us, not that the *owner*
  tapped. Approval now also requires `callback_query.from.id` (and
  `message.from.id`) to match `TELEGRAM_CHAT_ID`, or the optional comma-separated
  `TELEGRAM_ALLOWED_USER_IDS` for a shared review group. **Fails closed:** with
  neither variable set, nobody is authorised.
- **One shared publish guard (`src/lib/review-guard.ts`).** `review-pending.ts`
  had grown three safety rules the webhook never had, so a Telegram "Approve all"
  could publish rows the terminal would have refused. The rules now live in one
  module used by both paths: cancellations, implausible dates (year-0026 rows,
  runs over 200 days) and non-performance titles are **withheld**, and the
  approval receipt names what it withheld.
- **On-demand queue (`src/lib/pending-digest.ts`).** A crawl only ever sent a
  digest for the changes it had just found. `npm run review:telegram` — and typing
  **`/pending`** in the bot DM, same code path — now pushes everything currently
  pending as one digest per house. Each house has a single standing batch
  (`pending:<slug>`), so re-asking refreshes rather than accumulates.
- **Details view.** 🔍 Details edits the digest in place into a per-performance
  view (venue, exact run, price, ticket link, confidence), paged 6 at a time with
  ↩︎ Summary to return — everything the terminal printed, on the phone.
- **CI coverage (`npm run telegram:selftest`).** 24 offline checks over the auth
  rules, the guard's classification, and Telegram's hard limits (4096-char
  messages, 64-byte `callback_data`). No bot, no DB, no network — so it runs on
  every PR.
- **`filters.ts` moved to `src/lib/ingest-filters.ts`** (re-exported from its old
  path) so server code can share it, per the repo's `scripts/ → src/` direction.

**JA:**
- **オーナー認証。** 従来の合言葉ヘッダーは「Telegram からの通信」しか証明せず、
  「誰が押したか」は未検証だった。承認には送信者IDと `TELEGRAM_CHAT_ID` の一致を必須化。
  複数人運用向けに `TELEGRAM_ALLOWED_USER_IDS` も用意。**未設定時は誰も承認できない**
  （安全側に倒れる設計）。
- **公開ガードの一本化。** ターミナル側にだけ存在した3つの安全規則（中止・ありえない
  日付・非公演）を共有モジュール化し、Telegram 承認にも適用。保留内容は承認後の
  メッセージに表示される。
- **オンデマンドのキュー確認。** `npm run review:telegram` と Telegram での
  **`/pending`** で、今たまっている未承認データをいつでも呼び出せる。劇場ごとに
  まとめは1つなので通知が溜まり続けない。
- **Details ボタン。** 会場・正確な日程・価格・チケットリンク・信頼度を1公演ずつ表示
  （6件ずつページ送り、↩︎ Summary で戻る）。ターミナルの情報量をそのまま携帯へ。
- **CI 追加。** `npm run telegram:selftest` が24項目をオフライン検証し、全PRで走る。

---

## 3. Verification / 検証

**EN:** `lint` ✓ · `validate:data` ✓ · `ingest:selftest` ✓ · `telegram:selftest`
✓ (24/24) · `next build` ✓. `review:telegram --dry` was exercised without
credentials and exits cleanly with the correct configuration error. The live
send/tap path cannot be verified from this environment — it needs the owner's bot
token, so it is the first item below.

**JA:** 上記5点すべてグリーン。認証情報のない環境で `--dry` が正しくエラー終了する
ことも確認。実際の送信とタップの検証には bot トークンが必要なため、下記の残作業とした。

---

## 4. Owner actions / オーナーの作業（約25分）

**EN:** Nothing below can be done for you — it needs your Telegram account and
your Vercel/GitHub settings. Full walkthrough: `docs/INGESTION_SETUP_JA.md` §4.

1. @BotFather → `/newbot` → `TELEGRAM_BOT_TOKEN`.
2. @userinfobot → your numeric id → `TELEGRAM_CHAT_ID`.
3. Open the bot DM and press **Start** once (a bot cannot message a user who
   never started it).
4. `openssl rand -hex 32` → `TELEGRAM_WEBHOOK_SECRET`.
5. Add all three to **Vercel** (Production) and redeploy; add the token + chat id
   to **GitHub Secrets** (for the scheduled crawl); add all three to `.env.local`.
6. Register the webhook (one `curl`, in the doc), then `npm run telegram:check`.

**JA:** 上記6手順のみ（詳細は `docs/INGESTION_SETUP_JA.md` 第4章）。トークンは
チャットに貼らないこと。完了の合図は `npm run telegram:check` が ✅ を3つ返すこと。

---

## 5. Next / 次

**EN:**
- Owner completes the six setup steps; then verify a real send → tap → publish
  round trip end to end on the live deploy.
- Consider running the shared guard on the ingest **auto-approve** path too
  (`run-ingest.ts`), which still publishes trusted sources without it. Deliberately
  out of scope today to keep this diff to the review surface.

**JA:**
- オーナーの設定完了後、本番で「送信 → タップ → 公開」を通しで検証する。
- 巡回の**自動承認**経路（`run-ingest.ts`）は、まだ共有ガードを通っていない。今回は
  差分をレビュー面に絞るため意図的に対象外とした。次の候補。
