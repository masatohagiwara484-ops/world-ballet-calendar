/**
 * Title-based content filters shared by the ingest pipeline and the cleanup tool.
 *
 * These encode editorial decisions about what belongs on a PERFORMANCE calendar:
 *   • NON_PERFORMANCE_TITLE — talks, insights and behind-the-scenes events that
 *     some house calendars list alongside real performances (the owner chose to
 *     exclude these). Galas, school shows, tours and classes are intentionally
 *     NOT matched — they are kept.
 *   • ROYAL_OPERA_BALLET_TITLE — the Royal Opera House publishes one calendar for
 *     both companies, so ballet / shared events leak onto the Royal Opera filter.
 *     These titles belong to Royal Ballet only and are dropped from Royal Opera.
 *
 * Keeping them here (not inline) lets run-ingest filter them on the way IN and
 * clean-published reject any that were already written, from one definition.
 */

/**
 * Talks / insights / behind-the-scenes — not performances.
 *
 * Second line added 2026-07-14 from a real review pass: retail / education /
 * social / backstage-tour items a curated performance calendar shouldn't list
 * as shows a traveller comes to WATCH — costume sales, guided tours
 * (German "Führung"), open adult classes, and the "Ballett & Brezeln" social.
 * This narrows the earlier "tours and classes are kept" default to exclude
 * only these clearly-non-viewable items; galas, school SHOWS, and staged
 * matinees are still deliberately kept. Owner-overridable — delete the second
 * line to restore the previous keep-everything behaviour.
 */
export const NON_PERFORMANCE_TITLE =
  /behind the scenes|insight|insider|tester|click in|kantinentalk|\btalk\b|eintauchen|open house|study day|meet the artist|im gespräch|q ?& ?a/i

// NOTE on "Führung": German compounds it, so a plain /führung/ would wrongly
// match "Aufführung" (= a performance) and "Uraufführung" (= a premiere). Match
// only the guided-tour compounds + standalone word, never the -aufführung forms.
const NON_VIEWABLE_TITLE =
  /costume sale|kost[üu]mverkauf|ballettf[üu]hrung|opernf[üu]hrung|hausf[üu]hrung|\bf[üu]hrung\b|guided tour|adult ballet|adult class|open class|offene klasse|brezeln|\bpretzel|\bworkshop\b|werkstatt|patenklasse|tanz für mich|sneak.?klub/i

/** Ballet / shared RBO events that must not appear under the Royal Opera. */
export const ROYAL_OPERA_BALLET_TITLE =
  /next generation festival|live at lunch|marianela|carlos acosta/i

/** True when a title is a talk / behind-the-scenes event, not a performance. */
export function isNonPerformance(title: string): boolean {
  return NON_PERFORMANCE_TITLE.test(title) || NON_VIEWABLE_TITLE.test(title)
}

/** True when a row should be dropped from the given company (editorial rules). */
export function isExcludedForCompany(companySlug: string, title: string): boolean {
  if (isNonPerformance(title)) return true
  if (companySlug === 'royal-opera' && ROYAL_OPERA_BALLET_TITLE.test(title)) return true
  return false
}
