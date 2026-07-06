# DAY 4 BRIEFING — Luxury Design Polish + 3D + Animations
# World Ballet & Opera Calendar
# Agent: CEO → Design Director → Frontend Engineer → Bar Raiser → SRE

---

## 0. CEO Agent への指示

**DRI: Frontend Engineer Agent（Design Director が並走）**
**Final Gate: Bar Raiser Agent（公開前の最終判断）**

### Working Backwards（Bezos Method）
今日が終わった時点でユーザーが得るもの：
- サイトを開いた瞬間に「Apple/Ferrari/Rolex と同等」だと感じるクオリティ
- スクロールするたびに要素が滑らかにフェードイン（GSAP）
- Three.js 地球儀の上に、実際のカンパニーが金のドットで光っている
- Lighthouse Performance 90+、SEO 90+、Accessibility 85+
- あらゆるデバイスで完璧に表示される
- Bar Raiser が「これは公開に値する」と判断する

---

## 1. 前提確認

```bash
# Day 3 成果物確認
ls src/app/companies/[slug]/page.tsx
ls src/components/performance/PerformanceCard.tsx
curl http://localhost:3000/api/companies | python3 -m json.tool | head -30
```

---

## 2. Bar Raiser Agent を定義

**`.claude/agents/bar_raiser.md`:**

```markdown
# Bar Raiser Agent

## Role
プロダクト全体の品質基準を守る最後の砦
（Amazon Bar Raiser + Anthropic Constitutional Review）

## Responsibilities
- 全機能の公開可否を最終判断
- 「これは Apple サイトと比べて恥ずかしくないか？」を問う
- プライバシー・法的リスクのチェック
- パフォーマンス基準の確認
- UX 基準の確認

## Launch Checklist（全て YES でなければ公開不可）
Performance:
- [ ] Lighthouse Performance: 85+
- [ ] Lighthouse SEO: 90+
- [ ] Lighthouse Accessibility: 80+
- [ ] First Contentful Paint: 2.5s 以下
- [ ] 全ページでエラーが出ていない

Design:
- [ ] モバイル（375px）で崩れていない
- [ ] タブレット（768px）で崩れていない
- [ ] デスクトップ（1440px）で美しい
- [ ] ホバー状態が全インタラクティブ要素にある
- [ ] アニメーションが滑らか（カクつきなし）

Content:
- [ ] 4社のデータが正確に表示されている
- [ ] 公演情報が表示されている
- [ ] リンクが全て機能する

Legal:
- [ ] アフィリエイトリンクに適切な disclosure がある
- [ ] 著作権表記がある
- [ ] Privacy Policy（基本的なもの）がある

## Veto Power: YES（最強権限）
## Escalation: 迷ったらユーザーに確認
```

---

## 3. GSAP スクロールアニメーション

### 3-1. GSAP プラグインのセットアップ
```bash
npm install gsap
```

`src/lib/gsap.ts` を作成：

```typescript
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export { gsap, ScrollTrigger }

// アニメーション設定
export const EASE = {
  smooth: 'power3.out',
  cinematic: 'expo.out',
  gentle: 'power1.out',
}

export const DURATION = {
  fast: 0.6,
  normal: 0.9,
  slow: 1.4,
  cinematic: 2.0,
}
```

### 3-2. ScrollReveal Hook
`src/hooks/useScrollReveal.ts` を作成：

```typescript
'use client'

import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, EASE, DURATION } from '@/lib/gsap'

export function useScrollReveal() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const el = ref.current
    gsap.fromTo(
      el,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: DURATION.normal,
        ease: EASE.smooth,
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        },
      }
    )

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill())
    }
  }, [])

  return ref
}

export function useStaggerReveal(selector: string) {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const elements = containerRef.current.querySelectorAll(selector)
    gsap.fromTo(
      elements,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: DURATION.normal,
        ease: EASE.smooth,
        stagger: 0.12,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          once: true,
        },
      }
    )

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill())
    }
  }, [])

  return containerRef
}
```

### 3-3. ヒーローセクションのアニメーション
`src/components/hero/HeroSection.tsx` を作成：

```typescript
'use client'

import { useEffect, useRef } from 'react'
import { gsap, EASE, DURATION } from '@/lib/gsap'
import dynamic from 'next/dynamic'

const GlobeView = dynamic(() => import('@/components/map/GlobeView'), {
  ssr: false,
  loading: () => <div className="h-full bg-black" />,
})

export default function HeroSection() {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLHeadingElement>(null)
  const descRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 })

    tl.fromTo(
      titleRef.current,
      { opacity: 0, y: 60 },
      { opacity: 1, y: 0, duration: DURATION.cinematic, ease: EASE.cinematic }
    )
    .fromTo(
      subtitleRef.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: DURATION.slow, ease: EASE.smooth },
      '-=1.2'
    )
    .fromTo(
      descRef.current,
      { opacity: 0 },
      { opacity: 1, duration: DURATION.normal, ease: EASE.gentle },
      '-=0.8'
    )
    .fromTo(
      ctaRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: DURATION.normal, ease: EASE.smooth },
      '-=0.5'
    )
  }, [])

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-[#0A0A0A]">
      {/* Globe Background */}
      <div className="absolute inset-0 opacity-70">
        <GlobeView />
      </div>

      {/* Gradient Overlay（下部をフェードアウト）*/}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0A0A0A] to-transparent z-10" />

      {/* Content */}
      <div className="relative z-20 text-center px-8 max-w-5xl mx-auto">
        <p className="text-[#C9A961] text-[10px] tracking-[0.5em] uppercase mb-8 opacity-80">
          The World Calendar
        </p>
        
        <h1
          ref={titleRef}
          className="font-serif text-6xl md:text-8xl lg:text-9xl font-light leading-none mb-4 opacity-0"
        >
          Every stage.
        </h1>
        
        <h2
          ref={subtitleRef}
          className="font-serif text-6xl md:text-8xl lg:text-9xl font-light leading-none mb-12 text-white/30 opacity-0"
        >
          Every season.
        </h2>

        <p
          ref={descRef}
          className="text-white/40 text-base md:text-lg font-light tracking-wide max-w-xl mx-auto mb-12 opacity-0"
        >
          Discover ballet and opera performances across<br />
          the world's greatest companies and opera houses.
        </p>

        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center opacity-0">
          <a
            href="#map"
            className="px-10 py-4 bg-[#C9A961] text-[#0A0A0A] text-xs tracking-[0.2em] uppercase font-medium hover:bg-[#D4B870] transition-colors duration-300"
          >
            Explore the Map
          </a>
          <a
            href="#companies"
            className="px-10 py-4 border border-white/20 text-white/60 text-xs tracking-[0.2em] uppercase hover:border-white/40 hover:text-white/80 transition-all duration-300"
          >
            Browse Companies
          </a>
        </div>
      </div>

      {/* スクロールインジケーター */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
        <div className="w-px h-12 bg-gradient-to-b from-[#C9A961]/50 to-transparent animate-pulse" />
        <span className="text-white/20 text-[9px] tracking-[0.3em] uppercase">Scroll</span>
      </div>
    </section>
  )
}
```

---

## 4. Three.js Globe に実データのマーカーを追加

`src/components/map/GlobeView.tsx` を完全リニューアル：

```typescript
'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef, useState, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { Company } from '@/lib/supabase'

// 緯度経度 → 3D座標変換
function latLngToXYZ(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

// 地球儀本体
function Globe() {
  const meshRef = useRef<THREE.Mesh>(null)
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setOpacity(1), 300)
    return () => clearTimeout(timer)
  }, [])

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.12
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial
        color="#111111"
        metalness={0.2}
        roughness={0.6}
        emissive="#C9A961"
        emissiveIntensity={0.04}
        transparent
        opacity={opacity}
      />
    </mesh>
  )
}

// カンパニーマーカー（金の点）
function CompanyMarker({
  company,
  onHover,
}: {
  company: Company
  onHover: (company: Company | null) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const position = useMemo(
    () => latLngToXYZ(company.lat, company.lng, 2.05),
    [company.lat, company.lng]
  )

  useFrame(() => {
    if (meshRef.current) {
      const scale = hovered ? 2.5 : 1.5
      meshRef.current.scale.setScalar(
        THREE.MathUtils.lerp(meshRef.current.scale.x, scale, 0.1)
      )
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerEnter={() => { setHovered(true); onHover(company) }}
      onPointerLeave={() => { setHovered(false); onHover(null) }}
    >
      <sphereGeometry args={[0.04, 16, 16]} />
      <meshStandardMaterial
        color={hovered ? '#FFD700' : '#C9A961'}
        emissive={hovered ? '#FFD700' : '#C9A961'}
        emissiveIntensity={hovered ? 2.0 : 0.8}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  )
}

export default function GlobeView() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [hoveredCompany, setHoveredCompany] = useState<Company | null>(null)

  useEffect(() => {
    fetch('/api/companies')
      .then(res => res.json())
      .then(data => setCompanies(data.companies ?? []))
      .catch(() => {})
  }, [])

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffffff" />
        <pointLight position={[-8, -8, -8]} intensity={0.3} color="#C9A961" />
        
        <Globe />
        
        {companies.map(company => (
          <CompanyMarker
            key={company.id}
            company={company}
            onHover={setHoveredCompany}
          />
        ))}

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          minPolarAngle={Math.PI * 0.2}
          maxPolarAngle={Math.PI * 0.8}
        />
      </Canvas>

      {/* ホバー時のツールチップ */}
      {hoveredCompany && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-[#0A0A0A]/90 border border-[#C9A961]/30 backdrop-blur-sm pointer-events-none">
          <p className="text-[#C9A961] text-[9px] tracking-widest uppercase mb-1">
            {hoveredCompany.type} · {hoveredCompany.city}
          </p>
          <p className="text-white text-sm font-light">
            {hoveredCompany.name}
          </p>
        </div>
      )}
    </div>
  )
}
```

---

## 5. ナビゲーションバー（全ページ共通）

`src/components/layout/Navbar.tsx` を作成：

```typescript
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/5'
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
        <Link href="/" className="font-serif text-lg font-light tracking-wider hover:text-[#C9A961] transition-colors duration-300">
          Ballet &amp; Opera
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/#map" className="text-white/40 text-xs tracking-widest uppercase hover:text-white/80 transition-colors duration-300">
            Map
          </Link>
          <Link href="/#companies" className="text-white/40 text-xs tracking-widest uppercase hover:text-white/80 transition-colors duration-300">
            Companies
          </Link>
          <Link
            href="/premium"
            className="px-5 py-2 border border-[#C9A961]/40 text-[#C9A961] text-xs tracking-widest uppercase hover:bg-[#C9A961]/10 transition-all duration-300"
          >
            Premium
          </Link>
        </div>
      </div>
    </nav>
  )
}
```

`src/app/layout.tsx` に Navbar を追加：
```typescript
import Navbar from '@/components/layout/Navbar'
// ...
<body>
  <Navbar />
  {children}
</body>
```

---

## 6. パフォーマンス最適化

### 6-1. next.config.js を更新
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  // 不要なログを削減
  logging: {
    fetches: { fullUrl: false },
  },
}

module.exports = nextConfig
```

### 6-2. Leaflet の dynamic import（SSR 対応）
`src/app/page.tsx` 内の WorldMap インポートを確認：
```typescript
const WorldMap = dynamic(() => import('@/components/map/WorldMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-[#0A0A0A] flex items-center justify-center">
      <div className="w-1 h-1 bg-[#C9A961] rounded-full animate-ping" />
    </div>
  ),
})
```

### 6-3. フォントの最適化
`src/app/layout.tsx`：
```typescript
import { Inter, Playfair_Display } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['400', '500', '700'],
})
```

---

## 7. SEO メタデータ（全ページ）

`src/app/layout.tsx` のメタデータを強化：

```typescript
export const metadata: Metadata = {
  title: {
    template: '%s — World Ballet & Opera Calendar',
    default: 'World Ballet & Opera Calendar',
  },
  description: 'Discover ballet and opera performances around the world. Find upcoming shows from the Royal Ballet, Paris Opéra Ballet, Bolshoi, Metropolitan Opera, and more.',
  keywords: ['ballet', 'opera', 'performances', 'calendar', 'world ballet'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'World Ballet & Opera Calendar',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
}
```

### Sitemap
`src/app/sitemap.ts`：
```typescript
import { supabase } from '@/lib/supabase'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://world-ballet-calendar.vercel.app'

  const { data: companies } = await supabase
    .from('companies')
    .select('slug, updated_at')
    .eq('is_active', true)

  const companyPages = (companies ?? []).map(c => ({
    url: `${baseUrl}/companies/${c.slug}`,
    lastModified: new Date(c.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...companyPages,
  ]
}
```

### robots.txt
`src/app/robots.ts`：
```typescript
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://world-ballet-calendar.vercel.app/sitemap.xml',
  }
}
```

---

## 8. ローディング状態

`src/app/loading.tsx`：
```typescript
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-1 h-1 bg-[#C9A961] rounded-full animate-ping" />
        <p className="text-white/20 text-xs tracking-[0.3em] uppercase">Loading</p>
      </div>
    </div>
  )
}
```

---

## 9. CSS アニメーション定義

`src/app/globals.css` に追加：

```css
/* 滑らかなスクロール */
html {
  scroll-behavior: smooth;
  scroll-padding-top: 80px;
}

/* テキスト選択 */
::selection {
  background: #C9A961;
  color: #0A0A0A;
}

/* フォーカスリング */
*:focus-visible {
  outline: 1px solid #C9A961;
  outline-offset: 2px;
}

/* カスタムスクロールバー */
::-webkit-scrollbar {
  width: 3px;
}
::-webkit-scrollbar-track {
  background: #0A0A0A;
}
::-webkit-scrollbar-thumb {
  background: #C9A961;
  border-radius: 0;
}

/* Line clamp */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* アニメーション */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-up {
  animation: fadeInUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
}
```

---

## 10. Bar Raiser — 最終公開チェック

全タスク完了後に Bar Raiser Agent が以下を確認：

```bash
# Lighthouse を CLI で実行（npm install -g lighthouse）
lighthouse https://world-ballet-calendar.vercel.app \
  --output=json \
  --output-path=reports/lighthouse-day4.json \
  --chrome-flags="--headless"
```

### Bar Raiser チェック内容

**パフォーマンス（必須）**
```
[ ] Performance: 85+
[ ] SEO: 90+
[ ] Accessibility: 80+
[ ] Best Practices: 90+
[ ] FCP < 2.5s
[ ] LCP < 4.0s
```

**ビジュアルクオリティ（必須）**
```
[ ] モバイル 375px でヒーローが美しい
[ ] タブレット 768px でレイアウトが正しい
[ ] デスクトップ 1440px で「ラグジュアリー」と感じる
[ ] 地球儀が回転してマーカーが輝いている
[ ] スクロール時にアニメーションが滑らか
```

**機能確認（必須）**
```
[ ] /companies/royal-ballet が開く
[ ] 公演カードが表示される
[ ] "Book Tickets" ボタンが機能する
[ ] "Find Hotels" が Booking.com に飛ぶ
[ ] 地図のマーカーをクリックするとポップアップが出る
[ ] ポップアップの "View performances →" が機能する
```

### Bar Raiser の GO/NO-GO 判定
全項目が OK の場合：**GO — デプロイ許可**
1つでも NG の場合：**NO-GO — Frontend Engineer に差し戻し**

---

## 11. SRE Agent — 最終デプロイ

Bar Raiser の GO 判定後のみ実行：

```bash
# 最終ビルド確認
npm run build

# 本番デプロイ
vercel --prod

# デプロイ後の確認
echo "Deployment complete"
echo "URL: https://world-ballet-calendar.vercel.app"
```

---

## 12. Day 4 完了レポート

`reports/day-04.md`：

```markdown
# Day 4 Report

## Completed ✅

### Luxury Design (Frontend + Design Director)
- [ ] GSAP ヒーローアニメーション
- [ ] ScrollTrigger フェードイン（全セクション）
- [ ] Navbar（スクロール連動）
- [ ] Three.js Globe（実データのマーカー）
- [ ] ローディング状態

### Performance (Frontend Engineer + Bar Raiser)
- [ ] Lighthouse Performance: [SCORE]
- [ ] Lighthouse SEO: [SCORE]
- [ ] Lighthouse Accessibility: [SCORE]
- [ ] next.config.js 最適化
- [ ] フォント最適化

### SEO (Growth Engineer)
- [ ] generateMetadata（全ページ）
- [ ] sitemap.xml
- [ ] robots.txt
- [ ] OGP タグ

### Bar Raiser Review
- [ ] 全チェックリスト通過
- [ ] GO 判定

### Deployment (SRE Agent)
- [ ] 本番デプロイ完了

## Final Live URL
🌐 [URL を記入]

## Lighthouse Scores
- Performance: [SCORE]
- SEO: [SCORE]
- Accessibility: [SCORE]
- Best Practices: [SCORE]

## Next Steps (Day 5+)
- [ ] CSV ファイル作成（ユーザーが担当）
- [ ] Data Scraper Agent 実装（自動データ取得）
- [ ] Google AdSense 申請
- [ ] Booking.com アフィリエイト ID 設定
- [ ] プレミアム会員機能（Stripe）
```

---

## 13. 全体ワークフロー確認

Day 4 完了後、以下の Multi-Agent ワークフローが機能していることを確認：

```
ユーザーのチャット指示
        ↓
CEO Agent（このファイルを読んでいる）
        ↓
Frontend Engineer（コード実装）
        ↓
Design Director（デザインレビュー）
        ↓
Code Reviewer（コードレビュー・LGTM）
        ↓
Bar Raiser（公開可否判断）
        ↓
SRE（デプロイ）
        ↓
CEO → ユーザーへ報告
```

この組織が `.claude/agents/` に全て定義されており、
次回からはユーザーがひとこと言うだけでこのワークフローが動く状態にする。

---

**END OF DAY 4 BRIEFING**
