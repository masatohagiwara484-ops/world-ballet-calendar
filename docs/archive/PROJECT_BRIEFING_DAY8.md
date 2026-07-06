# DAY 8 BRIEFING — Globe Integration + Brand + Conversion
# World Ballet & Opera Calendar
# Agent: CEO → Design Director → Frontend Engineer (×2 parallel, Opus 4.7) → Code Reviewer → Bar Raiser → SRE

---

## 0. CEO Agent への指示

**DRI: Frontend Engineer Agent ×2（Opus 4.7 / Design Director 並走）**
**Final Gate: Bar Raiser Agent**

### Working Backwards（Bezos Method）
今日が終わった時点でユーザーが得るもの：
- **Globe ↔ Calendar 双方向連携** — 国フィルター選択で地球儀がその国へ camera fly (1.5s)
- **日付選択 → globe マーカーハイライト** — 該当公演のマーカーが glow
- **ドラッグ可能な地球儀** — OrbitControls でユーザーが回転操作可能
- **Company Storytelling** — company 詳細ページが White Gradient + hero narrative 強化
- **Affiliate Partners ページ** — 提携先ロゴ表示、信頼性向上
- **チケット購買 CTA 最適化** — Performance modal から 1-click affiliate redirect
- **SEO structured data** — JSON-LD (`PerformingArtsEvent` / `Organization`)

### 戦略目的（CEO）
月間 30 万 PV + 高コンバージョン達成のため：
- **SEO visibility** → organic traffic 増加（structured data）
- **Brand authority** → trust 構築（Partners、storytelling）→ conversion 増加
- **Purposeful Depth animation** → 2026 Web Design Award 水準（機能を支える立体感）

---

## 1. 前提確認（Day 7 成果物）

✅ Day 7 完了状態:
- PerformanceModal（3D entrance/exit）
- CalendarSidebar 月別 expand/collapse
- 日付クリック → modal open

⚠️ **Day 6 移行漏れ（Day 8 で修正必須）:**
- `src/app/companies/[slug]/page.tsx` — まだ dark mode (`#0A0A0A`, `#C9A961`)
- `src/components/map/GlobeView.tsx` — ツールチップが dark (`#0A0A0A`)
- `src/components/performance/PerformanceCard.tsx` — 要確認

---

## 2. タスク分割（2 並列エージェント）

### Agent A: Globe Integration + Interaction
**担当ファイル:**
- `src/components/map/GlobeView.tsx`
- `src/components/calendar/CalendarSidebar.tsx`
- `src/app/page.tsx`
- `src/components/hero/HeroSection.tsx`

### Agent B: Brand + Conversion + SEO
**担当ファイル:**
- `src/app/companies/[slug]/page.tsx`
- `src/app/partners/page.tsx`（新規）
- `src/components/modals/PerformanceModal.tsx`
- `src/components/layout/Navbar.tsx`
- `src/components/performance/PerformanceCard.tsx`

**競合なし** — 並列実行可能

---

## 3. Agent A 詳細 — Globe Integration

### 3.1 Globe ↔ Calendar 双方向連携
- CalendarSidebar に `onCountryChange(country: string | null)` callback prop 追加
- page.tsx で `selectedCountry` state 管理
- `GlobeView` に `focusCountry` prop 追加 → 国の company の lat/lng 中心へ camera fly

### 3.2 Camera Fly-To Animation
```typescript
// GlobeView 内: focusCountry 変更時
// 1. 該当国の company 群の lat/lng 平均を算出
// 2. camera position を GSAP で 1.5s かけて移動
gsap.to(camera.position, {
  duration: 1.5,
  x: targetX, y: targetY, z: targetZ,
  ease: 'power2.inOut',   // ballet movement の grace
  onUpdate: () => camera.lookAt(0, 0, 0),
})
```
- Easing: `power2.inOut`（dancer の flow を表現）
- 国未選択時: camera デフォルト位置 `[0, 0, 5]` へ戻る

### 3.3 Marker Highlight
- `GlobeView` に `highlightedDate` prop（または highlightedCompanyIds）
- 該当 company マーカー: `emissiveIntensity` 増加 + scale 拡大 + pulse
- 非該当: 通常表示

### 3.4 Drag Interaction
- `OrbitControls`: `enableRotate={true}`（ドラッグ回転）, `enableZoom={false}` 維持
- ユーザードラッグ中は Globe mesh の auto-rotation を一時停止
- ドラッグ終了後、数秒で auto-rotation 再開（slow)

### 3.5 White Gradient 修正
- GlobeView ツールチップ（line 132-141）: `bg-[#0A0A0A]/90` → `bg-white/95`, `border-[#C9A961]/30` → `border-[#1A1A1A]/08`, text を `#1A1A1A` 系へ
- Globe sphere color: 現状 `#111111` → White デザインに合わせ調整可（`#1B2A4A` navy など、Design Director 判断）

### 3.6 Verification
- [ ] CalendarSidebar で国選択 → globe がその国へ滑らかに移動
- [ ] 日付選択 → 該当マーカーが glow
- [ ] マウスドラッグで地球儀が回転
- [ ] ツールチップが White デザイン

---

## 4. Agent B 詳細 — Brand + Conversion + SEO

### 4.1 companies/[slug]/page.tsx — White Gradient + Storytelling
**色移行（Day 6 と同パレット）:**
- `bg-[#0A0A0A]` → White gradient (`linear-gradient(135deg, #FFFFFF 0%, #F5F0EA 100%)`)
- `text-[#C9A961]` → `text-[#D4AF37]`
- `text-white/50` → `text-[#1A1A1A]/60`
- `border-white/5` → `border-[#1A1A1A]/08`
- Navbar 部分: 共通 Navbar コンポーネントへ統一を検討（または White 化）

**Storytelling 強化:**
- Hero に `company.hero_image` を背景使用（存在時）— subtle parallax / Ken Burns 効果
- description を「Why watch this company?」narrative として強調表示
- founded_year → "100+ years of heritage" のような heritage 訴求
- accent color: company ごとに navy/forest/purple/gold ローテーション

### 4.2 partners/page.tsx（新規）— Affiliate Partners
- ルート: `/partners`
- White Gradient デザイン
- 提携先カテゴリ: "Ticketing Partners"（Royal Ballet, Paris Opéra, Bolshoi, Met Opera 等）, "Travel Partners"（航空券）
- 各 partner: ロゴ枠（プレースホルダ可）+ 名称 + 説明
- 信頼性メッセージ: "Official ticketing through verified partners"
- transparent affiliate disclosure（"We may earn a commission" 等の正直な開示）

### 4.3 PerformanceModal.tsx — Ticket CTA 最適化
- "Book Tickets" CTA: gold (`#D4AF37`) filled, white text, prominent
- `performance.affiliate_url` 優先 → なければ `ticket_url`
- `rel="noopener noreferrer"`, `target="_blank"`
- hover: scale-[1.03] + shadow
- `price_range` 表示（存在時）— "From £XX" 形式
- mobile: full-width CTA

### 4.4 Navbar.tsx — Partners リンク追加
- 既存リンク（Map, Companies）に "Partners" 追加 → `/partners`
- 同じスタイル

### 4.5 SEO Structured Data (JSON-LD)
- company 詳細ページ: `<script type="application/ld+json">` で `schema.org/Organization`（PerformingGroup）
- performances: `schema.org/TheaterEvent` または `PerformingArtsEvent`
  - name, startDate, location, performer, offers（ticket_url, price_range）
- Next.js App Router: server component で JSON-LD を `<script>` として埋め込み

### 4.6 Verification
- [ ] company 詳細ページが White Gradient
- [ ] hero_image が表示される（存在時）
- [ ] /partners ページが表示される
- [ ] Navbar に Partners リンク
- [ ] Performance modal の CTA が gold filled
- [ ] JSON-LD が DevTools で確認できる（valid schema）

---

## 5. Animation Standard — Purposeful Depth (2026 Award)

| Tier | 内容 |
|---|---|
| Tier 1 Functional | Globe camera fly, marker highlight, modal entrance |
| Tier 2 Storytelling | Hero parallax, section reveal（袖から現れる）|
| Tier 3 Distinctive | Globe drag interaction, ballet-rhythm easing |

**禁止:** 意味のない flash アニメーション。すべての動きは機能 or storytelling を支えること。

---

## 6. Performance & Quality

```bash
npm run build   # 0 TypeScript errors 必須
```
- First Load JS < 150kB 維持
- Lighthouse: Performance 90+, SEO 95+, Accessibility 88+（Day 9 で最終 audit）

---

## 7. Bar Raiser Final Checklist

- [ ] Globe ↔ Calendar 連携動作
- [ ] Globe ドラッグ操作可能
- [ ] company 詳細ページ White Gradient 完全移行
- [ ] /partners ページ公開
- [ ] Ticket CTA gold filled + affiliate link
- [ ] JSON-LD structured data valid
- [ ] Mobile 375px 水平スクロールなし
- [ ] 0 TypeScript errors

---

## 8. Day 8 Completion Report

`reports/day-08-report.md` — **英語 + 日本語のバイリンガル必須**（CLAUDE.md 規定）

---

## 9. Workflow

```
CEO (this briefing)
↓
Design Director (approval)
↓
Frontend Engineer A + B (parallel, Opus 4.7)
↓
Code Reviewer (LGTM)
↓
Bar Raiser (GO)
↓
SRE (git push → Vercel)
↓
CEO (bilingual Day 8 report)
```

---

**Ready for Day 8 execution.**
