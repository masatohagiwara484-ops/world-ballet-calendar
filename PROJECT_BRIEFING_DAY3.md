# DAY 3 BRIEFING — Company Pages + Map Enhancement
# World Ballet & Opera Calendar
# Agent: CEO → Frontend Engineer → Design Director → Code Reviewer → SRE

---

## 0. CEO Agent への指示

**DRI: Frontend Engineer Agent**
**Review: Design Director → Code Reviewer → SRE**

### Working Backwards（Bezos Method）
今日が終わった時点でユーザーが得るもの：
- マップのマーカーをクリック → `/companies/royal-ballet` のような
  カンパニー専用ページに遷移できる
- カンパニーページには：会社概要・今後の公演リスト・Instagram/公式サイトへのリンク
- 公演カードには Booking.com アフィリエイトリンク（ホテル検索）が埋め込まれている
- 地図はより美しく・インタラクティブになっている
- モバイルでも完璧に表示される

---

## 1. 前提確認

```bash
# Day 2 の成果物確認
ls src/app/api/companies/route.ts
ls src/app/api/companies/[slug]/route.ts
ls src/lib/supabase.ts
ls data/seed_companies.ts

# API が正常に動作するか確認
curl http://localhost:3000/api/companies | head -c 200
```

---

## 2. エージェント定義を追加

**`.claude/agents/frontend_engineer.md`:**
```markdown
# Frontend Engineer Agent

## Role
UI実装、アニメーション、インタラクティブ地図、3D表現

## Responsibilities
- Next.js コンポーネント実装（App Router）
- GSAP / Framer Motion アニメーション
- Three.js 3D実装
- Leaflet インタラクティブ地図
- レスポンシブデザイン（Mobile First）
- Lighthouse Performance 90+

## Design Standard
- Apple/Ferrari/Rolex 品質
- Black/White/Gold カラーパレット
- 0.8秒以上のイージング（急がない）
- 余白の贅沢な使い方（詰め込み禁止）

## Must Pass
- Design Director のデザインレビュー
- Code Reviewer の LGTM
```

**`.claude/agents/design_director.md`:**
```markdown
# Design Director Agent

## Role
ビジュアル品質の最高責任者（Apple Jony Ive model）

## Design Checklist（全ページに適用）
- [ ] Playfair Display が見出しに使用されているか
- [ ] 余白が十分か（padding 最低 24px）
- [ ] Gold (#C9A961) がアクセントとして機能しているか
- [ ] 文字サイズの対比が強いか（大 vs 小）
- [ ] モバイルでレイアウトが崩れていないか
- [ ] アニメーションが 0.8s 以上か
- [ ] 背景が真の黒 (#0A0A0A) か
- [ ] テキストが読みやすいコントラストか

## Veto Power: YES

## Output
- 承認（LGTM）
- 差し戻し + スクリーンショット付き修正指示
```

---

## 3. カンパニー詳細ページを実装

### 3-1. カンパニーページ本体
`src/app/companies/[slug]/page.tsx`：

```typescript
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import PerformanceCard from '@/components/performance/PerformanceCard'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  const { data } = await supabase
    .from('companies')
    .select('slug')
    .eq('is_active', true)

  return (data ?? []).map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Props) {
  const { data } = await supabase
    .from('companies')
    .select('name, description_short, city, country')
    .eq('slug', params.slug)
    .single()

  if (!data) return {}

  return {
    title: `${data.name} — World Ballet & Opera Calendar`,
    description: data.description_short,
    openGraph: {
      title: data.name,
      description: data.description_short,
    },
  }
}

export default async function CompanyPage({ params }: Props) {
  const today = new Date().toISOString().split('T')[0]

  const { data: company, error } = await supabase
    .from('companies')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (error || !company) notFound()

  const { data: performances } = await supabase
    .from('performances')
    .select('*')
    .eq('company_id', company.id)
    .gte('start_date', today)
    .order('start_date')

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      {/* ナビゲーション */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 bg-[#0A0A0A]/80 backdrop-blur-sm border-b border-white/5">
        <Link href="/" className="text-[#C9A961] text-xs tracking-[0.3em] uppercase hover:opacity-70 transition-opacity">
          ← World Calendar
        </Link>
        <span className="text-white/30 text-xs tracking-widest uppercase">
          {company.type} · {company.city}
        </span>
      </nav>

      {/* ヒーローセクション */}
      <section className="pt-24 pb-20 px-8 md:px-16 lg:px-24 border-b border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div>
              <p className="text-[#C9A961] text-xs tracking-[0.3em] uppercase mb-4">
                {company.country} · Est. {company.founded_year}
              </p>
              <h1 className="font-serif text-5xl md:text-7xl font-light leading-tight mb-6">
                {company.name}
              </h1>
              {company.name_local && company.name_local !== company.name && (
                <p className="text-white/30 text-lg font-light">
                  {company.name_local}
                </p>
              )}
            </div>

            {/* 外部リンク */}
            <div className="flex gap-4">
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 border border-[#C9A961] text-[#C9A961] text-xs tracking-widest uppercase hover:bg-[#C9A961]/10 transition-all duration-300"
                >
                  Official Site
                </a>
              )}
              {company.instagram && (
                <a
                  href={`https://instagram.com/${company.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 border border-white/20 text-white/60 text-xs tracking-widest uppercase hover:border-white/40 transition-all duration-300"
                >
                  Instagram
                </a>
              )}
            </div>
          </div>

          {/* 説明文 */}
          {company.description && (
            <p className="mt-10 text-white/50 text-base leading-relaxed max-w-3xl font-light">
              {company.description}
            </p>
          )}
        </div>
      </section>

      {/* 公演セクション */}
      <section className="py-20 px-8 md:px-16 lg:px-24">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-baseline justify-between mb-12">
            <h2 className="font-serif text-3xl font-light">
              Upcoming Performances
            </h2>
            <span className="text-white/30 text-sm">
              {performances?.length ?? 0} scheduled
            </span>
          </div>

          {performances && performances.length > 0 ? (
            <div className="grid gap-6">
              {performances.map((perf) => (
                <PerformanceCard
                  key={perf.id}
                  performance={perf}
                  companyCity={company.city}
                  companyCountry={company.country}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border border-white/5">
              <p className="text-white/30 text-sm tracking-widest uppercase">
                No upcoming performances scheduled
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
```

### 3-2. PerformanceCard コンポーネント
`src/components/performance/PerformanceCard.tsx`：

```typescript
'use client'

import type { Performance } from '@/lib/supabase'

interface Props {
  performance: Performance
  companyCity: string
  companyCountry: string
}

export default function PerformanceCard({ performance, companyCity, companyCountry }: Props) {
  const startDate = new Date(performance.start_date)
  const endDate = performance.end_date ? new Date(performance.end_date) : null

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  // Booking.com アフィリエイトリンク生成
  const bookingUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(companyCity)}&checkin=${performance.start_date}&checkout=${performance.end_date ?? performance.start_date}&aid=YOUR_AFFILIATE_ID`

  return (
    <article className="group border border-white/5 p-8 hover:border-[#C9A961]/30 transition-all duration-500 bg-white/[0.01] hover:bg-white/[0.03]">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        {/* 公演情報 */}
        <div className="flex-1">
          {performance.is_featured && (
            <span className="inline-block mb-3 px-3 py-1 bg-[#C9A961]/15 text-[#C9A961] text-[10px] tracking-[0.2em] uppercase">
              Featured
            </span>
          )}
          
          <h3 className="font-serif text-2xl font-light mb-2 group-hover:text-[#C9A961] transition-colors duration-300">
            {performance.title}
          </h3>
          
          {performance.composer && (
            <p className="text-white/40 text-sm mb-1">
              {performance.composer}
              {performance.choreographer && ` · Choreography: ${performance.choreographer}`}
            </p>
          )}
          
          {performance.venue && (
            <p className="text-white/30 text-sm mt-3">
              {performance.venue}
            </p>
          )}
        </div>

        {/* 日付 + アクション */}
        <div className="md:text-right">
          <div className="mb-4">
            <p className="text-white text-sm font-medium">
              {formatDate(startDate)}
            </p>
            {endDate && (
              <p className="text-white/40 text-xs mt-1">
                — {formatDate(endDate)}
              </p>
            )}
          </div>

          {performance.price_range && (
            <p className="text-[#C9A961] text-xs tracking-wider mb-4">
              {performance.price_range}
            </p>
          )}

          <div className="flex flex-col gap-2">
            {performance.ticket_url && (
              <a
                href={performance.ticket_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-[#C9A961] text-[#0A0A0A] text-xs tracking-widest uppercase hover:bg-[#D4B870] transition-all duration-300 text-center font-medium"
              >
                Book Tickets
              </a>
            )}
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 border border-white/10 text-white/40 text-xs tracking-widest uppercase hover:border-white/30 hover:text-white/60 transition-all duration-300 text-center"
            >
              Find Hotels in {companyCity}
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}
```

---

## 4. WorldMap のポップアップからカンパニーページへリンク

`src/components/map/WorldMap.tsx` の Popup を更新：

```typescript
// Popup 内のリンクを更新
<Popup>
  {/* ... 既存のスタイル ... */}
  <a
    href={`/companies/${company.slug}`}
    style={{ color: '#C9A961', textDecoration: 'none', fontSize: '12px' }}
  >
    View performances →
  </a>
</Popup>
```

---

## 5. ホームページのカンパニーカードセクションを追加

`src/app/page.tsx` に Companies Preview セクションを追加：

```typescript
// Supabase からデータ取得（Server Component として）
// page.tsx を Server Component に変更してトップ4社を表示

import { supabase } from '@/lib/supabase'

// ページ下部にカンパニーカードグリッドを追加
const { data: featuredCompanies } = await supabase
  .from('companies')
  .select('*')
  .eq('is_active', true)
  .limit(4)

// JSX
<section className="py-20 px-8 bg-black">
  <div className="max-w-7xl mx-auto">
    <h3 className="font-serif text-4xl font-light mb-3">Companies</h3>
    <p className="text-white/40 text-sm mb-12">Select a company to explore their season</p>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5">
      {featuredCompanies?.map(company => (
        <a
          key={company.id}
          href={`/companies/${company.slug}`}
          className="group bg-[#0A0A0A] p-10 hover:bg-white/[0.02] transition-all duration-500"
        >
          <p className="text-[#C9A961] text-[10px] tracking-[0.3em] uppercase mb-4">
            {company.type} · {company.country}
          </p>
          <h4 className="font-serif text-2xl font-light mb-3 group-hover:text-[#C9A961] transition-colors duration-300">
            {company.name}
          </h4>
          <p className="text-white/30 text-sm leading-relaxed line-clamp-2">
            {company.description_short}
          </p>
          <div className="mt-6 flex items-center gap-2">
            <span className="text-white/20 text-xs tracking-widest uppercase">
              Est. {company.founded_year}
            </span>
            <span className="ml-auto text-[#C9A961] text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Explore →
            </span>
          </div>
        </a>
      ))}
    </div>
  </div>
</section>
```

---

## 6. 404 ページ

`src/app/not-found.tsx`：

```typescript
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-8">
      <div className="text-center">
        <p className="text-[#C9A961] text-xs tracking-[0.3em] uppercase mb-6">404</p>
        <h1 className="font-serif text-5xl font-light mb-6">Page not found</h1>
        <p className="text-white/30 mb-10">The performance has left the stage.</p>
        <Link
          href="/"
          className="px-8 py-3 border border-[#C9A961] text-[#C9A961] text-xs tracking-widest uppercase hover:bg-[#C9A961]/10 transition-all duration-300"
        >
          Return to Calendar
        </Link>
      </div>
    </div>
  )
}
```

---

## 7. Leaflet CSS の Popup スタイル調整

`src/app/globals.css` に追加：

```css
/* Leaflet popup のラグジュアリースタイル */
.leaflet-popup-content-wrapper {
  background: #0A0A0A !important;
  color: #FAFAF8 !important;
  border: 1px solid rgba(201, 169, 97, 0.2) !important;
  border-radius: 0 !important;
  box-shadow: 0 8px 40px rgba(0,0,0,0.8) !important;
  padding: 0 !important;
}

.leaflet-popup-content {
  margin: 0 !important;
}

.leaflet-popup-tip-container {
  display: none;
}

.leaflet-popup-close-button {
  color: rgba(255,255,255,0.3) !important;
  font-size: 18px !important;
  top: 8px !important;
  right: 8px !important;
}

/* マーカーホバー */
.leaflet-marker-icon:hover div {
  transform: scale(1.3);
  box-shadow: 0 0 16px rgba(201, 169, 97, 0.8) !important;
}
```

---

## 8. Design Director レビューチェックリスト

```
[ ] Playfair Display が全見出しに適用されているか
[ ] Gold (#C9A961) がアクセントとして正しく使われているか
[ ] hover 状態が全インタラクティブ要素に実装されているか
[ ] 余白が十分で「詰まった」感がないか
[ ] モバイル（375px）でレイアウトが崩れていないか
[ ] "Book Tickets" ボタンが Gold で目立つか
[ ] "Find Hotels" リンクが目立ちすぎず補助的か（アフィリエイト）
[ ] テキストのコントラスト比が 4.5:1 以上か
```

---

## 9. Code Reviewer チェックリスト

```
[ ] generateStaticParams が実装されているか
[ ] generateMetadata が全ページに実装されているか
[ ] Server Component / Client Component の使い分けが正しいか
[ ] アフィリエイトリンクに rel="noopener noreferrer" があるか
[ ] Supabase クエリのエラーハンドリングがあるか
[ ] notFound() が適切に呼ばれているか
[ ] npm run build が通るか
```

---

## 10. SRE Agent — デプロイ

```bash
npm run build
vercel --prod
```

デプロイ後に確認：
```
[ ] /companies/royal-ballet が表示される
[ ] /companies/paris-opera-ballet が表示される
[ ] 公演カードが表示される
[ ] "Book Tickets" ボタンが機能する
[ ] "Find Hotels" リンクが Booking.com に飛ぶ
[ ] モバイルで崩れていない
```

---

## 11. Day 3 完了レポート

`reports/day-03.md` を作成：

```markdown
# Day 3 Report

## Completed ✅

### Frontend Engineering (Frontend Engineer Agent)
- [ ] /companies/[slug] ページ実装
- [ ] PerformanceCard コンポーネント
- [ ] Booking.com アフィリエイトリンク（初期）
- [ ] ホームページ Companies セクション追加
- [ ] 404 ページ

### Map Enhancement
- [ ] Popup → カンパニーページへのリンク
- [ ] Leaflet popup のラグジュアリースタイル

### Design Review (Design Director Agent)
- [ ] 全ページデザインレビュー通過

### Code Review (Code Reviewer Agent)
- [ ] LGTM 取得
- [ ] SEO（generateMetadata）確認

### Deployment (SRE Agent)
- [ ] 本番 URL 動作確認

## Affiliate Setup
- [ ] Booking.com: affiliate ID を .env.local に追加予定
  BOOKING_AFFILIATE_ID=your_id

## Next Steps (Day 4)
- [ ] GSAP スクロールアニメーション
- [ ] Three.js Globe に実データのマーカーを追加
- [ ] ラグジュアリーデザインの最終仕上げ
- [ ] パフォーマンス最適化（Lighthouse 90+）
```

---

**END OF DAY 3 BRIEFING**
