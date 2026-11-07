/**
 * RQLite JSON response field name constants
 * @module api/results/result-fields
 * @see https://rqlite.io/docs/api/api/
 */

/**
 * Wall-clock time field on a result or response
 */
export const RESULT_FIELD_TIME = 'time'

/**
 * Rows affected field on an execute result
 */
export const RESULT_FIELD_ROWS_AFFECTED = 'rows_affected'

/**
 * Last insert id field on an execute result
 */
export const RESULT_FIELD_LAST_INSERT_ID = 'last_insert_id'

/**
 * Column names field on a query result
 */
export const RESULT_FIELD_COLUMNS = 'columns'

/**
 * Row values field on a query result
 */
export const RESULT_FIELD_VALUES = 'values'

/**
 * Error message field on a result
 */
export const RESULT_FIELD_ERROR = 'error'

/**
 * Structured error object field (rqlite v10+)
 * @see https://rqlite.io/docs/api/api/
 */
export const RESULT_FIELD_ERROR_V2 = 'error_v2'

/**
 * Top-level results array field on an API response body
 */
export const RESULT_FIELD_RESULTS = 'results'
