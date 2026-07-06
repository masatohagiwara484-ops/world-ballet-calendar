# DAY 5 BRIEFING — Art Deco Design + Calendar + ProjectNameLoader
# World Ballet & Opera Calendar
# Agent: CEO → Design Director, Frontend Engineer → Code Reviewer → Bar Raiser → SRE

---

## 0. CEO Agent への指示

**DRI: Frontend Engineer Agent（Design Director が並走）**  
**Final Gate: Bar Raiser Agent（公開前の最終判断）**

### Working Backwards（Bezos Method）
今日が終わった時点でユーザーが得るもの：
- **Art Deco 色システム完全実装** (#2a2a3e + #E8D5B7 + #D4AF37)
- **初回訪問時にプロジェクト名がゆっくり表示される体験**（タイムトラベル感なし、エレガントなローダー）
- **右サイドバーに 2026 年カレンダー、国/タイプでフィルタ可能**
- **公演情報を日付クリックで確認可能**
- **すべてのボタン・カードに立体感（shadow + transition）**
- **Lighthouse Performance 90+、SEO 95+**
- **モバイル（375px）で完璧に対応**

---

## 1. 前提確認（Day 4 成果物）

```bash
# 確認コマンド
git log --oneline | head -5
npm run build
npm run dev  # http://localhost:3000
```

✅ Day 4 完了状態:
- Navbar (スクロール連動)
- Hero (GSAP timeline)
- Company detail pages
- Affiliate links

---

## 2. Design Director 指定作業

### Color System Migration: Art Deco Option 2

**実装済みファイル確認:**
- `tailwind.config.ts` → 新色追加済み
- `src/app/globals.css` → 新色反映済み
- `src/components/hero/HeroSection.tsx` → 色更新済み
- `src/components/layout/Navbar.tsx` → 色更新済み
- `src/app/page.tsx` → 企業カード色更新済み

**Tier 1 Checklist:**
- [ ] すべてのページ背景が `#2a2a3e`（深い紺-黒）
- [ ] 金色は `#D4AF37`（Art Deco bright）のみ使用
- [ ] クリーム `#E8D5B7` はメタデータ + 補助テキスト
- [ ] 外部リンク: `rel="noopener noreferrer"`
- [ ] モバイル 375px: 水平スクロールなし

**Tier 2 Checklist:**
- [ ] ホバー状態: 300ms 以上の transition
- [ ] CTA "Explore"/"Book Tickets": gold filled
- [ ] 補助リンク: border-only, muted
- [ ] Padding: p-6 以上（最低 24px）
- [ ] 罫線: `border-[#E8D5B7]/15` のみ（no gray palette）

**Tier 3 Checklist:**
- [ ] スクロール reveal アニメーション
- [ ] カード hover: 1.02x scale + shadow increase
- [ ] Footer border: cream color

---

## 3. ProjectNameLoader 実装

**ファイル:** `src/components/loaders/ProjectNameLoader.tsx`

**要件:**
- Font: Playfair Display (serif), 6xl-8xl, `#E8D5B7`
- Animation: `opacity: 0 → 1 (1.0s) → hold (2.5s) → 1 → 0 (0.5s)` = 4秒トータル
- Easing: `power2.inOut` (GSAP cubic-bezier equivalent)
- Trigger: 初回訪問時のみ（localStorage flag）
- Content: "World Ballet & Opera Calendar"
- After: Hero section smooth fade-in (no jank)

**GSAP Timeline Code:**
```typescript
const tl = gsap.timeline({
  onComplete: () => setShowLoader(false)
})
tl.fromTo(loaderRef.current, 
  { opacity: 0 }, 
  { opacity: 1, duration: 1.0, ease: 'power2.inOut' }
)
.to(loaderRef.current, { opacity: 1, duration: 2.5 })
.to(loaderRef.current, { opacity: 0, duration: 0.5, ease: 'power2.inOut' })
```

**Verification:**
- [ ] Dev server: 初回訪問で 4 秒表示 → 自動消失
- [ ] 2 回目訪問: ローダー表示されない（localStorage check）
- [ ] Hero section: ローダー消失後、スムーズにフェードイン
- [ ] No console errors

---

## 4. CalendarSidebar コンポーネント

**ファイル:** `src/components/calendar/CalendarSidebar.tsx`

**レイアウト:**
- 固定位置: 右側、300px 幅
- 配置: `fixed right-0 top-0 h-screen w-80 pt-24 px-6`
- デスクトップのみ: `max-xl:hidden`（モバイルで非表示）
- スクロール: 右側バーが scroll できる

**機能:**
1. **Country Dropdown**
   - API `/api/companies` から unique countries 取得
   - "All Countries" がデフォルト
   - Supabase から country リスト fetch

2. **Type Toggle**
   - `all` (default) | `ballet` | `opera`
   - 3 つのボタン、selected state = gold bg

3. **Calendar Grid (2026 のみ)**
   - 12 ヶ月、各月は 7 日 grid
   - 日付がパフォーマンスある場合: gold border + gold text
   - 選択日付: gold fill + glow shadow
   - 日付クリック: selected state

4. **Filtering Logic**
   - Country + Type を選択 → `/api/performances?country=X&type=Y&start_date=2026-01-01&end_date=2026-12-31`
   - マッチした日付に gold glow を付与
   - マッチしない日付: muted (`opacity-30`)

5. **"Clear Filters" Button**
   - Country または Type が選択されている場合のみ表示
   - クリック → リセット

**Verification:**
- [ ] Country dropdown: 4 国すべて表示
- [ ] Type toggle: ballet/opera 正確に filter
- [ ] Calendar dates: gold highlight for matching performances
- [ ] Click date: selected state visual feedback
- [ ] Mobile: sidebar 非表示 (max-xl)

---

## 5. API Endpoint: GET /api/performances

**ファイル:** `src/app/api/performances/route.ts`

**Query Params:**
- `company_id` (optional)
- `country` (optional, ISO 3166-1 alpha-2)
- `type` (optional, enum: 'ballet' | 'opera' | 'both')
- `start_date` (optional, ISO date)
- `end_date` (optional, ISO date)

**Response:**
```json
{
  "performances": [
    {
      "id": "perf-123",
      "company_id": "comp-456",
      "title": "Swan Lake",
      "country": "GB",
      "type": "ballet",
      "start_date": "2026-05-10",
      ...
    }
  ]
}
```

**Error Handling:**
- 400: Invalid query params
- 500: DB error (generic message, no details)

**Verification:**
- [ ] `/api/performances?country=GB&type=ballet` → returns matching
- [ ] `/api/performances?country=FR` → all types
- [ ] `/api/performances` → all 2026 performances
- [ ] Cursor: `↓ down arrow` on dates with performances

---

## 6. Micro-Interactions

**Card Hover:**
```css
group-hover:scale-102 group-hover:shadow-xl
transition-all duration-300
```

**Calendar Date Hover:**
- Background: `rgba(212,175,55,0.1)` (gold tint)
- Duration: 200ms
- Cursor: `pointer`

**Filter Button Press:**
- Click: scale-down 0.98x
- Release: return to 1.0x
- Active state: gold border + fill

---

## 7. Performance Optimization

**Bundle Size Check:**
```bash
npm run build
# Output: First Load JS size < 150kB target
```

**Lighthouse Targets:**
- Performance: 90+
- SEO: 95+
- Accessibility: 85+

---

## 8. Bar Raiser Final Checklist

✅ **All Criteria:**
- Tier 1: Color, typography, mobile, security
- Tier 2: Padding, hover, hierarchy, borders
- Tier 3: Animations, blur, metadata
- Performance: Lighthouse 90+ on mobile
- Code quality: 0 TypeScript errors

---

## 9. SRE Deployment

**Pre-Deployment:**
```bash
npm run build
npm run lint
git push origin main
```

**Vercel Auto-Deploy:**
- Build: ~3 minutes
- Smoke test: Check https://worldballetoperacalender.vercel.app

**Post-Deployment:**
- Lighthouse audit: `npx lighthouse https://worldballetoperacalender.vercel.app`
- Console errors: DevTools check
- Calendar filtering: Test with country + type

---

## 10. Day 5 Completion Report

`reports/day-05-report.md` に以下を含める:

```markdown
# Day 5 Report — Art Deco + Loader + Calendar

**Status:** ✅ COMPLETE
**URL:** https://worldballetoperacalender.vercel.app
**Lighthouse:** Performance [XX], SEO [XX], Accessibility [XX]

## Implemented
- [ ] Art Deco colors fully deployed
- [ ] ProjectNameLoader (4s fade animation)
- [ ] CalendarSidebar (country + type filtering)
- [ ] /api/performances endpoint
- [ ] All micro-interactions (shadow, scale, transition)

## Bar Raiser GO
- [ ] Tier 1-3 all pass
- [ ] Mobile responsive
- [ ] Zero TypeScript errors

## Next: Day 6
- Three.js Globe enhancement
- Calendar → Main content integration
```

---

## 11. Workflow Summary

```
ユーザー指示
↓
CEO Agent (this briefing)
↓
Design Director (color approval)
↓
Frontend Engineer (implementation)
↓
Code Reviewer (LGTM)
↓
Bar Raiser (GO decision)
↓
SRE (deploy)
↓
CEO (report)
```

---

**Ready for Day 5 execution.**
