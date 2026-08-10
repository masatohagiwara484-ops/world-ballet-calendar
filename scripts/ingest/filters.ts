/**
 * Re-export of the shared title filters, which now live in `src/lib/ingest-filters`.
 *
 * They moved because the Telegram approval webhook (server code under `src/`)
 * must apply the SAME editorial filters as the terminal review pass, and the
 * project convention is that `scripts/` imports from `src/`, never the reverse.
 * Existing `./filters` imports across the ingest pipeline keep working unchanged.
 */
export {
  NON_PERFORMANCE_TITLE,
  ROYAL_OPERA_BALLET_TITLE,
  isNonPerformance,
  isExcludedForCompany,
} from '../../src/lib/ingest-filters'
