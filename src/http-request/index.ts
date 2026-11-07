/**
 * Plain HTTP client to be used when creating RQLite specific API HTTP clients
 * @module http-request
 * @see https://rqlite.io/docs/api/api/
 */
import { Readable } from 'node:stream'
import type { Agent as HttpAgent } from 'node:http'
import type { Agent as HttpsAgent } from 'node:https'
import {
  HTTP_METHOD_GET,
  HTTP_METHOD_POST,
} from './http-methods.js'
import {
  CONTENT_TYPE_APPLICATION_JSON,
} from './content-types.js'
import { ERROR_HTTP_REQUEST_MAX_REDIRECTS } from './errors.js'
import {
  RETRYABLE_ERROR_CODES,
  RETRYABLE_HTTP_METHODS,
  RETRYABLE_STATUS_CODES,
} from './retryable.js'
import { AUTH_PASSWORD, AUTH_USERNAME } from './auth-keys.js'
import {
  HTTP_HEADER_ACCEPT,
  HTTP_HEADER_CONTENT_TYPE,
  HTTP_HEADER_LOCATION,
} from './http-headers.js'

export type HttpAuthentication = {
  username?: string
  password?: string
}

export type HttpRequestOptions = {
  auth?: HttpAuthentication
  body?: unknown
  headers?: Record<string, string>
  httpMethod?: string
  query?: Record<string, unknown>
  stream?: boolean
  timeout?: number
  uri?: string
  useLeader?: boolean
  retries?: number
  maxRedirects?: number
  attempt?: number
  retryAttempt?: number
  redirectAttempt?: number
  attemptHostIndex?: number
  exponentailBackoffBase?: number
  exponentailBackoffExponent?: number
  json?: boolean
  httpAgent?: HttpAgent | DispatcherLike
  httpsAgent?: HttpsAgent | DispatcherLike
}

/** Minimal undici/Node fetch dispatcher shape */
export type DispatcherLike = {
  dispatch?: (...args: unknown[]) => unknown
  close?: () => Promise<void>
  destroy?: () => Promise<void>
}

export type HttpResponse = {
  status: number
  body: unknown
}

export type HttpRequestConstructorOptions = {
  authentication?: HttpAuthentication
  activeHostRoundRobin?: boolean
  httpAgent?: HttpAgent | DispatcherLike
  httpsAgent?: HttpsAgent | DispatcherLike
  retryableErrorCodes?: Set<string> | string[]
  retryableStatusCodes?: Set<number> | number[]
  retryableHttpMethods?: Set<string> | string[]
  exponentailBackoffBase?: number
  exponentailBackoffExponent?: number
}

/**
 * The default timeout value
 */
export const DEAULT_TIMEOUT = 30000

/**
 * The default to retry a request using the next host in the chain
 */
export const DEAULT_RETRY_DELAY = 30000

/**
 * Create default header for all HTTP requests
 */
export function createDefaultHeaders (headers: Record<string, string> = {}): Record<string, string> {
  const accept = headers[HTTP_HEADER_ACCEPT] || CONTENT_TYPE_APPLICATION_JSON
  return { ...headers, [HTTP_HEADER_ACCEPT]: accept }
}

/**
 * Clean the request path remove / from the beginning
 */
function cleanPath (path: string): string {
  return String(path).replace(/^\//, '')
}

/**
 * Serialize query params similar to qs arrayFormat: 'brackets'
 */
export function stringifyQuery (params: Record<string, unknown> = {}): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'undefined') {
      return
    }
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        search.append(`${key}[]`, String(entry))
      })
      return
    }
    search.append(key, String(value))
  })
  return search.toString()
}

function basicAuthHeader (username: string, password: string): string {
  const token = Buffer.from(`${username}:${password}`).toString('base64')
  return `Basic ${token}`
}

function getErrorCode (error: unknown): string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined
  }
  const err = error as { code?: string, cause?: { code?: string }, name?: string }
  if (typeof err.code === 'string') {
    return err.code
  }
  if (err.cause && typeof err.cause.code === 'string') {
    return err.cause.code
  }
  if (err.name === 'AbortError' || err.name === 'TimeoutError') {
    return 'ETIMEDOUT'
  }
  return undefined
}

/**
 * Returns the next wait interval, in milliseconds, using an exponential
 * backoff algorithm.
 */
export function getWaitTimeExponential (attempt = 0, base = 100, exponent = 2): number {
  if (attempt === 0) {
    return 0
  }
  return (exponent ** attempt) * base
}

/**
 * Generic HTTP Request class which all RQLiteJS clients should extend
 */
export default class HttpRequest {
  activeHostIndex = 0

  activeHostRoundRobin = true

  absoluteUriPattern = /^https?:\/\//

  hosts: string[] = []

  httpAgent?: HttpAgent | DispatcherLike

  httpsAgent?: HttpsAgent | DispatcherLike

  leaderHostIndex = 0

  retryableErrorCodes: Set<string> = RETRYABLE_ERROR_CODES

  retryableStatusCodes: Set<number> = RETRYABLE_STATUS_CODES

  retryableHttpMethods: Set<string> = RETRYABLE_HTTP_METHODS

  exponentailBackoffBase = 100

  exponentailBackoffExponent = 1.1

  authentication = new Map<string, string>()

  constructor (hosts: string[] | string, options: HttpRequestConstructorOptions = {}) {
    this.setHosts(hosts)
    if (this.getTotalHosts() === 0) {
      throw new Error('At least one host must be provided')
    }
    const {
      activeHostRoundRobin = true,
      httpAgent,
      httpsAgent,
      retryableErrorCodes,
      retryableStatusCodes,
      retryableHttpMethods,
      exponentailBackoffExponent,
      exponentailBackoffBase,
      authentication,
    } = options
    if (typeof authentication === 'object') {
      const { username, password } = authentication
      if (username) {
        this.authentication.set(AUTH_USERNAME, username)
      }
      if (password) {
        this.authentication.set(AUTH_PASSWORD, password)
      }
    }
    if (typeof activeHostRoundRobin !== 'undefined') {
      this.setActiveHostRoundRobin(activeHostRoundRobin)
    }
    if (typeof httpAgent !== 'undefined') {
      this.setHttpAgent(httpAgent)
    }
    if (typeof httpsAgent !== 'undefined') {
      this.setHttpsAgent(httpsAgent)
    }
    if (retryableErrorCodes instanceof Set || Array.isArray(retryableErrorCodes)) {
      this.setRetryableErrorCodes(
        Array.isArray(retryableErrorCodes) ? new Set(retryableErrorCodes) : retryableErrorCodes,
      )
    }
    if (retryableStatusCodes instanceof Set || Array.isArray(retryableStatusCodes)) {
      this.setRetryableStatusCodes(
        Array.isArray(retryableStatusCodes) ? new Set(retryableStatusCodes) : retryableStatusCodes,
      )
    }
    if (retryableHttpMethods instanceof Set || Array.isArray(retryableHttpMethods)) {
      this.setRetryableHttpMethods(
        Array.isArray(retryableHttpMethods) ? new Set(retryableHttpMethods) : retryableHttpMethods,
      )
    }
    if (Number.isFinite(exponentailBackoffBase)) {
      this.setExponentailBackoffBase(exponentailBackoffBase as number)
    }
    if (Number.isFinite(exponentailBackoffExponent)) {
      this.setExponentailBackoffExponent(exponentailBackoffExponent as number)
    }
  }

  setAuthentication (authentication: HttpAuthentication = {}): void {
    const { username, password } = authentication
    if (username) {
      this.authentication.set(AUTH_USERNAME, username)
    }
    if (password) {
      this.authentication.set(AUTH_PASSWORD, password)
    }
  }

  setExponentailBackoffBase (exponentailBackoffBase: number): void {
    this.exponentailBackoffBase = exponentailBackoffBase
  }

  getExponentailBackoffBase (): number {
    return this.exponentailBackoffBase
  }

  setExponentailBackoffExponent (exponentailBackoffExponent: number): void {
    this.exponentailBackoffExponent = exponentailBackoffExponent
  }

  getExponentailBackoffExponent (): number {
    return this.exponentailBackoffExponent
  }

  setRetryableErrorCodes (retryableErrorCodes: Set<string>): void {
    this.retryableErrorCodes = retryableErrorCodes
  }

  getRetryableErrorCodes (): Set<string> {
    return this.retryableErrorCodes
  }

  setRetryableStatusCodes (retryableStatusCodes: Set<number>): void {
    this.retryableStatusCodes = retryableStatusCodes
  }

  getRetryableStatusCodes (): Set<number> {
    return this.retryableStatusCodes
  }

  setRetryableHttpMethods (retryableHttpMethods: Set<string>): void {
    this.retryableHttpMethods = retryableHttpMethods
  }

  getRetryableHttpMethods (): Set<string> {
    return this.retryableHttpMethods
  }

  setHttpAgent (httpAgent: HttpAgent | DispatcherLike): void {
    this.httpAgent = httpAgent
  }

  getHttpAgent (): HttpAgent | DispatcherLike | undefined {
    return this.httpAgent
  }

  setHttpsAgent (httpsAgent: HttpsAgent | DispatcherLike): void {
    this.httpsAgent = httpsAgent
  }

  getHttpsAgent (): HttpsAgent | DispatcherLike | undefined {
    return this.httpsAgent
  }

  setHosts (hosts: string[] | string): void {
    const list = !Array.isArray(hosts) ? String(hosts).split(',') : hosts
    this.hosts = list.reduce<string[]>((acc, v) => {
      const host = String(v).trim().replace(/\/$/, '')
      if (!host) {
        return acc
      }
      return acc.concat(host)
    }, [])
  }

  getHosts (): string[] {
    return this.hosts
  }

  findHostIndex (host: string): number {
    let parsedHostToFind: URL
    try {
      parsedHostToFind = new URL(host)
    } catch {
      return -1
    }
    return this.getHosts().findIndex((v) => {
      try {
        const parsedHost = new URL(v)
        return (['hostname', 'protocol', 'port', 'pathname'] as const).every(
          (field) => parsedHostToFind[field] === parsedHost[field],
        )
      } catch {
        return false
      }
    })
  }

  getActiveHost (useLeader?: boolean): string {
    const activeHostIndex = useLeader ? this.getLeaderHostIndex() : this.getActiveHostIndex()
    return this.getHosts()[activeHostIndex]
  }

  setActiveHostIndex (activeHostIndex: number): number {
    if (!Number.isFinite(activeHostIndex)) {
      throw new Error('The activeHostIndex should be a finite number')
    }
    const totalHosts = this.getTotalHosts()
    if (activeHostIndex < 0) {
      this.activeHostIndex = 0
    } else if (activeHostIndex >= totalHosts) {
      this.activeHostIndex = totalHosts - 1
    } else {
      this.activeHostIndex = activeHostIndex
    }
    return this.activeHostIndex
  }

  getLeaderHostIndex (): number {
    return this.leaderHostIndex
  }

  setLeaderHostIndex (leaderHostIndex: number): number {
    if (!Number.isFinite(leaderHostIndex)) {
      throw new Error('The leaderHostIndex should be a finite number')
    }
    const totalHosts = this.getTotalHosts()
    if (leaderHostIndex < 0) {
      this.leaderHostIndex = 0
    } else if (leaderHostIndex > totalHosts) {
      this.leaderHostIndex = totalHosts - 1
    } else {
      this.leaderHostIndex = leaderHostIndex
    }
    return this.leaderHostIndex
  }

  getActiveHostIndex (): number {
    return this.activeHostIndex
  }

  setActiveHostRoundRobin (activeHostRoundRobin: boolean): void {
    if (typeof activeHostRoundRobin !== 'boolean') {
      throw new Error('The activeHostRoundRobin argument must be boolean')
    }
    this.activeHostRoundRobin = activeHostRoundRobin
  }

  getActiveHostRoundRobin (): boolean {
    return this.activeHostRoundRobin
  }

  getNextActiveHostIndex (activeHostIndex = this.getActiveHostIndex()): number {
    const totalHosts = this.getTotalHosts()
    const nextIndex = activeHostIndex + 1
    if (totalHosts === nextIndex) {
      return 0
    }
    return nextIndex
  }

  setNextActiveHostIndex (): void {
    if (!this.getActiveHostRoundRobin()) {
      return
    }
    const totalHosts = this.getTotalHosts()
    if (this.getActiveHostRoundRobin() && totalHosts <= 1) {
      return
    }
    this.setActiveHostIndex(this.getNextActiveHostIndex())
  }

  getTotalHosts (): number {
    return this.getHosts().length
  }

  uriIsAbsolute (uri: string): boolean {
    return this.absoluteUriPattern.test(uri)
  }

  requestIsRetryable (options: {
    statusCode?: number
    errorCode?: string
    httpMethod?: string
  } = {}): boolean {
    const {
      statusCode,
      errorCode,
      httpMethod,
    } = options
    if (!httpMethod || !this.getRetryableHttpMethods().has(httpMethod)) {
      return false
    }
    if (statusCode && this.getRetryableStatusCodes().has(statusCode)) {
      return true
    }
    if (errorCode && this.getRetryableErrorCodes().has(errorCode)) {
      return true
    }
    return false
  }

  /**
   * Perform an HTTP request using the provided options
   */
  async fetch (options: HttpRequestOptions = {}): Promise<HttpResponse | Readable> {
    const {
      body,
      headers = {},
      httpMethod = HTTP_METHOD_GET,
      query,
      stream = false,
      timeout = DEAULT_TIMEOUT,
      useLeader = false,
      retries = this.getTotalHosts() * 3,
      maxRedirects = 10,
      attempt = 0,
      retryAttempt = 0,
      redirectAttempt = 0,
      attemptHostIndex,
      exponentailBackoffExponent = this.getExponentailBackoffExponent(),
      exponentailBackoffBase = this.getExponentailBackoffBase(),
      httpAgent = this.getHttpAgent(),
      httpsAgent = this.getHttpsAgent(),
    } = options

    const activeHost = Number.isFinite(attemptHostIndex)
      ? this.getHosts()[attemptHostIndex as number]
      : this.getActiveHost(useLeader)

    let { uri } = options
    if (!uri) {
      throw new Error('The uri option is required')
    }
    uri = this.uriIsAbsolute(uri) ? uri : `${activeHost}/${cleanPath(uri)}`

    const requestHeaders = createDefaultHeaders(headers)
    if (this.authentication.size) {
      const username = this.authentication.get(AUTH_USERNAME) || ''
      const password = this.authentication.get(AUTH_PASSWORD) || ''
      requestHeaders.Authorization = basicAuthHeader(username, password)
    }

    const url = new URL(uri)
    if (query && typeof query === 'object') {
      const serialized = stringifyQuery(query as Record<string, unknown>)
      if (serialized) {
        url.search = serialized
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const fetchInit: RequestInit & { dispatcher?: unknown } = {
      method: httpMethod,
      headers: requestHeaders,
      redirect: 'manual',
      signal: controller.signal,
    }

    // Only pass undici-compatible dispatchers. Node http(s).Agent is still
    // accepted via options for API compatibility but is not a fetch dispatcher.
    const agent = url.protocol === 'https:' ? httpsAgent : httpAgent
    if (agent && typeof (agent as DispatcherLike).dispatch === 'function') {
      // undici Dispatcher; cast avoids Node http.Agent type conflict
      const init = fetchInit as { dispatcher?: unknown }
      init.dispatcher = agent
    }

    if (typeof body !== 'undefined' && body !== null) {
      if (Buffer.isBuffer(body) || typeof body === 'string') {
        fetchInit.body = body as string | Buffer
      } else {
        fetchInit.body = JSON.stringify(body)
        if (!requestHeaders[HTTP_HEADER_ACCEPT]) {
          requestHeaders[HTTP_HEADER_ACCEPT] = CONTENT_TYPE_APPLICATION_JSON
        }
        if (!(HTTP_HEADER_CONTENT_TYPE in requestHeaders)
          && !Object.keys(requestHeaders).some((k) => k.toLowerCase() === 'content-type')) {
          requestHeaders[HTTP_HEADER_CONTENT_TYPE] = CONTENT_TYPE_APPLICATION_JSON
        }
        fetchInit.headers = requestHeaders
      }
    }

    const retryOrRedirect = async (
      responseStatus: number | undefined,
      responseHeaders: Headers | Record<string, string> | undefined,
      errorCode: string | undefined,
      error: unknown,
    ): Promise<HttpResponse | Readable> => {
      const retryable = this.requestIsRetryable({
        statusCode: responseStatus,
        errorCode,
        httpMethod,
      })

      let nextAttemptHostIndex = Number.isFinite(attemptHostIndex)
        ? (attemptHostIndex as number)
        : this.getActiveHostIndex()
      nextAttemptHostIndex += 1
      if (nextAttemptHostIndex === this.getTotalHosts()) {
        nextAttemptHostIndex = 0
      }

      if (responseStatus === 301 || responseStatus === 302) {
        if (redirectAttempt >= maxRedirects) {
          throw new ERROR_HTTP_REQUEST_MAX_REDIRECTS(
            `The maximum number of redirects ${maxRedirects} has been reached`,
          )
        }
        let location: string | undefined
        if (responseHeaders && typeof (responseHeaders as Headers).get === 'function') {
          location = (responseHeaders as Headers).get(HTTP_HEADER_LOCATION)
            || (responseHeaders as Headers).get(HTTP_HEADER_LOCATION.toLowerCase())
            || undefined
        } else if (responseHeaders && typeof responseHeaders === 'object') {
          const headerMap = responseHeaders as Record<string, string>
          location = headerMap[HTTP_HEADER_LOCATION.toLowerCase()]
            || headerMap[HTTP_HEADER_LOCATION]
        }
        if (useLeader && location) {
          const newLeaderHostIndex = this.findHostIndex(location)
          if (newLeaderHostIndex > -1) {
            this.setLeaderHostIndex(newLeaderHostIndex)
          }
        }
        return this.fetch({
          ...options,
          uri: location,
          attempt: attempt + 1,
          redirectAttempt: redirectAttempt + 1,
          attemptHostIndex: nextAttemptHostIndex,
        })
      }

      if (retryable && retryAttempt < retries) {
        const waitTime = getWaitTimeExponential(
          retryAttempt,
          exponentailBackoffBase,
          exponentailBackoffExponent,
        )
        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), waitTime)
        })
        return this.fetch({
          ...options,
          attempt: attempt + 1,
          retryAttempt: retryAttempt + 1,
          attemptHostIndex: nextAttemptHostIndex,
        })
      }

      if (error instanceof Error) {
        throw error
      }
      const wrapped = new Error(
        (error as { message?: string })?.message || String(error),
      )
      Object.assign(wrapped, error)
      throw wrapped
    }

    try {
      const response = await fetch(url as unknown as string, fetchInit as RequestInit)
      clearTimeout(timeoutId)

      if (response.status === 301 || response.status === 302) {
        return retryOrRedirect(response.status, response.headers, undefined, new Error(
          `Redirect ${response.status}`,
        ))
      }

      // Match axios: non-2xx responses reject (after retry logic when applicable)
      if (response.status >= 400) {
        return retryOrRedirect(
          response.status,
          response.headers,
          undefined,
          Object.assign(new Error(`HTTP ${response.status}`), {
            response: {
              status: response.status,
              headers: Object.fromEntries(response.headers.entries()),
            },
          }),
        )
      }

      if (stream) {
        if (!response.body) {
          return Readable.from([])
        }
        return Readable.fromWeb(response.body as import('stream/web').ReadableStream)
      }

      const contentType = response.headers.get('content-type') || ''
      let responseBody: unknown
      if (contentType.includes('application/json')) {
        responseBody = await response.json()
      } else {
        responseBody = await response.text()
      }

      return {
        body: responseBody,
        status: response.status,
      }
    } catch (e) {
      clearTimeout(timeoutId)
      const errorCode = getErrorCode(e)
      const err = e as { response?: { status?: number, headers?: Record<string, string> } }
      const responseStatus = err.response?.status
      const responseHeaders = err.response?.headers
      return retryOrRedirect(responseStatus, responseHeaders, errorCode, e)
    }
  }

  // Rest args keep subclass ApiClient get(path, sql, options) compatible (v2 JS shape)
  async get (...args: any[]): Promise<HttpResponse | Readable> {
    const options = (args[0] || {}) as HttpRequestOptions
    return this.fetch({ ...options, httpMethod: HTTP_METHOD_GET })
  }

  async post (...args: any[]): Promise<HttpResponse | Readable> {
    const options = (args[0] || {}) as HttpRequestOptions
    return this.fetch({ ...options, httpMethod: HTTP_METHOD_POST })
  }
}
