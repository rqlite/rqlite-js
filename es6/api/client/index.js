/**
 * Base API client for RQLite which abstracts the HTTP calls
 * @module api/client
 * @see https://rqlite.io/docs/api/api/
 */
import HttpRequest from '../../http-request'
import { HTTP_METHOD_GET, HTTP_METHOD_POST } from '../../http-request/http-methods'
import {
  QUERY_PARAM_ATOMIC,
  QUERY_PARAM_LEVEL,
  QUERY_PARAM_PRETTY,
  QUERY_PARAM_Q,
  QUERY_PARAM_TIMINGS,
  QUERY_PARAM_TRANSACTION,
} from '../query-params'

/**
 * RQLite API query-string / request options for data endpoints
 * @typedef {Object} ApiClientRequestOptions
 * @property {Boolean} [useLeader] Prefer the leader host
 * @property {String} [level] Consistency level
 * @property {Boolean} [pretty] Pretty-print JSON
 * @property {Boolean} [timings] Include timings
 * @property {Boolean} [atomic] Transaction (RQLite v5+)
 * @property {Boolean} [transaction] Transaction (RQLite v4)
 * @property {Boolean} [raw] Return raw HTTP response
 */

/**
 * Create the base HTTP query options from RQLite API options
 * @param {ApiClientRequestOptions} [options={}] The RQLite API options
 * @returns {Object} The HTTP query
 * @see https://rqlite.io/docs/api/api/
 * @see module:api/query-params
 */
export function createQuery (options = {}) {
  const { level, pretty, timings, atomic, transaction } = options

  // Remove all undefined values
  const query = {
    [QUERY_PARAM_LEVEL]: level,
    [QUERY_PARAM_PRETTY]: pretty,
    [QUERY_PARAM_TIMINGS]: timings,
    [QUERY_PARAM_ATOMIC]: atomic,
    [QUERY_PARAM_TRANSACTION]: transaction,
  }
  return Object.entries(query).reduce((acc, entry) => {
    const [key, val] = entry
    // Only take defined values
    if (typeof val !== 'undefined') {
      acc[key] = val
    }
    return acc
  }, {})
}

/**
 * Base API client for RQLite which abstracts the HTTP calls
 * from the user
 */
export default class ApiClient extends HttpRequest {
  /**
   * Perform a RQLite data API get request
   * @param {String} path The path for the request i.e. /db/query
   * @param {String} sql The SQL query
   * @param {ApiClientRequestOptions} [options={}] RQLite API options
   * @returns {Promise<{status: Number, body: *}>}
   * @see https://rqlite.io/docs/api/api/
   */
  async get (path, sql, options = {}) {
    const { useLeader } = options
    if (!path) {
      throw new Error('The path argument is required')
    }
    return super.get({
      useLeader,
      uri: path,
      httpMethod: HTTP_METHOD_GET,
      query: { ...createQuery(options), [QUERY_PARAM_Q]: sql },
    })
  }

  /**
   * Perform a RQLite data API post request
   * @param {String} path The path for the request i.e. /db/query
   * @param {String|String[]} sql The SQL query or queries
   * @param {ApiClientRequestOptions} [options={}] RQLite API options
   * @returns {Promise<{status: Number, body: *}>}
   * @see https://rqlite.io/docs/api/api/
   */
  async post (path, sql, options = {}) {
    const { useLeader } = options
    if (!path) {
      throw new Error('The path argument is required')
    }
    return super.post({
      useLeader,
      uri: path,
      httpMethod: HTTP_METHOD_POST,
      query: createQuery(options),
      body: Array.isArray(sql) ? sql : [sql],
    })
  }
}
