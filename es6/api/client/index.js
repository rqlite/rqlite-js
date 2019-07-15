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
 * @param {Object} query The RQLite API options
 * @returns {Object} The HTTP query
 */
export function createQuery (options = {}) {
  const { level, pretty, timings, transaction } = options
  // Create the API query and remove any undefined values.
  return omitBy({ level, pretty, timings, transaction }, isUndefined)
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
    if (!path) {
      throw new Error('The path argument is required')
    }
    return super.get({
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
    if (!path) {
      throw new Error('The path argument is required')
    }
    return super.post({
      uri: path,
      httpMethod: HTTP_METHOD_POST,
      query: createQuery(options),
      body: isArray(sql) ? sql : [sql],
    })
  }
}
