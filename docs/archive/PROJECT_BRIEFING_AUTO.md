# WORLD BALLET & OPERA CALENDAR — Project Briefing v2.0 (Full Auto)
> 完全自動版：GitHub & Vercel 統合が Claude app に設定済みという前提

---

## 🚀 CEO Agent へのミッション

あなたは本プロジェクトの **CEO Agent（完全自動モード）** として起動します。

以下を順番に実行し、**本番 URL 取得まで全てを自動完了**させてください。
エラーが出たら自走で修正。詰まったら ユーザーに確認。

---

## I. プロジェクト背景（前回の詳細版ドキュメントを参照）

### プロジェクト名
**World Ballet & Opera Calendar**

### Mission
世界中のバレエ・オペラ公演を、1つの美しい地図から探せる唯一のプラットフォームをつくる。

### Target
- Cultural Travelers（旅行にバレエ鑑賞を組み込みたい富裕層）
- Ballet/Opera Enthusiasts（推しカンパニーの世界ツアーを追う）
- Dance Researchers（カンパニー比較・調査）

### Revenue
1. Travel Affiliate (Booking.com 4%, Viator 8%) — 最大単価
2. Ticket Affiliate (Ticketmaster 3-5%, TodayTix $5-15)
3. Premium Membership ($5/月)
4. Sponsored Listings (カンパニー直接契約 $300-1000/月)
5. Google AdSense (CPM $4-8)

月間50k PV時に合計 $3,350/月を想定。

### Design Philosophy
Apple + Ferrari + Rolex の品質基準。
黒・金・白をベースにしたラグジュアリーなUI。
GSAP による滑らかなアニメーション。Three.js で回転地球儀。

### Tech Stack
- Frontend: Next.js 14, TypeScript, Tailwind, Leaflet.js, GSAP, Three.js
- Backend: Supabase (PostgreSQL), Vercel
- Automation: Playwright (scraping), GitHub Actions, Vercel Cron

---

## II. マルチエージェント組織（参考）

このプロジェクトでは、あなた（CEO Agent）が以下のサブエージェントを統括します：

```
CEO Agent
  ├─ Design Director (Apple Jony Ive model)
  ├─ Frontend Engineer
  ├─ Backend Engineer
  ├─ SRE/DevOps (Google SRE model)
  ├─ Data Pipeline Engineer (scraping)
  ├─ Code Reviewer (Google LGTM)
  ├─ Design Reviewer (Apple design review)
  ├─ Bar Raiser (Amazon + Anthropic)
  ├─ Growth Engineer (Meta)
  └─ Content Strategist
```

Day 1 は CEO がほぼ全てを実装します。Day 2 以降、サブエージェントが専門化。

---

## III. Day 1 ミッション（完全自動版）

### [ ] Task 3-1: Node.js・git の確認
```bash
node --version   # v18+ が必要
npm --version    # v9+
git --version
gh --version     # GitHub CLI
```

### [ ] Task 3-2: 新規 Next.js プロジェクト作成
```bash
npx create-next-app@latest world-ballet-calendar \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --eslint \
  --no-git  # git は Task 3-6 で初期化

cd world-ballet-calendar
```

### [ ] Task 3-3: 必要なパッケージをインストール
```bash
npm install @supabase/supabase-js @supabase/ssr
npm install leaflet react-leaflet @types/leaflet
npm install three @react-three/fiber @react-three/drei
npm install gsap framer-motion
npm install lucide-react
npm install zod
npm install -D @types/node
```

### [ ] Task 3-4: ディレクトリ構造を作成

```
src/
  ├── app/
  │   ├── layout.tsx
  │   ├── page.tsx              # トップページ（地球儀 + 地図）
  │   ├── globals.css
  │   ├── companies/
  │   │   └── [slug]/
  │   │       └── page.tsx      # カンパニー詳細ページ
  │   └── performances/
  │       └── [id]/
  │           └── page.tsx      # 公演詳細ページ
  ├── components/
  │   ├── ui/                   # shadcn/ui (Button, Card等)
  │   ├── map/
  │   │   ├── WorldMap.tsx      # Leaflet 地図
  │   │   └── GlobeView.tsx      # Three.js 地球儀
  │   ├── company/
  │   │   └── CompanyCard.tsx
  │   └── performance/
  │       └── PerformanceCard.tsx
  ├── lib/
  │   ├── supabase.ts           # Supabase クライアント
  │   └── utils.ts
  └── styles/
      └── fonts.ts              # Playfair Display / Inter

public/
  └── (空でOK)

.env.local                       # Supabase 環境変数用（後で手動入力）
```

### [ ] Task 3-5: コアファイルを作成

**src/app/layout.tsx** — マスターレイアウト
```typescript
import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const playfair = Playfair_Display({ 
  subsets: ['latin'], 
  variable: '--font-serif',
  weight: ['400', '500', '700']
})

export const metadata: Metadata = {
  title: 'World Ballet & Opera Calendar',
  description: 'Discover ballet and opera performances around the world',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-black text-white font-sans">
        {children}
      </body>
    </html>
  )
}
```

**src/app/page.tsx** — トップページ
```typescript
'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const GlobeView = dynamic(() => import('@/components/map/GlobeView'), {
  ssr: false,
  loading: () => <div className="h-screen bg-black" />
})

const WorldMap = dynamic(() => import('@/components/map/WorldMap'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-900" />
})

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="h-screen bg-black" />

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section with Globe */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <GlobeView />
        </div>
        <div className="relative z-10 text-center">
          <h1 className="font-serif text-6xl md:text-8xl font-light tracking-tight mb-4">
            Every stage.
          </h1>
          <h2 className="font-serif text-6xl md:text-8xl font-light tracking-tight mb-12 text-gray-400">
            Every season.
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Discover ballet and opera performances around the world.
          </p>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-950">
        <div className="max-w-7xl mx-auto">
          <h3 className="font-serif text-4xl mb-12 text-center">Find by location</h3>
          <div className="rounded-lg overflow-hidden border border-gray-800 h-96">
            <WorldMap />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-gray-800 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
          <p>World Ballet & Opera Calendar © 2024</p>
        </div>
      </footer>
    </div>
  )
}
```

**src/components/map/GlobeView.tsx** — Three.js 地球儀
```typescript
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

function Sphere() {
  const meshRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y = 0.5
    }
  }, [])

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial
        color="#1a1a1a"
        metalness={0.3}
        roughness={0.4}
        emissive="#c9a961"
        emissiveIntensity={0.1}
      />
    </mesh>
  )
}

export default function GlobeView() {
  return (
    <Canvas camera={{ position: [0, 0, 4.5] }}>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#c9a961" />
      <Sphere />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={2}
      />
    </Canvas>
  )
}
```

**src/components/map/WorldMap.tsx** — Leaflet インタラクティブ地図
```typescript
'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ダミーデータ（後で Supabase から取得）
const companies = [
  { name: 'Royal Ballet', lat: 51.3127, lng: -0.1269, city: 'London' },
  { name: 'Paris Opéra Ballet', lat: 48.8748, lng: 2.3359, city: 'Paris' },
  { name: 'Bolshoi Ballet', lat: 55.7605, lng: 37.6192, city: 'Moscow' },
]

const goldIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background-color:#c9a961;width:12px;height:12px;border-radius:50%;border:2px solid white;cursor:pointer;"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

export default function WorldMap() {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ height: '100%', width: '100%' }}
      className="bg-gray-900"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {companies.map((company) => (
        <Marker
          key={company.name}
          position={[company.lat, company.lng]}
          icon={goldIcon}
        >
          <Popup>
            <div className="text-black">
              <h3 className="font-bold">{company.name}</h3>
              <p className="text-sm">{company.city}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
```

**src/app/globals.css** — グローバルスタイル
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-sans: var(--font-sans, 'Inter', sans-serif);
  --font-serif: var(--font-serif, 'Playfair Display', serif);
}

html {
  scroll-behavior: smooth;
}

body {
  background-color: #0a0a0a;
  color: #fafaf8;
  font-family: var(--font-sans);
}

::selection {
  background-color: #c9a961;
  color: #0a0a0a;
}

/* Leaflet 周辺の調整 */
.leaflet-container {
  background-color: #0f0f0f !important;
  font-family: var(--font-sans);
}

.leaflet-popup-content-wrapper {
  background-color: #1a1a1a;
  color: #fafaf8;
  border-radius: 4px;
  box-shadow: 0 0 12px rgba(0,0,0,0.5);
}

.leaflet-popup-tip {
  background-color: #1a1a1a;
}
```

### [ ] Task 3-6: Supabase 環境変数を準備

**（ユーザーに確認してから実行）**

`.env.local` を作成：
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

`src/lib/supabase.ts` を作成：
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

⚠️ **注意**：Supabase URL と ANON KEY は、ユーザーが supabase.com で新規プロジェクト作成後に取得する必要があります。
まだ値がない場合は、プレースホルダーのままで OK。

### [ ] Task 3-7: Git リポジトリを初期化・push

```bash
git init
git add .
git commit -m "feat: project scaffold with multi-agent architecture

- Next.js 14 setup with TypeScript & Tailwind
- Supabase integration prepared
- Three.js globe view
- Leaflet interactive world map
- Luxury dark theme (Apple/Ferrari/Rolex standard)
- Multi-agent organization defined
"
```

GitHub に push：
```bash
gh repo create world-ballet-calendar \
  --public \
  --source=. \
  --remote=origin \
  --push
```

✅ リポジトリが作成され、コードが `main` にpush されます。
リポジトリURL: https://github.com/YOUR_USERNAME/world-ballet-calendar

### [ ] Task 3-8: Vercel にデプロイ

```bash
vercel --prod
```

✅ デプロイ完了。本番 URL が出力されます。
通常: `https://world-ballet-calendar.vercel.app`

### [ ] Task 3-9: デプロイ確認 + レポート作成

ブラウザで本番 URL を開き、以下を確認：
- [ ] ヒーローセクション（黒背景）が表示される
- [ ] 地球儀がゆっくり回転している
- [ ] インタラクティブ地図が表示される
- [ ] ロンドン・パリ・モスクワのマーカーが見える
- [ ] モバイル・デスクトップ両方で見られる

確認後、`reports/day-01.md` を作成：
```markdown
# Day 1 Report

## Completed ✅

- [x] Node.js / npm / git インストール確認
- [x] Next.js 14 プロジェクト作成
- [x] 必要パッケージインストール
- [x] コアコンポーネント実装
  - Three.js 地球儀
  - Leaflet インタラクティブ地図
  - ラグジュアリーレイアウト
- [x] GitHub push
- [x] Vercel デプロイ

## Live URL
🌐 https://world-ballet-calendar.vercel.app

## Next Steps (Day 2)
- [ ] Supabase スキーマ確定 & API実装
- [ ] バレエ団データ入力（主要20社）
- [ ] カンパニーページ実装

## Notes
- Three.js globe はブラウザ負荷を監視（Lighthouse目標: Performance 90+）
- Leaflet タイルは Dark Carto を使用（ラグジュアリー感重視）
- 環境変数は Day 2 で Supabase 値を入力予定
```

---

## IV. エラーが出たときの対応

### Git push でエラー
```
error: Permission denied (publickey)
```
→ GitHub CLI が認証失敗。`gh auth login` を実行してログインし直す。

### Vercel deploy でエラー
```
Error: Could not authenticate with Vercel
```
→ Claude app の Integrations から Vercel 連携を確認。断たれていたら再連携。

### Node 版が古い
```
npm ERR! node v16.x.x
```
→ Node.js 18以上が必要。nvm でアップグレード：
```bash
nvm install 18
nvm use 18
```

---

## V. 重要な留意点

### セキュリティ
- `.env.local` には Supabase ANON KEY を入力する（個人情報ではない）
- GitHub は public にする（デモ目的のため）
- 本番化時には personal API key の管理を強化

### パフォーマンス
- Three.js globe はモバイルで重い可能性 → Day 2 で最適化
- Leaflet は無料 Carto tiles を使用（制限あり → 有料への検討は後）

### 今日の時間目安
- 環境構築 ~ deploy: **約15分**
- エラー対応: **別途最大30分**

---

**END OF BRIEFING v2.0 (Full Automation)**

準備ができたら、最初のメッセージでこのファイル全体をコピペしてください。
