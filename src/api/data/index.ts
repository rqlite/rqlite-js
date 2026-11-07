/**
 * Data api client to perform RQLite data operations such as query and execute
 * @module api/data
 * @see https://rqlite.io/docs/api/api/
 * @see https://rqlite.io/docs/api/read-consistency/
 */
import ApiClient from '../client/index.js'
import type { ApiClientRequestOptions } from '../client/index.js'
import type { HttpResponse } from '../../http-request/index.js'
import { DataResults } from '../results/index.js'
import type { RqliteApiData } from '../results/data-results.js'
import { PATH_EXECUTE, PATH_QUERY } from '../paths.js'
import { CONSISTENCY_LEVEL_NONE } from '../consistency-levels.js'

export {
  PATH_QUERY,
  PATH_EXECUTE,
} from '../paths.js'

export {
  CONSISTENCY_LEVEL_NONE,
  CONSISTENCY_LEVEL_STRONG,
  CONSISTENCY_LEVEL_LINEARIZABLE,
  CONSISTENCY_LEVEL_WEAK,
} from '../consistency-levels.js'

export type DataRequestBaseOptions = {
  raw?: boolean
}

export type QueryRequestOptions = ApiClientRequestOptions & DataRequestBaseOptions
export type ExecuteRequestOptions = ApiClientRequestOptions & DataRequestBaseOptions

function handleResponse (
  response: HttpResponse,
  options: DataRequestBaseOptions = {},
): DataResults | HttpResponse {
  const { raw } = options
  const { body } = response
  if (raw) {
    return response
  }
  return new DataResults(body as RqliteApiData)
}

/**
 * Data api client to perform RQLite queries
 */
export default class DataApiClient extends ApiClient {
  /**
   * Send an RQLite query API request to the RQLite server
   * @see https://rqlite.io/docs/api/api/
   * @see https://rqlite.io/docs/api/read-consistency/
   */
  async query (
    sql: string | string[],
    options: QueryRequestOptions = {},
  ): Promise<DataResults | HttpResponse> {
    const { level } = options
    let { useLeader } = options
    if (level !== CONSISTENCY_LEVEL_NONE) {
      useLeader = true
    }
    let response: HttpResponse
    if (Array.isArray(sql)) {
      response = await super.post(PATH_QUERY, sql, { ...options, useLeader })
    } else {
      response = await super.get(PATH_QUERY, sql, { ...options, useLeader })
    }
    if (!useLeader) {
      this.setNextActiveHostIndex()
    }
    return handleResponse(response, options)
  }

  /**
   * Send an RQLite execute API request to the RQLite server
   * @see https://rqlite.io/docs/api/api/
   */
  async execute (
    sql: string | string[],
    options: ExecuteRequestOptions = {},
  ): Promise<DataResults | HttpResponse> {
    const response = await super.post(PATH_EXECUTE, sql, options)
    return handleResponse(response, options)
  }
}
