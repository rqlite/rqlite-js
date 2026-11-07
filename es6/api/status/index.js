/**
 * Status api client to perform RQLite status and diagnostics operations
 * @module api/status
 * @see https://rqlite.io/docs/guides/monitoring-rqlite/
 */
import ApiClient from '../client'
import { HTTP_METHOD_GET } from '../../http-request/http-methods'
import { PATH_STATUS } from '../paths'

export { PATH_STATUS } from '../paths'

/**
 * @typedef {Object} HttpResponse
 * @property {Object|String} body The HTTP response body
 * @property {Number} status The HTTP response status code
 */

/**
 * @typedef {Object} StatusRequestOptions
 * @property {Boolean} [raw] If true return the raw http response
 * @property {Number} [attemptHostIndex] Host index to query (used by statusAllHosts)
 * @property {Boolean} [useLeader] Prefer the leader host
 */

/**
 * @typedef {Object} StatusAllHostsResponse
 * @property {HttpResponse} response An HTTP response
 * @property {String} host The host name
 */

/**
 * Data api client to perform RQLite status queries
 */
export default class StatusApiClient extends ApiClient {
  /**
   * Get the RQLite server status which defaults to the leader host
   * @param {StatusRequestOptions} [options={}] RQLite api options
   * @returns {Promise<HttpResponse>} An HTTP response object
   * @see https://rqlite.io/docs/guides/monitoring-rqlite/
   */
  async status (options = {}) {
    return this.fetch({
      ...options,
      uri: PATH_STATUS,
      httpMethod: HTTP_METHOD_GET,
      useLeader: typeof options.useLeader === 'boolean' ? options.useLeader : true,
    })
  }

  /**
   * Get the RQLite server status for all hosts as an array of objects with
   * the host and their status
   * @param {StatusRequestOptions} [options={}] RQLite api options
   * @returns {Promise<StatusAllHostsResponse[]>} An array of http response for the provide hosts
   * @see https://rqlite.io/docs/guides/monitoring-rqlite/
   */
  async statusAllHosts (options = {}) {
    const hosts = this.getHosts()
    // Get the status for all of the hosts
    const promises = hosts.map(async (_host, attemptHostIndex) => {
      const response = await this.status({ ...options, useLeader: false, attemptHostIndex })
      return { response, host: hosts[attemptHostIndex] }
    })
    return Promise.all(promises)
  }
}
