/**
 * Base API client for RQLite which abstracts the HTTP calls
 * @module api/client
 * @see https://rqlite.io/docs/api/api/
 */
import HttpRequest from '../../http-request/index.js'
import type { HttpRequestOptions, HttpResponse } from '../../http-request/index.js'
import { HTTP_METHOD_GET, HTTP_METHOD_POST } from '../../http-request/http-methods.js'
import {
  QUERY_PARAM_ATOMIC,
  QUERY_PARAM_LEVEL,
  QUERY_PARAM_PRETTY,
  QUERY_PARAM_Q,
  QUERY_PARAM_TIMINGS,
  QUERY_PARAM_TRANSACTION,
} from '../query-params.js'

export type ApiClientRequestOptions = {
  useLeader?: boolean
  level?: string
  pretty?: boolean
  timings?: boolean
  atomic?: boolean
  transaction?: boolean
  raw?: boolean
}

/**
 * Create the base HTTP query options from RQLite API options
 * @see https://rqlite.io/docs/api/api/
 * @see module:api/query-params
 */
export function createQuery (options: ApiClientRequestOptions = {}): Record<string, unknown> {
  const { level, pretty, timings, atomic, transaction } = options

  const query: Record<string, unknown> = {
    [QUERY_PARAM_LEVEL]: level,
    [QUERY_PARAM_PRETTY]: pretty,
    [QUERY_PARAM_TIMINGS]: timings,
    [QUERY_PARAM_ATOMIC]: atomic,
    [QUERY_PARAM_TRANSACTION]: transaction,
  }
  return Object.entries(query).reduce<Record<string, unknown>>((acc, entry) => {
    const [key, val] = entry
    if (typeof val !== 'undefined') {
      acc[key] = val
    }
    return acc
  }, {})
}

/**
 * Base API client for RQLite which abstracts the HTTP calls from the user
 */
export default class ApiClient extends HttpRequest {
  /**
   * Perform a RQLite data API get request
   * @see https://rqlite.io/docs/api/api/
   */
  async get (...args: any[]): Promise<HttpResponse> {
    const path = args[0] as string
    const sql = args[1] as string
    const options = (args[2] || {}) as ApiClientRequestOptions
    const { useLeader } = options
    if (!path) {
      throw new Error('The path argument is required')
    }
    return super.get({
      useLeader,
      uri: path,
      httpMethod: HTTP_METHOD_GET,
      query: { ...createQuery(options), [QUERY_PARAM_Q]: sql },
    } as HttpRequestOptions) as Promise<HttpResponse>
  }

  /**
   * Perform a RQLite data API post request
   * @see https://rqlite.io/docs/api/api/
   */
  async post (...args: any[]): Promise<HttpResponse> {
    const path = args[0] as string
    const sql = args[1] as string | string[]
    const options = (args[2] || {}) as ApiClientRequestOptions
    const { useLeader } = options
    if (!path) {
      throw new Error('The path argument is required')
    }
    return super.post({
      useLeader,
      uri: path,
      httpMethod: HTTP_METHOD_POST,
      query: createQuery(options),
      body: Array.isArray(sql) ? sql : [sql],
    } as HttpRequestOptions) as Promise<HttpResponse>
  }
}

