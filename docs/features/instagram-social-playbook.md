# Instagram Playbook — première

> Channel detail for **ROADMAP S1 (SNS accounts + posting)** and **N5 (automated
> weekly SNS post)**. `docs/ROADMAP.md` stays the only execution plan; this file
> is the how-to for one channel, not a second plan.
> ROADMAP の S1 / N5 の実務マニュアル。計画書は ROADMAP のみ。

Posts are made in **Canva** by the owner. Everything below is written so a post
can be built from tokens + copy without inventing new brand rules.

---

## 1. The constraint that decides the whole visual strategy

We cannot use production photography. Stage photos of *Swan Lake* at Covent
Garden belong to the house and its photographer; reposting them — even credited
— is a licensing risk and, worse, it makes us look like an aggregator scraping
other people's images. The same rule already governs `/read` (text/CSS only,
CLAUDE.md §7) and the site itself (`hero_image` is deliberately undefined;
covers are editorial gradients).

**So the account is typographic, not photographic.** This is not a compromise —
it is the differentiator. Every other ballet account on Instagram posts the same
rehearsal footage. A feed that looks like a *printed season brochure* — ink on
warm white, champagne rules, one great serif — is instantly recognisable at
thumbnail size and cannot be confused with anyone else.

写真は使えない（権利）。だからこそ **活字と余白でつくる季刊パンフレット**の見た目に
振り切る。他のバレエアカウントとサムネイルで即座に区別がつくのが最大の武器。

**Allowed imagery:** our own gradient/`GradientArt` art, typography, maps,
data charts, screen recordings of our own site, photos the owner shot personally,
and user-submitted photos **with written permission**.
**Never:** house production stills, dancer portraits, publisher logos,
`og:image` scrapes, or AI-generated images of real dancers/houses (that would
break the "no fabricated data" rule at the visual layer).

---

## 2. Canva kit — exact tokens

Source of truth: `tailwind.config.ts`. Set these once as Brand Kit colours.

| Role | Hex |
|---|---|
| Page base | `#FAFAF8` |
| Card / elevated | `#FFFFFF` |
| Warm panel | `#FAF8F5` |
| Deep paper (wells) | `#F1ECE4` |
| Gold primary | `#D4AF37` |
| Gold for small text on white | `#A8842A` (`gold.deep` — the accessible one) |
| Gold pale wash | `#FBF4DF` |
| Ink (headline/body) | `#1A1A1A` |
| Ink secondary | `#1A1A1A` at 62% |
| Ink metadata | `#1A1A1A` at 42% |
| Jewel navy | `#1B2A4A` |
| Jewel forest | `#1A3A2E` |
| Jewel plum | `#2D1B4E` |
| Hairline rule | `rgba(26,22,15,0.10)` |

Signature gradient: `linear-gradient(135deg, #FFFFFF 0%, #F5F0EA 100%)`.

**Fonts (all on Canva, all already in `src/app/layout.tsx`):**

| Use | Font |
|---|---|
| Hero line / brand statement | **Italiana** 400 |
| Headlines, work titles | **Cormorant Garamond** |
| Wordmark "première" (needs true bold) | **Playfair Display** 700 |
| Body, dates, labels | **Manrope** 300–700 |
| Company names / editorial prose | **Fraunces** |

**Non-negotiable layout rules** (these are what make the grid look designed):
- Hierarchy from **size, letter-spacing and case** — never fake-bold a serif.
- Labels: Manrope, 11–13px equivalent, `UPPERCASE`, letter-spacing ~0.22em.
- Gold is an accent — a rule, a diamond, one word. Never a gold-filled slide.
- One idea per slide. Generous margin (≥ 90px on a 1080 canvas).
- Every slide carries the wordmark small in a corner + a `◆` diamond mark.
- Sizes: feed **1080×1350** (4:5 — takes the most vertical space), carousels
  1080×1350 throughout, Stories/Reels 1080×1920.

---

## 3. Post formats — the content engine

Instagram rewards *recognisable recurring formats*, not one-off posts. Ten
formats below; each is a series that can run for months. Pick 3–4 to start.

### F1 — "This week on the world's stages" *(weekly anchor)*
Carousel, 1 + 3–5 slides. Cover: the week's date range in Italiana, "This week
on stage". Following slides: one performance each — work title, house, city,
dates, and the *Verified* mark.
**Data:** already generated — `src/lib/this-week.ts` + `renderWeekCard`
(`src/lib/og.tsx`). The card exists; only the posting is manual (ROADMAP N5).
**Why it works:** the only weekly world-scale ballet & opera digest that is
verified. Highly saveable, and it gives the account a heartbeat.
**CTA:** "Full week, with dates confirmed against each house — link in bio."

### F2 — "Worth the journey" *(travel intent → revenue)*
Carousel, 5 slides. ① The poster: one work, one house, dates. ② Why this staging
and not another. ③ The city in 48 hours. ④ Where to sit / what it costs.
⑤ The itinerary card → link.
**Why:** this is the product in miniature — discovery → itinerary → booking. It
is the format that actually earns (hotels/experiences via `affiliate.ts`).

### F3 — "Dates you can trust" *(the trust moat as content)*
Single image or 2-slide. "This week we re-checked 39 houses. Four changed their
dates. Here they are."
**Why:** nobody else posts data-integrity reports. It is authority content,
it explains what première *is* without a single marketing adjective, and it is
true — the audit already runs (`audit:published`, ROADMAP S6).

### F4 — "Explained in six slides" *(save-bait, evergreen)*
Carousel, 6–7 slides. *Swan Lake*, *Manon*, *Onegin*, *Der Rosenkavalier* — the
story, the famous moment, what to watch the feet do, who dances it this season.
**Source:** repurpose `/journal` work explainers (`src/data/journal.ts`) —
already written, already in voice. One article → one carousel → back-link to the
article. This is the SEO↔social flywheel.

### F5 — "Anatomy of a house" *(39 posts in the bank)*
Single image, typographic profile card: founded, venue, city, one line of
editorial. Every one of the 39 companies in `src/data/companies.ts` already has
`founded_year`, `venue`, `description_short` — and an `instagram` handle to tag.
**Why:** an evergreen series with a built-in collaboration hook (§4).

### F6 — "Two houses, one decision"
Comparison card: Palais Garnier vs Opéra Bastille · Met vs Koch · Bolshoi
Historic vs New Stage. Decision-useful, argument-provoking, comment-generating.

### F7 — "The season in numbers" *(only we can make this)*
Data cards from our own dataset: how many *Swan Lakes* on earth this season,
which city has the most performances in October, the month with the most
premieres, the eight countries you could see *Giselle* in. Follow `dataviz`
conventions and the palette above.
**Why:** genuinely novel, screenshot-shareable, and it proves the catalogue.

### F8 — "The only one on earth"
Rarity alert: a staging that exists in exactly one place this season. Urgency
without hype, and it is a true statement we can prove.

### F9 — "How to see a ballet abroad" *(practical, high-save)*
Where to sit, what an interval is for, dress codes that are real vs imagined,
when tickets go on sale for each house, how far ahead to book flights.
**Why:** this is the audience's actual anxiety, and answering it is what makes
a *travel* brand rather than a calendar.

### F10 — Reels, without footage
Three formats that need no rights: ① **kinetic typography** — a work title
typed out over the gradient, dates resolving one by one; ② **the product
itself** — screen recording of the globe hero, the map, a GSAP transition
(it is genuinely beautiful and it *is* the pitch); ③ **owner POV** — a real
trip, filmed on a phone: the walk to the house, the foyer, the ticket stub.
Music: Instagram's licensed library only.

**Stories (daily, low effort):** polls ("Which city next season?"), on-sale-date
countdowns, "ask the curator", and re-sharing feed posts. Stories are where the
link stickers live, so they carry the affiliate traffic.

---

## 4. Growth mechanics

**The 39 handles are the single biggest unused asset.** `src/data/companies.ts`
carries an `instagram` handle for every house. That gives us:
- **Tag the house** in every F5/F1 post. Houses re-share flattering, accurate,
  well-designed coverage of themselves — it costs them nothing and it is the
  cheapest reach we will ever get.
- **Instagram Collab posts** (co-authored, appears in both feeds) — the ask for
  an F5 "Anatomy of a house" post is small and the house keeps editorial safety
  because we use no photography of theirs.
- The same list is the outreach list for ROADMAP N2 (a house linking back).

**Design for saves and sends, not likes.** Reach on Instagram follows saves and
DM-shares. F4/F7/F9 are reference material — that is what gets saved. Every
carousel should end on a slide worth keeping.

**Geography is the targeting.** Geotag the venue, name the city in the first
line of the caption. "A ballet weekend in Copenhagen" finds people planning
Copenhagen, which is a far better audience than people who like ballet in
general.

**Caption shape** (editorial voice, never aggregator voice):
> Line 1 — the hook, ≤ 8 words, no emoji, must survive truncation.
> Lines 2–4 — one real observation. Curator, not copywriter.
> Line 5 — the CTA, always the same phrasing so it becomes a signature.
> Then: 8–12 tags, mixing broad (#ballet #opera), work-specific (#swanlake),
> house-specific (#royalballet), and travel (#culturaltravel #operahouse).

**Link in bio → `/this-week`** with UTM (`?utm_source=instagram&utm_medium=bio`),
not the homepage. Send people to the thing the post promised.

---

## 5. Cadence

A sustainable week, in Canva time:

| Day | Post |
|---|---|
| Mon | **F1** This week on stage *(anchor — never skip)* |
| Wed | **F4 / F7 / F9** — the saveable one |
| Fri | **F2 / F5 / F8** — the travel or house one |
| Daily | 1–3 Stories (poll, countdown, re-share) |
| Bi-weekly | One Reel (F10) |

Three feed posts a week, held for a quarter, beats a burst of twelve.

---

## 6. Revenue pillars the account can build

Ranked by how soon they can earn, with what each needs.

1. **Affiliate travel — now.** The code is written (`src/lib/affiliate.ts`:
   Booking, GetYourGuide, Tiqets, Trainline, Welcome Pickups, Airalo; GYG is
   already live). F2 and Stories link-stickers are the channel. Blocked only on
   ROADMAP M6 (the remaining partner IDs). **Requires visible disclosure** —
   `/disclosure` exists; the IG bio and any paid post need it too.
2. **A "Season Planner" digital product — now-ish, highest fit.** A beautifully
   typeset 2026–27 world-season wall planner / printable PDF, sold at
   ~$15–29 on Gumroad or Shopify. It needs **no image rights**, it is 100% our
   aesthetic, it is manufactured from data we already hold, and Instagram is
   the ideal storefront for it. It also turns the feed into a portfolio for the
   product. This is the fastest path from "followers" to "revenue".
3. **On-sale alerts as a paid tier — next.** Tickets at the top houses sell out
   the day they open. A paid membership that alerts on on-sale dates and
   casting for a chosen set of houses is real, ongoing value, and the capture
   mechanism already exists (`FollowButton`, `/api/follow`, `NewsletterCapture`).
   IG is the funnel; the newsletter is the product. Aligns with the ROADMAP's
   "premium tier" bet.
4. **Partner / sponsored placements — mid-term.** Not banner ads. City tourism
   boards (Vienna, Copenhagen, Helsinki, Zürich) fund cultural-travel content,
   and festivals buy visibility around a season announcement. Requires an
   audience with provable geography, so it follows growth rather than leading it.
5. **Bespoke trip planning (concierge) — mid-term, high margin.** Sourced from
   DMs, priced per itinerary. Low volume, high value, and it is the strongest
   possible proof of the travel moat.
6. **Small-group season tours — the endpoint.** "Five nights, three
   performances, twelve people." Instagram is how you fill twelve seats. High
   revenue per customer, high operational load — only after 3–5.

Do **not** monetise by selling posts that dilute the curation, and never accept
a placement we would not have written unpaid. The brand is the asset.

---

## 7. What Claude automates (so Canva is only the last 20%)

The repo can do the writing and the data work; Canva does the layout.

- **Weekly post pack** — a `social:week` script extending `this-week.ts` that
  emits the week's slide text, caption, hashtags and alt text as markdown ready
  to paste. Kills the weekly research cost.
- **Render the series in code** — `renderWeekCard` already produces an on-brand
  card via Satori. Adding a 1080×1350 Instagram renderer means F1/F5/F7 come out
  of the repo pixel-perfect and consistent, and Canva is reserved for the
  formats that deserve hand-design (F2, F10).
- **Journal → carousel** — turn an existing `/journal` article into a 6-slide
  script automatically (F4).
- **Data-story mining** — query the dataset for the F7 numbers and F8 rarities
  that are actually surprising.
- **Captions in voice, EN + JA**, plus alt text on every image (accessibility
  and reach).
- **The collab outreach list** — 39 handles from `companies.ts` with a drafted
  approach per house.
- **A `/s/<campaign>` link-in-bio page** with UTM conventions, and reading
  Vercel Web Analytics back to say which format actually converted.

---

## 8. Guardrails

1. **No third-party imagery**, ever — see §1. This is the same rule as `/read`.
2. **No fabricated data on a graphic.** A date on a post is a promise; post only
   what passed the review gate. An empty week is better than a wrong date.
3. **Disclosure** on any affiliate or paid content, in the post, not only in
   `/disclosure`.
4. **Don't over-promise scale.** We are ~39 curated houses, not "every
   performance on earth". Say curated; mean it.
5. **Licensed audio only** on Reels.
6. **Permission in writing** before reposting any follower's photograph.

---

## 9. What to measure

Vanity metrics are a trap. Weekly, track: **saves**, **shares/sends**,
**profile→link clicks**, **newsletter signups with `utm_source=instagram`**, and
**affiliate click-through**. Follower count is a lagging indicator of the first
two — optimise the format that gets saved, and the rest follows.

---

## 日本語まとめ

- **写真は使わない**（権利リスク＋アグリゲーター化）。活字とグラデーションで
  「印刷された季刊パンフレット」の見た目に振り切る。これが最大の差別化。
- Canva 用のカラー／フォント指定は §2。すべて `tailwind.config.ts` と
  `layout.tsx` の実値。
- 投稿は「単発ネタ」ではなく **10 の連載フォーマット**（§3）。まず 3〜4 本に絞る。
  月曜の F1「今週の世界の舞台」を絶対に落とさない柱にする。
- 最大の未活用資産は `companies.ts` にある **39 劇場の Instagram ハンドル**。
  タグ付け＋コラボ投稿で最も安いリーチが取れる（§4）。
- 収益は ①アフィリエイト ②**シーズン・プランナー（デジタル商品）** ③有料の
  発売日アラート ④観光局タイアップ ⑤個別旅程作成 ⑥少人数ツアー の順（§6）。
  ②は権利不要・データ既存・ブランド適合で、最短で売上になる。
- 週次の文面・スライド原稿・ハッシュタグ・alt テキストはリポジトリ側で自動生成
  できる（§7）。Canva はレイアウトだけに集中すればよい。
