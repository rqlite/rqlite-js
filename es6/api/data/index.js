/**
 * Data api client to perform RQLite data operations such
 * as query and execute
 * @module api/data
 */
import ApiClient from '../client'
import { DataResults } from '../results'

/**
 * The RQLite query api path
 */
export const PATH_QUERY = '/db/query'

/**
 * The RQLite execute api path
 */
export const PATH_EXECUTE = '/db/execute'

/**
 * Read query consistency level none which means
 * any node can respond
 */
export const CONSISTENCY_LEVEL_NONE = 'none'

/**
 * Read query consistency strong which must come from
 * the master node
 */
export const CONSISTENCY_LEVEL_STRONG = 'strong'

/**
 * Read query consistency weak which must come from
 * the master node
 */
export const CONSISTENCY_LEVEL_WEAK = 'weak'

/**
 * Send an RQLite query API request to the RQLite server
 * @param {String} sql The SQL string to excute on the server
 * @param {Object} [options={}] RQLite api options
 * @param {Object} [options.raw] If true return the raw http resposne from
 * RQLite response
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
   * @param {String} sql The SQL string to excute on the server
   * @param {Object} [options={}] RQLite api options
   * @param {Object} [options.raw] If true return the raw http resposne from
   * RQLite response
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
   * @param {String} sql The SQL string to excute on the server
   * @param {Object} [options={}] RQLite api options
   */
  async execute (sql, options = {}) {
    const response = await super.post(PATH_EXECUTE, sql, options)
    return handleResponse(response, options)
  }
}
