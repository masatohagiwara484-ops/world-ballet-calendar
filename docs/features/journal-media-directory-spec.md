# Première — Journal / Ballet Media Directory

**Feature spec + Claude Code implementation plan**
Owner: Masato · Status: Ready to build · Version: v1 (seed)

> This document is written to be handed to Claude Code. It contains (1) the product spec,
> (2) a ready-to-use seed dataset, and (3) six copy-paste prompts (Phase 0–5) to run in
> sequence, reviewing between each. Run them in order. Do not run all at once.

---

## 1. Summary

Add a curated directory of the world's leading ballet media (magazines, critics, review
sites) to Première. Each entry is a **branded, clickable card ("box") that links out to the
external publication** — no article text, no images, no logos are copied. Users can filter
the directory **by country and region**, reusing the same geographic filtering pattern that
Première already uses for performances.

The goal is to give visitors an extra reason to come to Première: a beautiful, trustworthy
"where to read about ballet" hub that also signals Première is a serious platform connected
to the real ballet-press ecosystem.

## 2. Problem statement

Ballet audiences discover performances on Première but have nowhere on the site to go
deeper — reviews, interviews, and criticism live scattered across dozens of publications in
many languages. There is no single, well-designed, region-aware index of trustworthy ballet
media. Building one is low-cost (static, no backend) and increases session value and return
visits.

## 3. Goals

- Ship a **country/region-filterable directory** of ballet media as branded outbound-link cards.
- **Reuse** Première's existing geo-filter and design tokens so it looks native, not bolted-on.
- Make it **trivial to add a new source** later (one data-file entry, no code changes).
- Zero legal exposure: **outbound links + self-authored blurbs only**, no third-party text/images/logos.

## 4. Non-goals (v1)

- **No article ingestion / RSS / scraping.** Cards link out; we do not display external content. (Possible v2.)
- **No third-party logos or images.** Text/typographic cards only, to stay clearly inside safe-linking territory. (Revisit per-publisher with permission once traffic justifies outreach.)
- **No affiliate / monetization** on these links. This is a goodwill curation surface.
- **No user-submitted sources** in v1. Curation is manual. (Possible v2, mirrors Tetheria's community-dataset direction.)
- **No search box** in v1 — filters are enough for ~20 entries.

## 5. User stories

- As a visitor, I want to browse trusted ballet publications so I can read reviews and interviews after finding a performance.
- As a visitor in a specific country, I want to filter media by country/region so I can find coverage in my language/market.
- As a visitor, I want each card to clearly open the external site in a new tab so I don't lose Première.
- As the site owner, I want to add a new publication by editing one data file so curation stays cheap.

## 6. Legal & trust guardrails (hard requirements — do not violate)

These are P0 constraints on every card:

1. **Text only.** Publication name rendered as typography or an in-house monogram. **Never** fetch, hotlink, or embed the publisher's logo, favicon-as-brand, article images, or `og:image`.
2. **Self-authored blurbs.** The one-line description must be the owner's own words (provided in the seed data). Never copy the publication's own tagline verbatim.
3. **Clear external affordance.** Each card shows an "External ↗" indicator and opens via `target="_blank" rel="noopener noreferrer"`.
4. **No implied endorsement/affiliation.** A small "External media" label makes clear these are independent third parties, not Première properties or partners.

## 7. Seed dataset (v1)

Use exactly these entries for v1. Fields are defined in Phase 1. `blurb` values are starter
copy in the owner's voice — Masato will refine/translate them on review. `status: "verify"`
entries should be **included but visibly flagged in `IMPLEMENTATION_NOTES.md`** so Masato
confirms the live URL before launch. Latin America is intentionally thin (few independent
online ballet-criticism outlets exist) — leave room to grow.

| id | name | url | region | country | languages | type | status | blurb (starter, owner voice) |
|----|------|-----|--------|---------|-----------|------|--------|------------------------------|
| bachtrack | Bachtrack | https://bachtrack.com/dance | Europe | GB | en, fr, de, es | reviews, listings | ok | Worldwide classical & dance reviews and listings — dozens of ballet notices a month from Paris to New York. |
| fjord-review | Fjord Review | https://fjordreview.com/ | North America | US | en | reviews, essays | ok | Long-form, world-class dance criticism with an international eye. |
| ballet-herald | The Ballet Herald | https://www.balletherald.com/ | North America | US | en | news, reviews, interviews | ok | Independent ballet news, performance reviews and artist interviews. |
| dance-magazine | Dance Magazine | https://dancemagazine.com/ | North America | US | en | features, interviews | ok | The long-running US voice on ballet and dance, strong on features and profiles. |
| pointe-magazine | Pointe Magazine | https://pointemagazine.com/ | North America | US | en | features, training | ok | Career and repertoire coverage aimed at serious ballet dancers. |
| dance-europe | Dance Europe | https://danceeurope.net/ | Europe | GB | en | reviews, features | ok | Long-standing bilingual magazine covering dance across Europe. |
| criticaldance | CriticalDance | https://criticaldance.org/ | North America | US | en | reviews | ok | Reviews and features on dance worldwide. |
| dancetabs | DanceTabs | https://dancetabs.com/ | Europe | GB | en | reviews | ok | UK-based reviews spanning international ballet and dance. |
| ballett-journal | Ballett-Journal | https://ballett-journal.de/ | Europe | DE | de | criticism, backstage | ok | Independent German ballet journal with sharp, insider criticism. |
| tanznetz | tanznetz.de | https://www.tanznetz.de/ | Europe | DE | de | portal, reviews | verify | Germany's large dance portal — news, reviews and listings. |
| dance-for-you | Dance for You Magazine | https://www.danceforyou-magazine.com/ | Europe | DE | de, en | features | ok | German/English international dance magazine, published since 2004. |
| danser-canal-historique | Danser Canal Historique | https://www.dansercanalhistorique.fr/ | Europe | FR | fr | criticism, interviews | ok | French critical writing and interviews on ballet and contemporary dance. |
| resmusica | ResMusica (Danse) | https://www.resmusica.com/ | Europe | FR | fr | reviews | verify | French classical arts site with a dedicated dance/ballet review section. |
| ballet2000 | Ballet2000 | https://www.ballet2000.com/ | Europe | IT | fr, it, en | reviews, features | verify | Trilingual European magazine on ballet and contemporary dance. |
| la-personne | La Personne | https://www.lapersonne.com/en/ | Russia | RU | ru, en | interviews, photo | ok | Russian online ballet magazine — dancer interviews, reviews and photography. |
| chacott-dance-magazine | Chacott / Dance Magazine (JP) | https://www.chacott-jp.com/news/ | Asia | JP | ja | reports, interviews | ok | Japan's leading ballet coverage — world tours, interviews and performance reports. |
| ballet-channel | Ballet Channel | https://balletchannel.jp/ | Asia | JP | ja | web magazine | verify | Japanese web magazine focused on ballet features and interviews. |
| danza-ballet | Danza Ballet | https://www.danzaballet.com/ | Europe | ES | es | reviews, news | verify | Spanish-language ballet coverage spanning Spain and Latin America. |

> Region taxonomy note: The `region` and `country` values above must be **reconciled with
> Première's existing geography model** in Phase 0. If Première already defines regions/countries
> for performances, use those exact identifiers (ISO country codes, region names) so filters are
> consistent across the whole site. The values above are placeholders to be mapped, not a new taxonomy.

---

## 8. Data model (target)

Final shape is decided in Phase 0 to match repo conventions, but aim for:

```jsonc
// MediaSource
{
  "id": "bachtrack",              // stable slug, kebab-case
  "name": "Bachtrack",            // display name (text-rendered, no logo)
  "url": "https://bachtrack.com/dance",
  "region": "Europe",            // MUST map to Première's region enum
  "country": "GB",               // ISO 3166-1 alpha-2, MUST map to Première's country list; null if truly global
  "scope": "international",       // "international" | "national" — international sources also surface in a Global bucket
  "languages": ["en", "fr"],     // ISO 639-1
  "type": ["reviews", "listings"],
  "blurb": "…owner-authored one line…",
  "status": "ok"                 // "ok" | "verify" — verify = flag for URL confirmation, still render but mark internally
}
```

---

## 9. Success criteria (v1 "done")

- [ ] Directory reachable from primary nav (e.g. "Journal" / "Read").
- [ ] All seed sources render as cards; `verify` sources are listed in `IMPLEMENTATION_NOTES.md`.
- [ ] Filtering by **country** and by **region** works and reuses the performances filter UX.
- [ ] "International/Global" sources are reachable regardless of region filter (see Phase 3).
- [ ] Every card: text-only, "External ↗", opens in new tab with `rel="noopener noreferrer"`, has "External media" labelling somewhere on the surface.
- [ ] No third-party logo/image/favicon-as-brand is loaded anywhere.
- [ ] Responsive down to mobile; empty-state renders when a filter yields no results.
- [ ] Basic a11y: cards are keyboard-focusable links, visible focus ring, adequate contrast.
- [ ] CLAUDE.md documents the feature and the "how to add a source" workflow.

---

# Claude Code prompts (run in order)

> Save this spec in the repo first (suggested path: `docs/features/journal-media-directory-spec.md`).
> Each prompt below references it. Review and commit after each phase before running the next.

## Phase 0 — Discovery & integration plan (no feature code yet)

```
Read docs/features/journal-media-directory-spec.md in full.

Do NOT write feature code yet. Investigate this repository and produce a short plan.

Inspect and report:
1. Stack & conventions: framework, language, styling approach (Tailwind/CSS modules/etc.),
   component folder structure, data-file conventions (where static data lives, JSON vs TS).
2. Geography model: how performances are filtered by country and region today. Find the exact
   region enum / country list / ISO codes used, the filter component(s), and the filter state
   pattern (URL query params, context, store, etc.). This feature MUST reuse it.
3. Design system: where brand tokens live (colors, typography, spacing, card/surface styles).
   Identify existing card or tile components to match visually.
4. Routing & nav: how pages/sections are added and how the primary nav is configured.
5. i18n: is there an existing internationalization setup? How are language codes represented?

Then write docs/features/journal-media-directory-IMPLEMENTATION_NOTES.md containing:
- The confirmed data model (adapted to repo conventions).
- The exact region/country identifiers to use, and a mapping table from the spec's seed values
  to Première's real identifiers. Flag any seed country/region that doesn't map cleanly.
- Which existing components/hooks/utilities Phases 1–5 will reuse (by path).
- A list of all seed entries with status:"verify" for me to confirm URLs before launch.
- Any open questions.

Output only the notes file and a concise summary. Make no other changes.
```

**Review gate:** Confirm the geo-model reuse and the data model before proceeding.

---

## Phase 1 — Data layer

```
Read docs/features/journal-media-directory-spec.md and
docs/features/journal-media-directory-IMPLEMENTATION_NOTES.md.

Implement the data layer for the ballet media directory:
1. Create the media-source data file using the seed dataset in the spec (Section 7),
   in the format and location agreed in IMPLEMENTATION_NOTES.md.
2. Use the real Première region/country identifiers from the mapping in the notes — not the
   raw placeholder strings.
3. Add a type/interface/schema for MediaSource matching Section 8, adapted to repo conventions.
4. Add a tiny validation step or unit test that asserts: every entry has a valid url,
   a country that exists in Première's country list (or null), a region in Première's region
   enum, and a non-empty blurb. This guards future additions.

Do not build UI yet. Keep everything typed and importable.
```

**Review gate:** Check the data file and that types compile / validation passes.

---

## Phase 2 — Card component + directory page (static, no filter yet)

```
Read the spec and IMPLEMENTATION_NOTES.md.

Build the directory UI, static first (no filtering yet):
1. A MediaSourceCard component:
   - Renders the publication NAME as typography (optionally an auto-generated monogram from
     initials). NO external logo/image/favicon — text/CSS only.
   - Shows region + country tag, the owner-authored blurb, an "External ↗" affordance,
     and small "External media" labelling.
   - The whole card is a single anchor to source.url with target="_blank" rel="noopener noreferrer".
   - Reuse Première's existing card/surface styles and brand tokens identified in Phase 0.
2. A directory page/section (e.g. route "/journal" or "/read", matching repo routing conventions),
   rendering all sources in a responsive grid. Add it to the primary nav.
3. Sort sources sensibly (e.g. international first, then by region then name) for now.

Match the existing visual language. Prefer restrained, editorial typography consistent with
Première's "a reason to travel" brand. Do not introduce a new design system.
```

**Review gate:** Look at the page on desktop; confirm brand fit and the no-logo rule.

---

## Phase 3 — Country / region filtering (reuse performances pattern)

```
Read the spec and IMPLEMENTATION_NOTES.md.

Add country and region filtering to the media directory, REUSING the same filter pattern,
components, and state mechanism that performances use (identified in Phase 0). Do not invent
a new filter UI if one exists.

Requirements:
- Filter by region and by country, consistent with how performances filter.
- Sync filter state the same way performances do (e.g. URL query params) so links are shareable.
- "International"/global sources (scope:"international"): when a region or country filter is
  active, still surface them in a clearly separated "Global / International" group beneath the
  region-specific results, rather than hiding them. (A source physically HQ'd in a country can
  appear under that country too — follow the model's country field for that.)
- Empty state: if a filter yields zero national results, show a friendly empty message AND still
  show the Global group.
```

**Review gate:** Test region+country combinations and the empty state.

---

## Phase 4 — Brand polish, responsive, states, a11y

```
Read the spec and IMPLEMENTATION_NOTES.md.

Polish the media directory to launch quality:
1. Responsive: verify and fix layout from wide desktop down to small mobile (Première has known
   mobile-layout sensitivities — test narrow widths carefully). Cards should reflow cleanly.
2. States: hover/active/focus styling for cards; loading state if data is async; the empty state
   from Phase 3; a graceful fallback if the data file is somehow empty.
3. Accessibility: cards keyboard-focusable, visible focus ring, sufficient color contrast,
   sensible link text for screen readers (e.g. "Read Bachtrack (opens in new tab)").
4. Final pass on the legal guardrails: confirm NO third-party logos/images/favicons are loaded,
   every outbound link has rel="noopener noreferrer", and "External media" labelling is present.
5. Re-check brand consistency with the rest of Première.
```

**Review gate:** Mobile check + a11y keyboard pass.

---

## Phase 5 — Project docs (CLAUDE.md) + final QA

```
Read the spec and IMPLEMENTATION_NOTES.md.

1. Update CLAUDE.md (and any other project-wide docs/READMEs as appropriate) to add a section
   describing the new Journal / Ballet Media Directory module:
   - What it is and where it lives (routes, components, data file paths).
   - The geography model it reuses (link to the performances filter it shares).
   - The hard legal guardrails (text-only cards, no third-party logos/images, self-authored
     blurbs, External media labelling, rel="noopener noreferrer").
   - A step-by-step "How to add a new media source" (edit one data-file entry, required fields,
     run the validation/test) so future additions need no code changes.
2. Produce a short QA checklist result against Section 9 "Success criteria" of the spec,
   noting anything unmet.
3. List all status:"verify" sources again so I confirm their live URLs before launch.
```

**Review gate:** Final owner review, then confirm the `verify` URLs and launch.

---

## Appendix — Parking lot (v2 ideas, not now)

- Per-publisher outreach to license logos + a small live "latest headlines" strip via official RSS only.
- Language filter (in addition to country/region).
- Community-submitted sources with moderation (mirrors Tetheria's community-dataset direction).
- Editor's-pick / featured rotation on the Journal landing area.
