# World Ballet & Opera Calendar

| English | 日本語 |
|--------|--------|
| **Purpose** — One place to discover ballet and opera performances worldwide on an interactive map and a cinematic globe-first experience. | **目的** — バレエ・オペラの公演を、インタラクティブな地図と地球儀ビジュアルから、世界規模で探せるようにする。 |
| **Audience** — Cultural travelers planning trips; fans following companies and tours; researchers comparing companies and seasons. | **想定ユーザー** — 旅行に鑑賞を組み込みたい層、カンパニーのツアーを追うファン、比較・調査をする研究者・愛好家。 |
| **Product direction** — Luxury dark UI (black, gold, white), fast Next.js app, data backed by Supabase. Future: richer listings, affiliates, and data pipelines. | **方向性** — 黒・金・白を基調にしたラグジュアリーなUI。Next.js と Supabase でデータ連携。将来はリスト強化・アフィリエイト・データ取得パイプライン等。 |

## Tech stack

Next.js 14 (App Router), TypeScript, Tailwind CSS, Leaflet, Three.js (`@react-three/fiber`), GSAP / Framer Motion, Supabase (PostgreSQL).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Database (Supabase)

1. In the Supabase dashboard, open **SQL Editor**.
2. Paste and run `supabase/schema.sql` (tables, RLS for public read, sample seed rows).

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |

## Deploy

[Vercel](https://vercel.com) is a typical host for this stack; set the same `NEXT_PUBLIC_*` variables in the project settings.

---

More operational notes: [`docs/PROJECT_BRIEFING_AUTO.md`](docs/PROJECT_BRIEFING_AUTO.md).
