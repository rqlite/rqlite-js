/**
 * RQLite HTTP query parameter name constants
 * @module api/query-params
 * @see https://rqlite.io/docs/api/api/
 * @see https://rqlite.io/docs/api/read-consistency/
 * @see https://rqlite.io/docs/guides/backup/
 */

/**
 * Read consistency level query parameter
 */
export const QUERY_PARAM_LEVEL = 'level'

/**
 * Pretty-print JSON response query parameter
 */
export const QUERY_PARAM_PRETTY = 'pretty'

/**
 * Include timings in the response query parameter
 */
export const QUERY_PARAM_TIMINGS = 'timings'

/**
 * Atomic (transaction) query parameter for RQLite v5+
 */
export const QUERY_PARAM_ATOMIC = 'atomic'

/**
 * Legacy transaction query parameter for RQLite v4 and lower
 */
export const QUERY_PARAM_TRANSACTION = 'transaction'

/**
 * SQL statement query parameter for GET requests
 */
export const QUERY_PARAM_Q = 'q'

/**
 * Backup format query parameter
 */
export const QUERY_PARAM_FMT = 'fmt'
