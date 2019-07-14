/**
 * Status api client to perform RQLite status and diagnostics operations
 * @module api/status
 */
import ApiClient from '../client'

/**
 * @typedef {Object} HttpResponse
 * @property {Object} Body The HTTP response body parsed by JSON.parse()
 * @property {Number} statusCode The HTTP response code
 */

/**
 * @typedef {Object} StatusAllHostsResponse
 * @property {HttpResponse} response An HTTP response
 * @property {String} host The host name
 */

/**
 * The RQLite status api path
 */
export const PATH_STATUS = '/status'

/**
 * Data api client to perform RQLite queries
 */
export default class StatusApiClient extends ApiClient {
  /**
   * Get the RQLite server status which defaults to the master host
   * @param {Object} [options={}] RQLite api options
   * @returns {HttpResponse} An HTTP response object
   */
  async status (options = {}) {
    return super.get(PATH_STATUS, { useLeader: true, ...options })
  }

  /**
   * Get the RQLite server status for all hosts as an array of object with
   * the host and their status
   * @param {Object} [options={}] RQLite api options
   * @param {Object} [options.raw] If true return the raw http resposne from
   * RQLite response
   * @returns {StatusAllHostsResponse[]} An array of http response for the provide hosts
   */
  async statusAllHosts (options = {}) {
    const hosts = this.getHosts()
    // Get the status for all of the hosts
    const promises = hosts.map(async (_host, activeHostIndex) => {
      const response = await this.status({ ...options, activeHostIndex })
      return { response, host: hosts[activeHostIndex] }
    })
    return Promise.all(promises)
  }
}
