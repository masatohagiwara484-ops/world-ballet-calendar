# DAY 2 BRIEFING — Backend Engineer + Data Foundation
# World Ballet & Opera Calendar
# Agent: CEO (Orchestrator) → Backend Engineer → Code Reviewer → SRE

---

## 0. CEO Agent への指示

あなたは CEO Agent として、本日の作業を以下の通り指揮してください。

**DRI（Directly Responsible Individual）: Backend Engineer Agent**

### Working Backwards（Bezos Method）
今日が終わった時点でユーザーが得るもの：
- ブラウザで `world-ballet-calendar.vercel.app` を開くと
- 世界地図上に **4つの金色マーカー**（London/Paris/Moscow/New York）が表示される
- マーカーをクリックすると **カンパニー名と公演情報** がポップアップする
- これらのデータは全て **Supabase から取得**されている（ハードコードではない）

この状態を実現するために全タスクを実行してください。

---

## 1. 前提確認

### 1-1. 環境変数の確認
Supabase の URL と ANON KEY は **Vercel 環境変数に設定済み**です。
ローカル開発用に `.env.local` を作成してください。

```bash
# .env.local（既に存在する場合はスキップ）
# ユーザーが値を入力済みの場合はそのまま使用
# 存在しない場合は以下を作成してユーザーに入力を依頼
cat .env.local 2>/dev/null || echo "NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=" > .env.local
```

⚠️ `.env.local` に値がない場合は、作業を一時停止してユーザーに確認してください：
```
「.env.local に Supabase の値が必要です。
Vercel ダッシュボード → Settings → Environment Variables から
NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を
ローカルの .env.local にコピーしてください。」
```

### 1-2. Day 1 の成果物確認
```bash
# 以下が全て存在することを確認
ls src/app/page.tsx
ls src/components/map/WorldMap.tsx
ls src/components/map/GlobeView.tsx
ls src/app/globals.css
```

---

## 2. エージェント組織の確立

### 2-1. CLAUDE.md を更新
プロジェクトルートの `CLAUDE.md` を以下の内容で作成・更新：

```markdown
# World Ballet & Opera Calendar — CLAUDE.md

## Agent Organization

### CEO Agent (You — Orchestrator)
- DRI割当、Working Backwards、最終判断
- 全エージェントの成果をレビューしてユーザーに報告

### Active Sub-Agents
- backend_engineer: DB・API・認証
- frontend_engineer: UI・アニメーション・地図
- design_director: デザイン品質監査
- code_reviewer: コードレビュー（全PRに必須）
- sre_devops: デプロイ・監視
- data_scraper: バレエ団サイト自動巡回（Day 6+）
- growth_engineer: SEO・アフィリエイト
- bar_raiser: 公開可否の最終判断

### Workflow
1. CEO → タスク分解 → DRI割当
2. DRI → 実装
3. Code Reviewer → レビュー
4. SRE → デプロイ
5. CEO → ユーザーへ報告

## Tech Stack
- Frontend: Next.js 14, TypeScript, Tailwind, Leaflet, Three.js, GSAP
- Backend: Supabase (PostgreSQL), Vercel Edge Functions
- Deploy: Vercel (env vars設定済み)

## Design Standard
- Apple/Ferrari/Rolex 品質
- Black (#0A0A0A) / White (#FAFAF8) / Gold (#C9A961)
- Playfair Display (serif) + Inter (sans)
- GSAP アニメーション 0.8s+

## Commands
- dev: npm run dev
- build: npm run build
- deploy: vercel --prod
```

### 2-2. エージェント定義ファイルを作成
```bash
mkdir -p .claude/agents
mkdir -p .claude/skills
mkdir -p reports
mkdir -p data
```

**`.claude/agents/backend_engineer.md`:**
```markdown
# Backend Engineer Agent

## Role
Supabase スキーマ設計、API Routes、認証フロー、データバリデーション

## Responsibilities
- PostgreSQL スキーマ設計（RLS含む）
- Next.js Server Actions / API Routes
- Supabase クライアント設定
- Zod バリデーション
- エラーハンドリング

## Skills
- supabase_postgres, row_level_security
- nextjs_api_routes, server_actions
- typescript, zod
- data_normalization

## Must Pass
- Code Reviewer の LGTM
- Bar Raiser のセキュリティチェック

## Output Format
- 実装済みファイル
- PR description（What / Why / How）
- テストケース
```

**`.claude/agents/code_reviewer.md`:**
```markdown
# Code Reviewer Agent

## Role
全コードの品質ゲート（Google LGTM Culture）

## Review Checklist
- [ ] TypeScript の型安全性（any禁止）
- [ ] エラーハンドリング（全APIでtry/catch）
- [ ] Supabase RLS が設定されているか
- [ ] 環境変数が直接ハードコードされていないか
- [ ] N+1 クエリがないか
- [ ] console.log が残っていないか

## Output
- LGTM（承認）
- Request Changes（差し戻し + 具体的な修正箇所）

## Veto Power: YES
```

**`.claude/agents/sre_devops.md`:**
```markdown
# SRE/DevOps Agent

## Role
デプロイ・信頼性・監視（Google SRE model）

## Responsibilities
- vercel --prod でのデプロイ
- ビルドエラーの解決
- 環境変数の確認
- デプロイ後の動作確認

## Deployment Checklist
- [ ] npm run build がエラーなしで完了
- [ ] 環境変数が全て設定済み
- [ ] Supabase 接続が正常
- [ ] 本番 URL で動作確認

## Output
- デプロイ完了報告
- 本番 URL
- エラーがあれば詳細レポート
```

---

## 3. Supabase スキーマ作成

### 3-1. スキーマ SQL を生成

`supabase/migrations/001_initial_schema.sql` を作成：

```sql
-- =============================================
-- World Ballet & Opera Calendar
-- Initial Schema v1.0
-- =============================================

-- companies テーブル
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  name_local text,
  type text not null check (type in ('ballet', 'opera', 'both')),
  country text not null,
  city text not null,
  lat numeric(10, 7) not null,
  lng numeric(10, 7) not null,
  website text,
  instagram text,
  hero_image text,
  description text,
  description_short text,
  founded_year integer,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- performances テーブル
create table if not exists public.performances (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  title_original text,
  composer text,
  choreographer text,
  start_date date not null,
  end_date date,
  venue text,
  venue_address text,
  ticket_url text,
  affiliate_url text,
  description text,
  image_url text,
  price_range text,
  is_featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- インデックス（検索最適化）
create index if not exists idx_companies_type on public.companies(type);
create index if not exists idx_companies_country on public.companies(country);
create index if not exists idx_performances_company_id on public.performances(company_id);
create index if not exists idx_performances_start_date on public.performances(start_date);

-- RLS (Row Level Security) 有効化
alter table public.companies enable row level security;
alter table public.performances enable row level security;

-- 公開読み取りポリシー（認証不要で読み取り可能）
create policy "Companies are viewable by everyone"
  on public.companies for select
  using (true);

create policy "Performances are viewable by everyone"
  on public.performances for select
  using (true);

-- 更新日時の自動更新
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_companies_updated_at
  before update on public.companies
  for each row execute procedure public.update_updated_at_column();

create trigger update_performances_updated_at
  before update on public.performances
  for each row execute procedure public.update_updated_at_column();
```

### 3-2. Supabase にスキーマを適用

`src/lib/supabase.ts` を作成・更新：

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 型定義
export type Company = {
  id: string
  slug: string
  name: string
  name_local?: string
  type: 'ballet' | 'opera' | 'both'
  country: string
  city: string
  lat: number
  lng: number
  website?: string
  instagram?: string
  hero_image?: string
  description?: string
  description_short?: string
  founded_year?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Performance = {
  id: string
  company_id: string
  title: string
  title_original?: string
  composer?: string
  choreographer?: string
  start_date: string
  end_date?: string
  venue?: string
  venue_address?: string
  ticket_url?: string
  affiliate_url?: string
  description?: string
  image_url?: string
  price_range?: string
  is_featured: boolean
  created_at: string
  updated_at: string
}
```

### 3-3. シードデータを作成

`data/seed_companies.ts` を作成（4社のシードデータ）：

```typescript
// 初期4社シードデータ
// 明日以降、CSV からの自動インポートに移行

export const seedCompanies = [
  {
    slug: 'royal-ballet',
    name: 'The Royal Ballet',
    name_local: 'The Royal Ballet',
    type: 'ballet' as const,
    country: 'United Kingdom',
    city: 'London',
    lat: 51.5129,
    lng: -0.1243,
    website: 'https://www.roh.org.uk',
    instagram: 'royalballetofficial',
    description: 'One of the world\'s greatest ballet companies, based at the Royal Opera House in Covent Garden, London. Founded in 1931, the Royal Ballet is celebrated for its exceptional classical and contemporary repertoire.',
    description_short: 'World-leading ballet company at the Royal Opera House, London.',
    founded_year: 1931,
  },
  {
    slug: 'paris-opera-ballet',
    name: 'Paris Opéra Ballet',
    name_local: 'Ballet de l\'Opéra de Paris',
    type: 'ballet' as const,
    country: 'France',
    city: 'Paris',
    lat: 48.8719,
    lng: 2.3316,
    website: 'https://www.operadeparis.fr',
    instagram: 'operadeparis',
    description: 'The world\'s oldest national ballet company, founded in 1661 by King Louis XIV. Based at the Palais Garnier and Opéra Bastille, it is a cornerstone of French cultural heritage.',
    description_short: 'World\'s oldest ballet company, founded in 1661 by Louis XIV.',
    founded_year: 1661,
  },
  {
    slug: 'bolshoi-ballet',
    name: 'Bolshoi Ballet',
    name_local: 'Большой балет',
    type: 'both' as const,
    country: 'Russia',
    city: 'Moscow',
    lat: 55.7603,
    lng: 37.6189,
    website: 'https://www.bolshoi.ru',
    instagram: 'bolshoi_theatre',
    description: 'One of the most prestigious and historically significant ballet companies in the world. The Bolshoi Theatre in Moscow has been home to extraordinary productions since 1776.',
    description_short: 'Russia\'s legendary ballet company, home of Swan Lake and The Nutcracker.',
    founded_year: 1776,
  },
  {
    slug: 'metropolitan-opera',
    name: 'Metropolitan Opera',
    name_local: 'Metropolitan Opera',
    type: 'opera' as const,
    country: 'United States',
    city: 'New York',
    lat: 40.7730,
    lng: -73.9831,
    website: 'https://www.metopera.org',
    instagram: 'metropolitanopera',
    description: 'The largest classical music organization in North America. The Met, as it is commonly known, presents approximately 220 performances of some 25 operas each season at Lincoln Center.',
    description_short: 'North America\'s leading opera house at Lincoln Center, New York.',
    founded_year: 1883,
  },
]

export const seedPerformances = [
  // Royal Ballet
  {
    company_slug: 'royal-ballet',
    title: 'Swan Lake',
    composer: 'Pyotr Ilyich Tchaikovsky',
    choreographer: 'Marius Petipa & Lev Ivanov',
    start_date: '2025-02-01',
    end_date: '2025-02-28',
    venue: 'Royal Opera House',
    venue_address: 'Bow St, London WC2E 9DD',
    ticket_url: 'https://www.roh.org.uk',
    price_range: '£25 - £250',
    is_featured: true,
  },
  {
    company_slug: 'royal-ballet',
    title: 'The Sleeping Beauty',
    composer: 'Pyotr Ilyich Tchaikovsky',
    choreographer: 'Frederick Ashton',
    start_date: '2025-03-15',
    end_date: '2025-04-10',
    venue: 'Royal Opera House',
    venue_address: 'Bow St, London WC2E 9DD',
    ticket_url: 'https://www.roh.org.uk',
    price_range: '£30 - £280',
    is_featured: false,
  },
  // Paris Opera Ballet
  {
    company_slug: 'paris-opera-ballet',
    title: 'Giselle',
    composer: 'Adolphe Adam',
    choreographer: 'Jean Coralli & Jules Perrot',
    start_date: '2025-02-10',
    end_date: '2025-03-05',
    venue: 'Palais Garnier',
    venue_address: 'Place de l\'Opéra, 75009 Paris',
    ticket_url: 'https://www.operadeparis.fr',
    price_range: '€15 - €210',
    is_featured: true,
  },
  {
    company_slug: 'paris-opera-ballet',
    title: 'The Nutcracker',
    composer: 'Pyotr Ilyich Tchaikovsky',
    choreographer: 'Rudolf Nureyev',
    start_date: '2025-12-01',
    end_date: '2025-12-31',
    venue: 'Opéra Bastille',
    venue_address: 'Place de la Bastille, 75012 Paris',
    ticket_url: 'https://www.operadeparis.fr',
    price_range: '€15 - €195',
    is_featured: false,
  },
  // Bolshoi Ballet
  {
    company_slug: 'bolshoi-ballet',
    title: 'Don Quixote',
    composer: 'Ludwig Minkus',
    choreographer: 'Marius Petipa',
    start_date: '2025-02-20',
    end_date: '2025-03-10',
    venue: 'Bolshoi Theatre',
    venue_address: 'Teatralnaya pl., 1, Moscow, 125009',
    ticket_url: 'https://www.bolshoi.ru',
    price_range: '₽3,000 - ₽30,000',
    is_featured: true,
  },
  // Metropolitan Opera
  {
    company_slug: 'metropolitan-opera',
    title: 'La Traviata',
    composer: 'Giuseppe Verdi',
    start_date: '2025-02-05',
    end_date: '2025-02-25',
    venue: 'Metropolitan Opera House',
    venue_address: '30 Lincoln Center Plaza, New York, NY 10023',
    ticket_url: 'https://www.metopera.org',
    price_range: '$25 - $399',
    is_featured: true,
  },
  {
    company_slug: 'metropolitan-opera',
    title: 'Carmen',
    composer: 'Georges Bizet',
    start_date: '2025-03-10',
    end_date: '2025-04-05',
    venue: 'Metropolitan Opera House',
    venue_address: '30 Lincoln Center Plaza, New York, NY 10023',
    ticket_url: 'https://www.metopera.org',
    price_range: '$30 - $450',
    is_featured: false,
  },
]
```

---

## 4. データベースにシードデータを投入するスクリプト

`scripts/seed.ts` を作成：

```typescript
import { createClient } from '@supabase/supabase-js'
import { seedCompanies, seedPerformances } from '../data/seed_companies'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function seed() {
  console.log('🌱 Starting seed...')

  // Companies を挿入
  for (const company of seedCompanies) {
    const { error } = await supabase
      .from('companies')
      .upsert(company, { onConflict: 'slug' })
    
    if (error) {
      console.error(`❌ Error inserting ${company.name}:`, error.message)
    } else {
      console.log(`✅ ${company.name}`)
    }
  }

  // Companies を取得してIDをマッピング
  const { data: companies } = await supabase
    .from('companies')
    .select('id, slug')

  const slugToId = companies?.reduce((acc, c) => {
    acc[c.slug] = c.id
    return acc
  }, {} as Record<string, string>)

  // Performances を挿入
  for (const perf of seedPerformances) {
    const { company_slug, ...perfData } = perf
    const company_id = slugToId?.[company_slug]
    
    if (!company_id) {
      console.error(`❌ Company not found: ${company_slug}`)
      continue
    }

    const { error } = await supabase
      .from('performances')
      .upsert({ ...perfData, company_id }, { onConflict: 'company_id,title,start_date' })
    
    if (error) {
      console.error(`❌ Error inserting ${perf.title}:`, error.message)
    } else {
      console.log(`✅ Performance: ${perf.title} (${company_slug})`)
    }
  }

  console.log('🎉 Seed complete!')
}

seed().catch(console.error)
```

`package.json` に seed スクリプトを追加：
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "seed": "npx tsx scripts/seed.ts"
}
```

必要なパッケージ：
```bash
npm install -D tsx dotenv
```

シードを実行：
```bash
npm run seed
```

---

## 5. API Routes を実装

### 5-1. `/api/companies` — 全カンパニー取得
`src/app/api/companies/route.ts`：

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  try {
    let query = supabase
      .from('companies')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ companies: data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    )
  }
}
```

### 5-2. `/api/companies/[slug]` — 単一カンパニー + 公演情報
`src/app/api/companies/[slug]/route.ts`：

```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    // カンパニー情報取得
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', params.slug)
      .single()

    if (companyError) throw companyError
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // 今後の公演情報取得（今日以降）
    const today = new Date().toISOString().split('T')[0]
    const { data: performances, error: perfError } = await supabase
      .from('performances')
      .select('*')
      .eq('company_id', company.id)
      .gte('start_date', today)
      .order('start_date')

    if (perfError) throw perfError

    return NextResponse.json({ company, performances: performances ?? [] })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch company' },
      { status: 500 }
    )
  }
}
```

---

## 6. フロントエンドを実データに接続

### 6-1. WorldMap.tsx を Supabase データで更新
`src/components/map/WorldMap.tsx`：

```typescript
'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Company } from '@/lib/supabase'

const createGoldIcon = () => L.divIcon({
  className: '',
  html: `
    <div style="
      width: 14px;
      height: 14px;
      background: #C9A961;
      border: 2px solid rgba(255,255,255,0.8);
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 0 8px rgba(201,169,97,0.6);
      transition: transform 0.2s;
    "></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

interface WorldMapProps {
  filter?: 'all' | 'ballet' | 'opera'
}

export default function WorldMap({ filter = 'all' }: WorldMapProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url = filter === 'all'
      ? '/api/companies'
      : `/api/companies?type=${filter}`

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setCompanies(data.companies ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [filter])

  return (
    <div className="relative h-full w-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950 z-10">
          <p className="text-gray-400 text-sm">Loading companies...</p>
        </div>
      )}
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        className="bg-gray-950"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        />
        {companies.map((company) => (
          <Marker
            key={company.id}
            position={[company.lat, company.lng]}
            icon={createGoldIcon()}
          >
            <Popup className="ballet-popup">
              <div style={{
                background: '#0A0A0A',
                color: '#FAFAF8',
                padding: '12px',
                minWidth: '180px',
                fontFamily: 'Inter, sans-serif',
              }}>
                <p style={{
                  fontSize: '11px',
                  color: '#C9A961',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}>
                  {company.type} · {company.city}
                </p>
                <h3 style={{
                  fontSize: '15px',
                  fontWeight: '500',
                  marginBottom: '8px',
                }}>
                  {company.name}
                </h3>
                <a
                  href={`/companies/${company.slug}`}
                  style={{
                    fontSize: '12px',
                    color: '#C9A961',
                    textDecoration: 'none',
                  }}
                >
                  View performances →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
```

### 6-2. トップページにフィルターを追加
`src/app/page.tsx` のマップセクションを更新：

```typescript
// マップセクションに filter state と UI を追加

const [mapFilter, setMapFilter] = useState<'all' | 'ballet' | 'opera'>('all')

// JSX
<section className="py-20 px-4 bg-gradient-to-b from-black to-gray-950">
  <div className="max-w-7xl mx-auto">
    <h3 className="font-serif text-4xl mb-4 text-center">Find by location</h3>
    
    {/* フィルターボタン */}
    <div className="flex justify-center gap-3 mb-10">
      {(['all', 'ballet', 'opera'] as const).map((f) => (
        <button
          key={f}
          onClick={() => setMapFilter(f)}
          className={`px-6 py-2 text-sm tracking-widest uppercase border transition-all duration-300 ${
            mapFilter === f
              ? 'border-[#C9A961] text-[#C9A961] bg-[#C9A961]/10'
              : 'border-gray-700 text-gray-400 hover:border-gray-500'
          }`}
        >
          {f}
        </button>
      ))}
    </div>

    <div className="rounded-none overflow-hidden border border-gray-800 h-[500px]">
      <WorldMap filter={mapFilter} />
    </div>
  </div>
</section>
```

---

## 7. Code Reviewer チェックリスト

実装完了後、Code Reviewer Agent として以下を確認：

```
[ ] 全 API Route に try/catch が実装されている
[ ] any 型が使われていない（Company, Performance 型を使用）
[ ] 環境変数がハードコードされていない
[ ] Supabase RLS が有効になっている
[ ] .env.local が .gitignore に含まれている
[ ] 本番ビルドが通る（npm run build）
```

`.gitignore` に追加：
```
.env.local
.env*.local
```

---

## 8. SRE Agent — デプロイ

```bash
# ビルド確認
npm run build

# エラーがなければデプロイ
vercel --prod

# デプロイ後の確認
# 1. 本番 URL でマップが表示されるか
# 2. 4つのマーカーが表示されるか
# 3. マーカーをクリックするとポップアップが出るか
# 4. /api/companies が JSON を返すか
```

---

## 9. Day 2 完了レポートを作成

`reports/day-02.md`：

```markdown
# Day 2 Report

## Completed ✅

### Backend Engineering (Backend Engineer Agent)
- [ ] Supabase スキーマ作成（companies, performances）
- [ ] RLS 設定（公開読み取り）
- [ ] シードデータ投入（4社 + 7公演）
- [ ] API Routes 実装（/api/companies, /api/companies/[slug]）

### Frontend Integration (CEO Agent)
- [ ] WorldMap を実データに接続
- [ ] フィルター機能（all/ballet/opera）
- [ ] ポップアップのラグジュアリーデザイン

### Code Review (Code Reviewer Agent)
- [ ] 全チェックリスト通過
- [ ] LGTM 取得

### Deployment (SRE Agent)
- [ ] 本番 URL で4つのマーカー確認
- [ ] API 動作確認

## Live Companies
1. ✅ The Royal Ballet (London)
2. ✅ Paris Opéra Ballet (Paris)
3. ✅ Bolshoi Ballet (Moscow)
4. ✅ Metropolitan Opera (New York)

## Live URL
🌐 [URL を記入]

## Next Steps (Day 3)
- [ ] カンパニー詳細ページ (/companies/[slug])
- [ ] 公演カレンダービュー
- [ ] Leaflet 地図のさらなる強化
- [ ] Booking.com アフィリエイトリンク（初期）
```

---

## ⚠️ ユーザーへの確認事項

以下が必要な場合、作業を一時停止してユーザーにチャットで確認：

1. `.env.local` に値がない場合
2. Supabase のテーブル作成で権限エラーが出た場合
3. シードデータの投入で認証エラーが出た場合

---

**END OF DAY 2 BRIEFING**
