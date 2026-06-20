# 🤖 自動取り込み＋Telegram承認システム セットアップ指南書（日本語・初心者向け）

> このドキュメントは `docs/INGESTION_SETUP.md`（英語の運用手順書）を、
> **プログラミング未経験のオーナー**でも一人で設定できるように日本語で解説したものです。
> 専門用語はそのつど「＝かんたんに言うと」で説明します。上から順に進めてください。
>
> 📌 **前回の `OWNER_GUIDE_JA.md` からの変更点**
> - 環境変数が **3個 → 7個** に増えました（Anthropic と Telegram の鍵が追加）。
> - SQL スキーマが **002・003 の2つ → 004 を加えた3つ** になりました。
> - **Telegram bot** を使った「承認システム」が新しく加わり、設定にコマンド操作（1回だけ）が必要です。

---

## 0. このシステムは何をしてくれるのか（全体像）

これまでは公演データを手で入れていました。新システムは **AIが自動で世界中の劇場サイトを巡回し、
新しい公演を見つけて、あなたのスマホ（Telegram）に「これ載せていい？」と聞いてくる** 仕組みです。
あなたは Telegram で **「✅ 承認」か「🚫 却下」をタップするだけ**。承認したものだけがサイトに載ります。

```
 ① GitHub Actions が2日に1回 自動で起動
        ↓
 ② 各劇場サイトを巡回（feed優先、無ければAIが読み取り）
        ↓
 ③ 新規・変更・消滅した公演を検出 → 「承認待ち(pending)」として保存
        ↓
 ④ あなたの Telegram に「劇場ごとのまとめ」が届く
        ↓
 ⑤ あなたが ✅ / 🚫 をタップ
        ↓
 ⑥ 承認分だけ「公開(published)」になり、数分でサイトに反映
```

> 💡 用語
> - **GitHub Actions（ギットハブ・アクションズ）**＝GitHub が無料で提供する「自動実行ロボット」。決めた時刻にプログラムを動かせます。**VPS（自分のサーバー）は不要**です。
> - **feed（フィード）**＝劇場が公式に出している「データの蛇口」（iCal / RSS など）。
> - **pending / published**＝「承認待ち」「公開済み」というデータの状態。
> - **Telegram（テレグラム）**＝無料のメッセージアプリ。ここに通知が届きます。

### 費用はほぼゼロ
- feed があればAIを使わない（無料）。
- 中身が変わっていないページは飛ばす（無料）。
- 中身が変わった HTML ページだけ、AI（`claude-haiku-4-5`）が1回読む（約 $0.025）。
- 劇場 10〜15館で **月 $1〜2 程度** に収まります。

---

## 1. Supabase（データベース）の準備

> 💡 **Supabase（スーパーベース）**＝ネット上のデータ保管庫。新プロジェクト作成済みとのことなので、ここでは **SQLを流す**作業をします。

1. ブラウザで Supabase の新プロジェクトを開く。
2. 左メニューの **「SQL Editor」** →右上 **「+ New query」**。
3. 次の **3つのファイル**を、**この順番で**1つずつ貼り付けて **Run**：

```
① supabase/migrations/002_rebuild_schema.sql   （基本の箱）
② supabase/migrations/003_entity_graph.sql     （横断検索の箱）
③ supabase/migrations/004_ingestion.sql        ★今回の新システム用（承認・巡回の箱）
```

> ⚠️ **必ず 002 → 003 → 004 の順番**で実行。逆だとエラーになります。
> 各ファイルの中身を見たいときは、ターミナルで `cat supabase/migrations/004_ingestion.sql` と打つと表示されます。

4. 終わったら **「Project Settings（歯車）→ API」** を開き、次の3つをメモ（後で使います）：
   - **Project URL**
   - **anon public**（読み取り鍵）
   - **service_role**（書き込み鍵・極秘）🔒

---

## 2. 環境変数（7個）— 鍵をどこに置くか

> 💡 **環境変数**＝プログラムに渡す「秘密の設定値」。今回は **7個**あり、置き場所が3種類に分かれます。

### 2-1. 7つの鍵と置き場所の一覧

| # | 環境変数の名前 | 置く場所 | どこで手に入る／意味 |
|---|---|---|---|
| 1 | `NEXT_PUBLIC_SUPABASE_URL` | Vercel ＋ `.env.local` | Supabaseの「Project URL」（公開OK） |
| 2 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel ＋ `.env.local` | Supabaseの「anon public」（公開OK） |
| 3 | `SUPABASE_SERVICE_ROLE_KEY` | **GitHub Secrets** ＋ Vercel ＋ `.env.local` | Supabaseの「service_role」🔒 書き込み用・極秘 |
| 4 | `ANTHROPIC_API_KEY` | **GitHub Secrets** ＋ `.env.local` | AI（Claude）の鍵。下記2-4で取得。**月予算と通知を設定** |
| 5 | `TELEGRAM_BOT_TOKEN` | **GitHub Secrets** ＋ Vercel | Telegramの@BotFatherで作る（第4章） |
| 6 | `TELEGRAM_CHAT_ID` | **GitHub Secrets** ＋ Vercel | あなたのTelegram番号ID（@userinfobotで取得） |
| 7 | `TELEGRAM_WEBHOOK_SECRET` | Vercel | 自分で決めるランダムな文字列（合言葉） |

> 💡 「置く場所」の意味
> - **`.env.local`**＝あなたのパソコンの中だけの秘密ファイル。ローカルで `npm run seed` などを動かすため。
> - **GitHub Secrets**＝GitHub上の金庫。**自動巡回ロボット（GitHub Actions）が使う**鍵をここに入れる。
> - **Vercel**＝本番サイトの環境。**サイトやTelegram通知の受け取り**に使う鍵をここに入れる。
>
> ⚠️ 同じ鍵を複数の場所に入れるものがあります（表の通り）。面倒でも全部に入れてください。

### 2-2. `.env.local` の作り方（パソコン側）

VS Code やメモ帳で新規ファイルを作り、ファイル名を **`.env.local`** にして以下を貼り付け、本物の値に書き換えて保存：

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://あなたのプロジェクトID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=anonキーを貼る
SUPABASE_SERVICE_ROLE_KEY=service_roleキーを貼る
ANTHROPIC_API_KEY=sk-ant-で始まるキーを貼る
```

ターミナルだけで作る場合：
```bash
cd /home/user/world-ballet-calendar
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://あなたのプロジェクトID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=anonキーを貼る
SUPABASE_SERVICE_ROLE_KEY=service_roleキーを貼る
ANTHROPIC_API_KEY=sk-ant-で始まるキーを貼る
EOF
```
- `=` の前後にスペースを入れない／値を引用符で囲まない／1キー1行。
- 確認：`cat .env.local`

> ⚠️ `.env.local` は GitHub に絶対アップロードされません（安全）。Telegramの3つは `.env.local` には入れなくてOK（GitHub SecretsとVercelに入れます）。

### 2-3. GitHub Secrets の入れ方（自動ロボット用）

1. GitHubのリポジトリ → 上タブ **「Settings」（歯車）**。
2. 左メニュー **「Secrets and variables」→「Actions」**。
3. 緑ボタン **「New repository secret」**。
4. **Name** に変数名、**Secret** に値 →「Add secret」。
5. 次の4つを登録：`SUPABASE_SERVICE_ROLE_KEY` / `ANTHROPIC_API_KEY` / `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`。

### 2-4. Vercel への入れ方（本番サイト用）

1. ブラウザで Vercel のこのプロジェクトを開く。
2. **「Settings」→「Environment Variables」**。
3. **Key**（変数名）と **Value**（値）を入れて **「Save」**。
4. 次を登録：`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` / `TELEGRAM_WEBHOOK_SECRET`。
5. 入れ終わったら **再デプロイ**（Deployments → 最新のものを Redeploy）すると反映されます。

### 2-5. ANTHROPIC_API_KEY（AIの鍵）の取り方

1. ブラウザで **console.anthropic.com** にログイン。
2. **「API Keys」→「Create Key」** で鍵を作成（`sk-ant-...`）。
3. **「Billing」→ 予算上限（budget）と使用量アラート**を必ず設定（暴走防止）。月 $5 など低めでOK。

---

## 3. seed ＋ verify（最初のデータを入れる）

> 第1章（SQL）と第2章（`.env.local`）が終わってから行います。**ターミナル操作**です。

```bash
cd /home/user/world-ballet-calendar
npm install            # 初回だけ（部品の取り寄せ）
npm run seed           # 25団体・約155公演の初期データを投入
npm run validate:data  # データに矛盾がないか検証（緑ならOK）
```

> 💡 初期データ（seed）は最初から「公開(published)」状態なので、**サイトはすぐに中身が埋まり、空になりません**。
> 自動巡回で新しく見つかった分だけが「承認待ち」になります。

---

## 4. Telegram bot の設定（ここがコマンド操作のメイン）

Telegram で承認ボタンを押せるようにする設定です。落ち着いて順にやれば10分で終わります。

### 4-1. bot を作って TOKEN を取る
1. Telegram アプリで **`@BotFather`** を検索して開く。
2. `/newbot` と送信 → bot の名前とユーザー名を指示通りに決める。
3. 最後に表示される長い文字列が **`TELEGRAM_BOT_TOKEN`**。→ GitHub Secrets と Vercel に登録。

### 4-2. 自分の chat_id を取る
1. Telegram で **`@userinfobot`** を検索して開き、何かメッセージを送る。
2. 返ってくる数字（例 `123456789`）が **`TELEGRAM_CHAT_ID`**。→ GitHub Secrets と Vercel に登録。

### 4-3. WEBHOOK_SECRET（合言葉）を決める
- 適当なランダム文字列（例：`my-secret-9f3a7c2b`）を自分で決める。
- これが **`TELEGRAM_WEBHOOK_SECRET`**。→ Vercel に登録。
- 💡 **Webhook（ウェブフック）**＝「ボタンが押されたよ」という通知を、Telegramからあなたのサイトに自動で送る仕組み。合言葉で本物か確認します。

### 4-4. Webhook を登録する（コマンド1回だけ）

**サイトを Vercel にデプロイした後**で、ターミナルに次を打ちます。
`${TELEGRAM_BOT_TOKEN}` と `${TELEGRAM_WEBHOOK_SECRET}` は、**自分の実際の値に置き換えて**ください。

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKENをここに>/setWebhook" \
  -d "url=https://worldballetoperacalender.vercel.app/api/telegram/webhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRETをここに>"
```

> 💡 用語：**curl（カール）**＝ターミナルから「指定したURLに命令を送る」コマンド。
> これは「Telegramさん、ボタンが押されたらこのサイトに知らせてね」という**1回きりの登録**です。
> 成功すると `{"ok":true,"result":true,...}` のような返事が表示されます。
> このコマンドは bot の鍵さえあればどこからでも打てます（VPSは不要）。

---

## 5. 取材元（SOURCES）を選んで登録する

### 5-1. まず 10〜15 館を選んで調べる
`docs/SOURCES.md`（または記入用の `docs/SOURCES_FILL_IN_JA.md`）で、最初の **10〜15館**について4項目を埋めます：
- **Listing URL**（公演一覧ページ）／**Feed**（iCal等、無ければHTML）／**Affiliate**（チケット購入URL）／**robots/ToS**（自動取得の可否）

> ⚠️ 各劇場の **robots.txt と利用規約を必ず確認**。禁止なら `forbidden` と書く → ロボットは自動でその館を飛ばします。
> 公式の feed やアフィリエイトAPIがあれば最優先で使ってください。

### 5-2. 巡回ロボットに登録する（コード1行）
調べた館を `scripts/ingest/run-ingest.ts` の中の `SOURCES` という一覧に追記します。形式はこうです：

```ts
'royal-ballet': { companySlug: 'royal-ballet', url: '<公演一覧のURL>', kind: 'ical' },
```
- `kind` の選び方：
  - `'ical'` / `'rss'` / `'jsonld'` → **feedがある場合**。AIを使わず正確・無料。
  - `'html'` → **feedが無い場合**。AI（Haiku）がページを読み取ります。
- すでにある3つの見本（`royal-ballet`, `paris-opera-ballet`, `wiener-staatsoper`）が HTML 用テンプレートです。

> 💡 この1行追記が不安なら、調べた表を Claude Code に貼って「run-ingest.ts に登録して」と頼めばこちらで行います。

### 5-3. 自動承認について（知っておくと安心）
- ある館で **3回連続**であなたが問題なく承認すると、その館は自動承認(`auto_approve`)に昇格します（手間が減る）。
- 1回でも却下するとリセット。
- ただし **日付変更・公演中止だけは、必ず毎回あなたの手動承認**になります（信用を守るため）。

---

## 6. 実行する（動かし方）

| やりたいこと | 操作 |
|---|---|
| 手動で今すぐ巡回 | GitHub → **Actions** タブ → **「Ingest」** → **Run workflow** |
| 同上（ターミナル） | `npm run ingest -- --all --live` |
| 自動巡回 | **2日に1回**自動（`.github/workflows/scrape.yml` で設定済み・操作不要） |
| ネットに触れず練習 | `npm run ingest -- --all --fixture`（何も書き込まない安全なテスト） |
| 仕組みの自己点検 | `npm run ingest:selftest` |

実行すると、**劇場ごとに1通**の「まとめ通知」が Telegram に届きます。
**✅ Approve all（すべて承認）** か **🚫 Reject all（すべて却下）** をタップ。
承認分は数分でサイトに反映されます（トップ・検索・該当劇場・作品・人物ページが自動更新）。

---

## 7. VPS は使いません（念のため）

> 💡 **VPS（ブイピーエス）**＝自分専用のレンタルサーバー。

- 自動巡回は **GitHub Actions**（2日に1回）が担当。
- 承認ボタンの受け取りは **Vercel 上のサイト**（`/api/telegram/webhook`）が担当。
- どちらも既存の無料〜低額枠で動くため、**VPSの契約・管理はオーナーには発生しません。**

---

## 8. まとめチェックリスト（この順でやればOK）

```
[ ] ① Supabase で 002 → 003 → 004 のSQLを順に Run            （第1章）
[ ] ① Project URL / anon / service_role をメモ                （第1章）
[ ] ② .env.local に 4つの鍵を書く（Supabase3つ＋Anthropic）  （第2章）
[ ] ② GitHub Secrets に4つ登録                                （第2章）
[ ] ② Vercel に6つ登録 → 再デプロイ                            （第2章）
[ ] ② Anthropic で鍵を作り、月予算を設定                       （第2章）
[ ] ③ npm install → npm run seed → npm run validate:data      （第3章）
[ ] ④ @BotFather で bot作成 → TOKEN取得                        （第4章）
[ ] ④ @userinfobot で chat_id 取得                             （第4章）
[ ] ④ WEBHOOK_SECRET を決める                                  （第4章）
[ ] ④ デプロイ後、curl で setWebhook を1回実行                  （第4章）
[ ] ⑤ SOURCES を10〜15館ぶん埋める（robots確認）               （第5章）
[ ] ⑤ run-ingest.ts の SOURCES に登録                          （第5章）
[ ] ⑥ Actions で Ingest を手動実行 → Telegramで承認テスト       （第6章）
－  VPS：使わない（作業なし）                                   （第7章）
```

困ったら、エラーメッセージや画面のスクショ（**鍵が写らないよう注意**）を Claude Code に貼って質問してください。1つずつ一緒に解決します。
