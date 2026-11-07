/**
 * Status api client to perform RQLite status and diagnostics operations
 * @module api/status
 * @see https://rqlite.io/docs/guides/monitoring-rqlite/
 */
import ApiClient from '../client/index.js'
import type { HttpResponse } from '../../http-request/index.js'
import { HTTP_METHOD_GET } from '../../http-request/http-methods.js'
import { PATH_STATUS } from '../paths.js'

export { PATH_STATUS } from '../paths.js'

export type StatusRequestOptions = {
  raw?: boolean
  attemptHostIndex?: number
  useLeader?: boolean
}

export type StatusAllHostsResponse = {
  response: HttpResponse
  host: string
}

/**
 * Data api client to perform RQLite status queries
 */
export default class StatusApiClient extends ApiClient {
  /**
   * Get the RQLite server status which defaults to the leader host
   * @see https://rqlite.io/docs/guides/monitoring-rqlite/
   */
  async status (options: StatusRequestOptions = {}): Promise<HttpResponse> {
    return this.fetch({
      ...options,
      uri: PATH_STATUS,
      httpMethod: HTTP_METHOD_GET,
      useLeader: typeof options.useLeader === 'boolean' ? options.useLeader : true,
    }) as Promise<HttpResponse>
  }

  /**
   * Get the RQLite server status for all hosts
   * @see https://rqlite.io/docs/guides/monitoring-rqlite/
   */
  async statusAllHosts (options: StatusRequestOptions = {}): Promise<StatusAllHostsResponse[]> {
    const hosts = this.getHosts()
    const promises = hosts.map(async (_host, attemptHostIndex) => {
      const response = await this.status({ ...options, useLeader: false, attemptHostIndex })
      return { response, host: hosts[attemptHostIndex] }
    })
    return Promise.all(promises)
  }
}
