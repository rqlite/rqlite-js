/**
 * Data api client to perform RQLite data operations such
 * as query and execute
 * @module api/data
 * @see https://rqlite.io/docs/api/api/
 * @see https://rqlite.io/docs/api/read-consistency/
 */
import ApiClient from '../client'
import { DataResults } from '../results'
import { PATH_EXECUTE, PATH_QUERY } from '../paths'
import { CONSISTENCY_LEVEL_NONE } from '../consistency-levels'

export {
  PATH_QUERY,
  PATH_EXECUTE,
} from '../paths'

export {
  CONSISTENCY_LEVEL_NONE,
  CONSISTENCY_LEVEL_STRONG,
  CONSISTENCY_LEVEL_LINEARIZABLE,
  CONSISTENCY_LEVEL_WEAK,
} from '../consistency-levels'

/**
 * @typedef {import('../client').ApiClientRequestOptions} ApiClientRequestOptions
 */

/**
 * Data request base options
 * @typedef {Object} DataRequestBaseOptions
 * @property {Boolean} [raw] If true return the raw http response from
 * RQLite response
 */

/**
 * Data query request options
 * @typedef {ApiClientRequestOptions & DataRequestBaseOptions} QueryRequestOptions
 */

/**
 * Data execute request options
 * @typedef {ApiClientRequestOptions & DataRequestBaseOptions} ExecuteRequestOptions
 */

/**
 * Handle an RQLite data API response
 * @param {{status: Number, body: Object}} response The HTTP response
 * @param {DataRequestBaseOptions} [options={}] RQLite api options
 * @returns {DataResults|{status: Number, body: Object}}
 */
function handleResponse (response, options = {}) {
  const { raw } = options
  const { body } = response
  if (raw) {
    return response
  }
  return new DataResults(body)
}

/**
 * Data api client to perform RQLite queries
 */
export default class DataApiClient extends ApiClient {
  /**
   * Send an RQLite query API request to the RQLite server
   * @param {String|String[]} sql The SQL string to execute on the server
   * @param {QueryRequestOptions} [options={}] RQLite api options
   * @returns {Promise<DataResults|{status: Number, body: Object}>}
   * @see https://rqlite.io/docs/api/api/
   * @see https://rqlite.io/docs/api/read-consistency/
   * @see module:api/consistency-levels
   */
  async query (sql, options = {}) {
    const { level } = options
    let { useLeader } = options
    // Weak and strong consistency will be redirect to the master anyway
    // so skip the redirect HTTP response and got right to the master
    if (level !== CONSISTENCY_LEVEL_NONE) {
      useLeader = true
    }
    let response
    if (Array.isArray(sql)) {
      response = await super.post(PATH_QUERY, sql, { ...options, useLeader })
    } else {
      response = await super.get(PATH_QUERY, sql, { ...options, useLeader })
    }
    // If round robin is true try and balance selects across hosts when
    // the master node is not queried directly
    if (!useLeader) {
      this.setNextActiveHostIndex()
    }
    return handleResponse(response, options)
  }

  /**
   * Send an RQLite execute API request to the RQLite server
   * @param {String|String[]} sql The SQL string to execute on the server
   * @param {ExecuteRequestOptions} [options={}] RQLite execute api options
   * @returns {Promise<DataResults|{status: Number, body: Object}>}
   * @see https://rqlite.io/docs/api/api/
   */
  async execute (sql, options = {}) {
    const response = await super.post(PATH_EXECUTE, sql, options)
    return handleResponse(response, options)
  }
}
