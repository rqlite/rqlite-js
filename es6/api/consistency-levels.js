/**
 * RQLite read consistency level constants
 * @module api/consistency-levels
 * @see https://rqlite.io/docs/api/read-consistency/
 */

/**
 * Read query consistency level none which means
 * any node can respond
 */
export const CONSISTENCY_LEVEL_NONE = 'none'

/**
 * Read query consistency strong which must come from
 * the leader node
 */
export const CONSISTENCY_LEVEL_STRONG = 'strong'

/**
 * Read query consistency linearizable which must come from
 * the leader node
 */
export const CONSISTENCY_LEVEL_LINEARIZABLE = 'linearizable'

/**
 * Read query consistency weak (default) which must come from
 * the leader node
 */
export const CONSISTENCY_LEVEL_WEAK = 'weak'
