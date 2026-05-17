# DAY 7 BRIEFING — Performance Modal + Calendar Interaction
# World Ballet & Opera Calendar
# Agent: CEO → Design Director → Frontend Engineer → Code Reviewer → Bar Raiser → SRE

---

## 0. CEO Agent への指示

**DRI: Frontend Engineer Agent（Design Director が並走）**
**Final Gate: Bar Raiser Agent**

### Working Backwards（Bezos Method）
今日が終わった時点でユーザーが得るもの：
- **月別カレンダー表示** — サイドバーで月ごとにカレンダーを展開表示
- **日付クリック → パフォーマンスモーダル pop up** — その日の公演が立体的に表示される
- **3D Card Effect** — scale + shadow + gradient で奥行き表現
- **Blur Backdrop** — Modal 背後が透明/ブラー
- **Smooth Animation** — entrance (scale: 0.95 → 1.0) + exit (1.0 → 0.95)
- **公演情報表示** — タイトル、時間、会社名、チケットリンク

---

## 1. 前提確認（Day 6 成果物）

✅ Day 6 完了状態:
- White Gradient Luxury デザイン全展開
- スクロール位置バグ修正
- CalendarSidebar ライトモード対応
- Section reveal アニメーション
- Navbar scroll-linked styling

---

## 2. Design Director 指定作業

### Performance Modal Design Specification

**Design Director への指示（デザイン用語）:**

> **"Performance Detail Modal" — 3D Luxury Card Presentation**
>
> **Backdrop:**
> - `rgba(26,26,26,0.4)` semi-transparent dark overlay
> - `backdrop-filter: blur(4px)` — subtle glass morphism
> - Fixed positioning, z-index 60 (above sidebar z-40)
>
> **Card Container:**
> - Background: `linear-gradient(145deg, #FFFFFF 0%, #FAF8F5 100%)`
> - Rounded: `rounded-lg` (8px)
> - Elevation: `shadow-[0 20px 80px rgba(26,26,26,0.25)]`
> - Max-width: `md:max-w-2xl` (tablet+ centered)
> - Mobile: 90vw width, full viewport height scrollable
>
> **Entrance Animation:**
> - Scale: `0.92 → 1.0` (300ms)
> - Opacity: `0 → 1` (300ms)
> - Easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` (slight overshoot bounce)
>
> **Exit Animation:**
> - Scale: `1.0 → 0.92` (200ms)
> - Opacity: `1 → 0` (200ms)
> - Easing: `ease-out`
>
> **Content Layout:**
> - Top 2px accent bar: match card's company color (`navy` / `forest` / `purple`)
> - Title: serif 32px, `#1A1A1A`, font-light
> - Company name: gold badge, `text-[10px] tracking-widest uppercase`
> - Performance date/time: `#1A1A1A/60`, small
> - Description: `#1A1A1A/50`, leading-relaxed
> - CTA button: gold background, white text, hover scale
>
> **Close Behavior:**
> - Close button (X): top-right, `#1A1A1A/40` hover `#1A1A1A/80`
> - Backdrop click: also closes modal
> - Escape key: closes modal
>
> **Mobile Responsive:**
> - 375px: full-width, centered, no horizontal overflow
> - Scrollable content if exceeds viewport

---

## 3. Performance Modal Component

**ファイル:** `src/components/modals/PerformanceModal.tsx`

**Props:**
```typescript
interface PerformanceModalProps {
  isOpen: boolean
  onClose: () => void
  performance: Performance | null
  accentColor?: string // 'navy' | 'forest' | 'purple' | 'gold'
}
```

**Behavior:**
1. `isOpen = true` → GSAP timeline plays entrance animation
2. Backdrop click → trigger exit animation → onClose() callback
3. Escape key → same as backdrop
4. `performance` null → modal stays hidden
5. `performance` object → display details

**Content Zones:**
- Header: accent bar (2px top) + close button
- Title: performance.title (serif 32px)
- Metadata: company name + date + time
- Description: performance.description or company description
- CTA: "View Tickets" / "Book Now" button → performance.booking_url

---

## 4. CalendarSidebar Enhanced

**変更点:**

### Before (Day 6)
- 12 ヶ月一覧表示
- 全月が常に visible

### After (Day 7)
- デフォルト: 現在の月（May 2026）のみ expanded 表示
- 他の月: collapsed state (月名のみ)
- 月名クリック → 当月を expanded/collapsed toggle
- Expand state で日付グリッド表示 + gold highlights
- 日付クリック → date を parent component へ callback + modal open signal

**UI Changes:**
- Monthly headers: `cursor-pointer hover:text-[#D4AF37]` transition
- Collapsed month: `h-8` (月名のみ表示)
- Expanded month: full calendar grid (animation: max-height 300ms)
- Active month: accent bottom border `border-b-2 border-[#D4AF37]`

---

## 5. Page Component Integration

**`src/app/page.tsx` 変更:**

1. State: `selectedPerformance` (Performance | null) + `isModalOpen` (boolean)
2. CalendarSidebar callback: `onDateSelected(dateStr)` → fetch performances for that date
3. Modal component: `<PerformanceModal isOpen={isModalOpen} onClose={...} performance={selectedPerformance} />`
4. fetch `/api/performances?start_date=2026-05-10&end_date=2026-05-10&country=XX&type=YY`
5. If results: set first performance as `selectedPerformance`, open modal
6. If no results: show toast/notification "No performances on this date"

---

## 6. API Endpoint Enhancement

**`/api/performances` — Already exists, just verify:**
- Query: `start_date`, `end_date`, `country`, `type`
- Filter by date range correctly
- Return ordered by start_date ASC

No changes needed — already implemented in Day 5.

---

## 7. Micro-Interactions

**Modal Entrance (GSAP timeline):**
```typescript
const tl = gsap.timeline()
tl.fromTo(backdropRef.current,
  { opacity: 0 },
  { opacity: 1, duration: 0.3, ease: 'power2.out' }
)
.fromTo(modalCardRef.current,
  { opacity: 0, scale: 0.92 },
  { opacity: 1, scale: 1.0, duration: 0.3, ease: 'back.out(1.5)' },
  0
)
```

**Modal Exit:**
```typescript
gsap.timeline()
  .to(modalCardRef.current, { opacity: 0, scale: 0.92, duration: 0.2 })
  .to(backdropRef.current, { opacity: 0, duration: 0.2 }, 0)
  .add(() => onClose(), 0)
```

**Keyboard Event:**
```typescript
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) handleClose()
  }
  window.addEventListener('keydown', handleEscape)
  return () => window.removeEventListener('keydown', handleEscape)
}, [isOpen])
```

---

## 8. Performance Targets

```bash
npm run build
```

**Lighthouse Targets:**
- Performance: 90+ (modal lazy-loaded via dynamic import)
- SEO: 95+
- Accessibility: 88+ (ARIA labels, focus management)

---

## 9. Bar Raiser Final Checklist

- [ ] Modal opens on date click
- [ ] Entrance animation smooth (scale + opacity)
- [ ] Backdrop blur effect visible
- [ ] Close button works + Escape key works + backdrop click works
- [ ] Performance details display correctly
- [ ] Mobile: no overflow at 375px
- [ ] Calendar month collapse/expand works
- [ ] No TypeScript errors
- [ ] Lighthouse 90+

---

## 10. Day 7 Completion Report

`reports/day-07-report.md`:

```markdown
# Day 7 Report — Performance Modal + Calendar Interaction

**Status:** ✅ COMPLETE
**URL:** https://worldballetoperacalender.vercel.app

## Implemented
- [ ] PerformanceModal component (3D entrance/exit)
- [ ] CalendarSidebar month expand/collapse
- [ ] Date click → modal open
- [ ] Performance details display
- [ ] Keyboard + backdrop close
- [ ] Mobile responsive (375px)
- [ ] Lighthouse 90+
```

---

**Ready for Day 7 execution.**
