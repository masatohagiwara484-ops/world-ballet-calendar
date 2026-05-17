# DAY 9 BRIEFING — Final Polish + Performance + Deployment
# World Ballet & Opera Calendar
# Agent: CEO → SRE + Frontend Engineer (parallel, Opus 4.7) → Code Reviewer → Bar Raiser

---

## 0. CEO Agent への指示

**DRI: SRE Agent + Frontend Engineer Agent（Opus 4.7 並列）**
**Final Gate: Bar Raiser Agent**

### Working Backwards（Bezos Method）
今日が終わった時点でユーザーが得るもの：
- **Lighthouse 90+/95+/88+** — Performance / SEO / Accessibility
- **CDN キャッシュ戦略** — 静的アセットの長期キャッシュ、HTML の適切な revalidate
- **完全なアクセシビリティ** — ARIA ラベル、キーボード操作、フォーカス管理
- **モバイル 375px 完璧対応** — 全ページ水平スクロールなし
- **ホームページ SEO** — WebSite / Organization JSON-LD
- **30万PV 成長ロードマップ** — CEO による事業戦略文書

---

## 1. 前提確認（Day 8 成果物）

✅ Day 8 完了:
- Globe ↔ Calendar 連携、ドラッグ操作
- companies/[slug] White Gradient 移行 + storytelling
- /partners ページ、Ticket CTA、JSON-LD（company ページ）

---

## 2. タスク分割（2 並列エージェント）

### Agent A: SRE — Performance & CDN
**担当ファイル:**
- `next.config.mjs`
- `vercel.json`（新規）

### Agent B: Frontend — Accessibility & Mobile & SEO
**担当ファイル:**
- `src/app/layout.tsx`, `src/app/page.tsx`
- `src/app/error.tsx`, `src/app/not-found.tsx`, `src/app/loading.tsx`
- 全 `src/components/**/*.tsx`（8 ファイル）

**競合なし** — 並列実行可能

---

## 3. Agent A 詳細 — Performance & CDN

- `next.config.mjs`: `compress: true`, `poweredByHeader: false`,
  `productionBrowserSourceMaps: false`
- Image 最適化: `formats: ['image/avif', 'image/webp']`
- HTTP `headers()`: 静的アセット（`/_next/static`, fonts, images）に
  `Cache-Control: public, max-age=31536000, immutable`
- `vercel.json`: 静的アセットの cache-control、`/api` の適切な設定
- セキュリティヘッダ: `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`
- ビルド後の First Load JS を確認（目標 < 150kB 維持）

---

## 4. Agent B 詳細 — Accessibility & Mobile & SEO

### Accessibility
- アイコンのみのボタン（モーダル close、カレンダー日付）に `aria-label`
- セマンティックランドマーク（`<main>`, `<nav>`, `<aside>`, `<footer>`）確認
- フォーカスリング: 全インタラクティブ要素で可視
- `<html lang="en">` 確認
- 装飾画像 `alt=""`、意味のある画像に適切な `alt`
- モーダル: `role="dialog"`, `aria-modal="true"`, フォーカストラップ
- 色コントラスト: WCAG AA（テキスト `#1A1A1A` on white は十分）
- Skip-to-content リンク（layout）

### Mobile 375px
- 全ページ・全コンポーネントで水平スクロールなし検証
- タッチターゲット最低 44×44px
- CalendarSidebar は `max-xl:hidden`（既存）— モバイル代替の必要性を確認

### SEO（ホームページ）
- `layout.tsx` または `page.tsx` に `WebSite` + `Organization` JSON-LD
- `sitemap.ts` / `robots.ts` の動作確認

---

## 5. Bar Raiser Final Checklist

- [ ] Lighthouse Performance 90+（コード最適化後）
- [ ] Lighthouse SEO 95+
- [ ] Lighthouse Accessibility 88+
- [ ] CDN キャッシュヘッダ設定
- [ ] 全要素に ARIA / フォーカス
- [ ] モバイル 375px 水平スクロールなし
- [ ] 0 TypeScript errors
- [ ] ビルド成功

---

## 6. Day 9 Completion Report

`reports/day-09-report.md` — **英語 + 日本語バイリンガル必須**（CLAUDE.md 規定）
30万PV 成長ロードマップを含む。

---

**Ready for Day 9 execution.**
