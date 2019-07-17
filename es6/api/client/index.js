/**
 * Base API client for RQLite which abstracts the HTTP calls
 * @module api/client
 */
import omitBy from 'lodash/omitBy'
import isUndefined from 'lodash/isUndefined'
import isArray from 'lodash/isArray'
import assign from 'lodash/assign'
import HttpRequest from '../../http-request'
import { HTTP_METHOD_GET, HTTP_METHOD_POST } from '../../http-request/http-methods'

/**
 * Create the base HTTP query options from RQLite API options
 * @param {Object} [options={}] The RQLite API options
 * @param {String} [options.level] The consistency level
 * @param {String} [options.pretty] Pretty print the response body
 * @param {String} [options.timings] Provide query timings
 * @param {String} [options.atomic] Treat all commands in the request as a single transaction
 * for RQLite v5 and higher
 * @param {String} [options.transaction] Treat all commands in the request as a single transaction
 * for RQLite v4 and lower
 * @returns {Object} The HTTP query
 */
export function createQuery (options = {}) {
  const { level, pretty, timings, atomic, transaction } = options
  // Create the API query and remove any undefined values.
  return omitBy({ level, pretty, timings, atomic, transaction }, isUndefined)
}

/**
 * Base API client for RQLite which abstracts the HTTP calls
 * from the user
 */
export default class ApiClient extends HttpRequest {
  /**
   * Perform a RQLite data API get request
   * @param {String} path The path for the request i.e. /db/query
   * @param {Object} [options={}] RQLite API options
   */
  async get (path, sql, options = {}) {
    const { useMaster } = options
    if (!path) {
      throw new Error('The path argument is required')
    }
    return super.get({
      useMaster,
      uri: path,
      httpMethod: HTTP_METHOD_GET,
      query: assign({}, createQuery(options), { q: sql }),
    })
  }

  /**
   * Perform a RQLite data API post request
   * @param {String} path The path for the request i.e. /db/query
   * @param {String[]|String} path The path for the request i.e. /db/query
   * @param {Object} [options={}] RQLite API options
   */
  async post (path, sql, options = {}) {
    const { useMaster } = options
    if (!path) {
      throw new Error('The path argument is required')
    }
    return super.post({
      useMaster,
      uri: path,
      httpMethod: HTTP_METHOD_POST,
      query: createQuery(options),
      body: isArray(sql) ? sql : [sql],
    })
  }
}
