# DAY 6 BRIEFING — White Gradient Design Migration + Animation Enhancement
# World Ballet & Opera Calendar
# Agent: CEO → Design Director → Frontend Engineer → Code Reviewer → Bar Raiser → SRE

---

## 0. CEO Agent への指示

**DRI: Frontend Engineer Agent（Design Director が並走）**
**Final Gate: Bar Raiser Agent**

### Working Backwards（Bezos Method）
今日が終わった時点でユーザーが得るもの：
- **White Gradient Luxury デザイン** — Art Deco 紺黒から、立体感ある白グラデーションへ完全移行
- **金・紺・深緑・紫のアクセントカラー** — カードとレイアウトに品格を与える多色アクセント
- **スクロール位置バグ修正** — ページロード時に必ず最上部から表示
- **全セクション reveal アニメーション** — IntersectionObserver ベースのスタガーアニメーション
- **カードホバーエフェクト強化** — scale + shadow + accent bar (gradient)
- **カレンダーサイドバー ライトモード対応** — 白背景に統一
- **ローダーコンポーネント ライトモード対応** — 白背景でのエレガントな表示

---

## 1. 前提確認（Day 5 成果物）

```bash
git log --oneline | head -5
npm run build
```

✅ Day 5 完了状態:
- ProjectNameLoader (GSAP 4 秒アニメーション)
- CalendarSidebar (国・タイプフィルター + 2026 カレンダーグリッド)
- /api/performances エンドポイント
- Art Deco 色システム (#2a2a3e 紺黒ベース)

---

## 2. Design Director 指定作業 — White Gradient Luxury

### Color System Migration: Art Deco → White Gradient

**Design Director への指示（デザイン用語）:**

> **White Gradient Architecture への移行**
>
> **Primary Palette:**
> - Base: Warm White `#FAFAF8` / Pure White `#FFFFFF`
> - Gradient Foundation: `linear-gradient(135deg, #FFFFFF 0%, #F5F0EA 100%)` — 温かみある立体感
> - Gold Accent: `#D4AF37` (Art Deco から継続)
> - Navy Accent: `#1B2A4A` — カードホバーのアクセントバー
> - Forest Accent: `#1A3A2E` — セカンダリーカード
> - Purple Accent: `#2D1B4E` — ターシャリーカード
> - Text Primary: `#1A1A1A` (near-black)
> - Text Secondary: `rgba(26,26,26,0.6)`
>
> **Depth Technique:**
> - Hero: Radial gradient gold warmth + linear gradient falloff
> - Cards: Gradient surface `linear-gradient(145deg, #FFFFFF 0%, #FAF8F5 100%)`
> - Hover: `shadow-card-hover` (box-shadow 多層)
> - Backdrop: `rgba(255,255,255,0.15) backdrop-blur` — 透明モーダル
>
> **Elevation System:**
> - Level 0 (base): `#FAFAF8`
> - Level 1 (section alt): `#FAF8F5`
> - Level 2 (cards): `#FFFFFF` with `shadow-card`
> - Level 3 (hover/active): `shadow-card-hover` + scale

**Tier 1 Checklist:**
- [ ] すべてのページ背景が白グラデーション
- [ ] テキストが `#1A1A1A` — コントラスト比 WCAG AA 以上
- [ ] 金色 `#D4AF37` のみアクセントに使用
- [ ] モバイル 375px: 水平スクロールなし

**Tier 2 Checklist:**
- [ ] ホバー状態: 300ms 以上の transition
- [ ] カードのアクセントバー (top 3px) — 会社ごとに色ローテーション
- [ ] 補助テキスト opacity 段階 (60%, 40%, 30%)
- [ ] Border: `rgba(26,26,26,0.08)` のみ（no cream palette）

**Tier 3 Checklist:**
- [ ] スクロール reveal アニメーション (IntersectionObserver)
- [ ] カード hover: 1.02x scale + shadow increase
- [ ] Footer: `#FAF8F5` 背景

---

## 3. Scroll Position Bug Fix

**症状:** ページ初回ロード時、スクロール位置が最下部または中間から始まる

**原因:** ブラウザのスクロール位置復元 (scroll restoration) との競合

**修正:**
```typescript
// src/components/hero/HeroSection.tsx
useEffect(() => {
  window.scrollTo({ top: 0, behavior: 'instant' })
  // ... rest of GSAP animation
}, [])
```

```css
/* globals.css */
html {
  scroll-padding-top: 80px;
  /* Remove scroll-behavior: smooth from here */
}
```

**Verification:**
- [ ] ページリロード → 必ず Hero section が最上部に表示
- [ ] ブラウザ「戻る」ボタン → 最上部に戻る
- [ ] スムーズスクロールはアンカーリンク (#map, #companies) のみで機能

---

## 4. Micro-Interaction Enhancement

**Card Hover:**
```css
/* Top accent bar (gradient per company) */
.card-accent-bar {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  opacity: 0;
  transition: opacity 300ms;
}
.card:hover .card-accent-bar { opacity: 1; }

/* Scale + shadow */
.card:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 40px rgba(26,26,26,0.14);
}
```

**Section Reveal (IntersectionObserver):**
```css
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.7s, transform 0.7s;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

**Stagger delay:** each `.reveal` gets `transitionDelay` of 0.1s increments

---

## 5. CalendarSidebar Light Mode

**カラー変更マッピング:**

| Before (Dark) | After (Light) |
|---|---|
| `bg-[#2a2a3e]` | `bg-white` |
| `bg-[#3a3a4e]` | `bg-[#FAF8F5]` |
| `border-[#E8D5B7]/15` | `border-[#1A1A1A]/08` |
| `text-[#E8D5B7]` | `text-[#1A1A1A]` |
| `text-[#E8D5B7]/60` | `text-[#1A1A1A]/50` |
| `text-[#E8D5B7]/40` | `text-[#1A1A1A]/30` |
| `text-[#E8D5B7]/30` | `text-[#1A1A1A]/20` |
| `bg-[#D4AF37] text-[#2a2a3e]` | `bg-[#D4AF37] text-white` |

**Gold accents maintained:** `text-[#D4AF37]`, `border-[#D4AF37]`, `shadow-gold-glow`

---

## 6. ProjectNameLoader Light Mode

**変更点:**
- 背景: `rgba(255,255,255,0.98)` (ほぼ不透明白)
- テキスト: `text-[#1A1A1A]` (黒)
- サブテキスト: `text-[#D4AF37]` (金色バッジ)
- Animation: 同じ GSAP timeline を維持

---

## 7. Performance Targets

```bash
npm run build
# First Load JS < 150kB
```

**Lighthouse Targets:**
- Performance: 90+
- SEO: 95+
- Accessibility: 88+

---

## 8. Bar Raiser Final Checklist

**All Criteria:**
- Tier 1: Color, contrast, mobile, security
- Tier 2: Padding (p-6+), hover, typography hierarchy, borders
- Tier 3: Animations, gradients, scroll reveal, accents
- Performance: Lighthouse 90+
- Code: 0 TypeScript errors

---

## 9. Day 6 Completion Report

`reports/day-06-report.md` に以下を含める:

```markdown
# Day 6 Report — White Gradient Design Migration

**Status:** ✅ COMPLETE
**URL:** https://worldballetoperacalender.vercel.app

## Implemented
- [ ] White gradient color system deployed
- [ ] Scroll position bug fixed
- [ ] Section reveal animations
- [ ] Card accent bar rotation
- [ ] CalendarSidebar light mode
- [ ] ProjectNameLoader light mode
- [ ] Footer gradient
```

---

## 10. Workflow Summary

```
CEO (this briefing)
↓
Design Director (color architecture approval)
↓
Frontend Engineer (implementation)
↓
Code Reviewer (LGTM)
↓
Bar Raiser (GO decision)
↓
SRE (git push → Vercel deploy)
↓
CEO (Day 6 report)
```

---

**Ready for Day 6 execution.**
