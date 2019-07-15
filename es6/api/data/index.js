/**
 * Data api client to perform RQLite data operations such
 * as query and execute
 * @module api/data
 */
import isArray from 'lodash/isArray'
import ApiClient from '../client'

/**
 * The RQLite query query api path
 */
export const PATH_QUERY = '/db/query'

/**
 * The RQLite execute api path
 */
export const PATH_EXECUTE = '/db/execute'

/**
 * Data api client to perform RQLite queries
 */
export default class DataApiClient extends ApiClient {
  /**
   * Send an RQLite query API request to the RQLite server
   * @param {String} sql The SQL string to excute on the server.
   * @param {Object} [options={}] HTTP client options.
   */
  async query (sql, options = {}) {
    if (isArray(sql)) {
      return super.post(PATH_QUERY, sql, options)
    }
    return super.get(PATH_QUERY, sql, options)
  }

  /**
   * Send an RQLite execute API request to the RQLite server
   * @param {String} sql The SQL string to excute on the server.
   * @param {Object} [options={}] HTTP client options.
   */
  async execute (sql, options = {}) {
    return super.post(PATH_EXECUTE, sql, options)
  }
}
