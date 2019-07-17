/**
 * Status api client to perform RQLite status and diagnostics operations
 * @module api/status
 */
import ApiClient from '../client'

/**
 * The RQLite status api path
 */
export const PATH_STATUS = '/status'

/**
 * Data api client to perform RQLite queries
 */
export default class StatusApiClient extends ApiClient {
  /**
   * Get the RQLite server status
   * @param {String} sql The SQL string to excute on the server
   * @param {Object} [options={}] RQLite api options
   * @param {Object} [options.raw] If true return the raw http resposne from
   * RQLite response
   */
  async status (sql, options = {}) {
    return super.get(PATH_STATUS, sql, options)
  }
}
