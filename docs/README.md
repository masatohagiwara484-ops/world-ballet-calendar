# Documentation index / ドキュメント索引

Current, canonical documents. Anything not listed here lives in [`archive/`](./archive/) as historical record.
ここに載っているものだけが現行ドキュメントです。それ以外は歴史的資料として [`archive/`](./archive/) にあります。

| Document | What it is / 内容 |
|---|---|
| [ROADMAP.md](./ROADMAP.md) | **The single execution plan** — task backlog, status, priorities. / 唯一の実行計画書(タスク・状況・優先順) |
| [INGESTION_SETUP.md](./INGESTION_SETUP.md) | Ingestion operator runbook (EN): pipeline, env vars, Telegram approval, `--local` path. / 取り込み運用手順書(英) |
| [INGESTION_SETUP_JA.md](./INGESTION_SETUP_JA.md) | Ingestion setup guide in Japanese. / 取り込みセットアップ手順(日本語) |
| [OWNER_GUIDE_JA.md](./OWNER_GUIDE_JA.md) | Owner's day-to-day operations guide (JA). / オーナー向け日常運用ガイド |
| [SOURCES.md](./SOURCES.md) | Data-source catalogue per house: listing URL, feed, robots/ToS. / 劇場ごとのデータソース台帳 |
| [SOURCES_FILL_IN_JA.md](./SOURCES_FILL_IN_JA.md) | Working sheet for filling in new sources (JA). / ソース記入用ワークシート |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Visual design system: tokens, typography, motion. / デザインシステム(トークン・タイポ・モーション) |

## Conventions / 規約

- **Daily records** live in `reports/` named `day-XX-report.md` (bilingual EN + JA — standing rule),
  each starting with a `_Date: YYYY-MM-DD_` line; [`reports/README.md`](../reports/README.md) is the index.
  日次記録は `reports/day-XX-report.md`(日英併記が標準ルール)。冒頭に `_Date:` 行を必ず入れ、
  索引は [`reports/README.md`](../reports/README.md)。
- **Strategy & brand** live in the root `CLAUDE.md` (Brand Charter) — docs here are operational.
  戦略・ブランド憲章はルートの `CLAUDE.md`。ここは運用ドキュメント置き場です。
- **EN/JA pairs:** the English document is canonical; the Japanese counterpart carries a
  "last synced" line in its header. When you change the English side, update the Japanese
  side (or at minimum its sync date) in the same PR.
  英日ペアのドキュメントは**英語版が正本**。日本語版はヘッダに「最終同期日」を持ち、英語版を
  変更した PR で日本語版（最低でも同期日）も更新すること。
- **Worksheets** (e.g. `SOURCES_FILL_IN_JA.md`) live here only while active. Once filled in
  and reflected into the canonical doc (`SOURCES.md`), move the sheet to `archive/`.
  記入用ワークシートは作業中のみここに置く。記入内容を正本（`SOURCES.md`）へ反映したら
  シートは `archive/` へ移動すること。
- **Command reference:** the full `npm run` script table lives in the root
  [`README.md`](../README.md) — keep it in sync with `package.json`.
  全コマンド一覧はルート [`README.md`](../README.md)。`package.json` と同期を保つこと。
