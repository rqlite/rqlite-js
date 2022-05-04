/**
 * Plain HTTP client to be used when creating RQLite specific API HTTP clients
 * @module http-request
 */
import axios from 'axios'
import { stringify as stringifyQuery } from 'qs'
import { parse as parseUrl } from 'url'
import {
  HTTP_METHOD_GET,
  HTTP_METHOD_POST,
} from './http-methods.mjs'
import {
  CONTENT_TYPE_APPLICATION_JSON,
  // CONTENT_TYPE_APPLICATION_OCTET_STREAM,
} from './content-types.mjs'
import { ERROR_HTTP_REQUEST_MAX_REDIRECTS } from './errors.mjs'
import {
  RETRYABLE_ERROR_CODES,
  RETRYABLE_HTTP_METHODS,
  RETRYABLE_STATUS_CODES,
} from './retryable.mjs'

/**
 * RQliteJS HTTP Request options
 * @typedef HttpRequestOptions
 * @type {Object}
 * @property {Object} [auth] A object for user authentication
 * @property {String} [auth.username] The username for authentication
 * @property {String} [auth.password] The username for authentication
 * @property {Object} [body] The body of the HTTP request
 * @property {Object} [headers={}] HTTP headers to send with the request
 * @property {String} [httpMethod=HTTP_METHOD_GET] The HTTP method for the request
 * i.e. GET or POST
 * @property {Object} [query] An object with the query to send with the HTTP request
 * @property {Boolean} [stream=false] When true the returned value is a request object with
 * stream support instead of a request-promise result
 * @property {Number} [timeout=DEAULT_TIMEOUT] Optional timeout to override default
 * @property {String} uri The uri for the request which can be a relative path to use
 * the currently active host or a full i.e. http://localhost:4001/db/query which is used
 * literally
 * @property {Boolean} [useLeader=false] When true the request will use the master host, the
 * first host in this.hosts, this is ideal for write operations to skip the redirect
 * @property {Number} [retries] The number of retries, defaults to the number of
 * hosts times 3
 * @property {Number} [maxRedirects=10] The maximum number of HTTP redirects to follow before
 * throwing an error
 * @property {Number} [attempt=0] The current attempt count when retrying or redirecting
 * @property {Number} [retryAttempt=0] The current attempt based on retry logic
 * @property {Number} [redirectAttempt=0] The current attempt based on redirect logic
 * @property {Number} [attemptHostIndex] When in a retry state the host index of the last
 * attempt which is used to get the next host index
 * @property {import('http').Agent} [httpAgent] An option http agent, useful for
 * keepalive pools using plain HTTP
 * @property {import('https').Agent} [httpsAgent] An option http agent, useful
 * for keepalive pools using SSL
 */

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
 * @param {Object} [headers={}] HTTP headers to send with the request
 * @returns {Object} The headers with defaults applied
 */
export function createDefaultHeaders (headers = {}) {
  const { Accept = CONTENT_TYPE_APPLICATION_JSON } = headers
  return { ...headers, Accept }
}

/**
 * Clean the request path remove / from the beginning
 * @param {String} path The path to clean
 * @returns {String} The clean path
 */
function cleanPath (path) {
  return String(path).replace(/^\//, '')
}

/**
 * Returns the next wait interval, in milliseconds, using an exponential
 * backoff algorithm.
 * @param {Number} attempt The retry attempt
 * @param {Number} base The base of the exponential backoff
 * @param {Number} pow The exponential power
 * @returns {Number} The time to wait in milliseconds
 */
export function getWaitTimeExponential (attempt = 0, base = 100, pow = 2) {
  if (attempt === 0) {
    return 0
  }
  return (pow ** attempt) * base
}

/**
 * Generic HTTP Request class which all RQLiteJS client
 * should extend for consistent communitication with an RQLite
 * server
 */
export default class HttpRequest {
  /**
   * The index of the host in this.hosts which will be tried
   * first before attempting other hosts
   * @type {Number}
   */
  activeHostIndex = 0

  /**
   * Whether or not the setNextActiveHostIndex() should
   * perform a round robin strategy
   */
  activeHostRoundRobin = true

  /**
   * The regex pattern to check if a uri is absolute or relative,
   * if it is absolute the host is not appended
   */
  absoluteUriPattern = /^https?:\/\//

  /**
   * A list of hosts that are tried in round robin fashion
   * when certain HTTP responses are received
   * @type {String[]}
   */
  hosts = []

  /**
   * @type {import('http').Agent} The http agent if it is set
   */
  httpAgent

  /**
   * @type {import('https').Agent} The https agent if it is set
   */
  httpsAgent

  /**
   * The host list index of the leader node defaults
   * to the first host
   * @type {Number}
   */
  leaderHostIndex = 0

  /**
   * Http error codes which are considered retryable
   * @type {Set}
   */
  retryableErrorCodes = RETRYABLE_ERROR_CODES

  /**
   * Http status codes which are considered retryable
   * @type {Set}
   */
  retryableStatusCodes = RETRYABLE_STATUS_CODES

  /**
   * Http methods which are considered retryable
   * @type {Set}
   */
  retryableHttpMethods = RETRYABLE_HTTP_METHODS

  /**
   * The exponential backoff base for retries
   */
  exponentailBackoffBase = 100

  /**
   * Authentication Map
   * @type {Map}
   * @property {String} username
   * @property {String} password
   */
  authentication = new Map()

  /**
   * Construtor for HttpRequest
   * @param {String[]|String} hosts An array of RQLite hosts or a string
   * that will be split on "," to create an array of hosts, the first
   * host will be tried first when there are multiple hosts
   * @param {Object} [options={}] Additional options
   * @param {Object} [options.authentication] Authentication options
   * @param {String} [options.authentication.username] The host authentication username
   * @param {String} [options.authentication.password] The host authentication password
   * @param {Boolean} [options.activeHostRoundRobin=true] If true this.setNextActiveHostIndex()
   * will perform a round robin when called
   * @param {import('http').Agent} [options.httpAgent] An option http agent, useful for
   * keepalive pools using plain HTTP
   * @param {import('https').Agent} [options.httpsAgent] An option http agent, useful
   * for keepalive pools using SSL
   * @param {Set|String[]} [options.retryableErrorCodes] The list of retryable error codes
   * @param {Set|Number[]} [options.retryableStatusCodes] The list of retryable http status codes
   * @param {Set|String[]} [options.retryableHttpMethods] The list of retryable http methods
   * @param {Number} [options.exponentailBackoffBase] The value for exponentail backoff base
   * for retry exponential backoff
   */
  constructor (hosts, options = {}) {
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
      exponentailBackoffBase,
      authentication,
    } = options
    if (typeof authentication === 'object') {
      const { username, password } = authentication
      if (username) {
        this.authentication.set('username', username)
      }
      if (password) {
        this.authentication.set('password', password)
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
        Array.isArray(retryableErrorCodes) ? Set(retryableErrorCodes) : retryableErrorCodes,
      )
    }
    if (retryableStatusCodes instanceof Set || Array.isArray(retryableStatusCodes)) {
      this.setRetryableStatusCodes(
        Array.isArray(retryableStatusCodes) ? Set(retryableStatusCodes) : retryableStatusCodes,
      )
    }
    if (retryableHttpMethods instanceof Set || Array.isArray(retryableHttpMethods)) {
      this.setRetryableHttpMethods(
        Array.isArray(retryableHttpMethods) ? Set(retryableHttpMethods) : retryableHttpMethods,
      )
    }
    if (Number.isFinite(exponentailBackoffBase)) {
      this.setExponentailBackoffBase(exponentailBackoffBase)
    }
  }

  /**
   * Set authentication information
   * @param {Object} [authentication] Authentication data
   * @param {String} [authentication.username] The host authentication username
   * @param {String} [authentication.password] The host authentication password
   */
  setAuthentication (authentication = {}) {
    const { username, password } = authentication
    if (username) {
      this.authentication.set('username', username)
    }
    if (password) {
      this.authentication.set('password', password)
    }
  }

  /**
   * Set the exponentail backoff base
   * @param {Number} exponentailBackoffBase
   */
  setExponentailBackoffBase (exponentailBackoffBase) {
    this.exponentailBackoffBase = exponentailBackoffBase
  }

  /**
   * Get the exponentail backoff base
   * @return {Number} The exponentail backoff base
   */
  getExponentailBackoffBase () {
    return this.exponentailBackoffBase
  }

  /**
   * Set the retryable error codes
   * @param {Set} retryableErrorCodes
   */
  setRetryableErrorCodes (retryableErrorCodes) {
    this.retryableErrorCodes = retryableErrorCodes
  }

  /**
   * Get the retryable error codes
   * @returns {Set}
   */
  getRetryableErrorCodes () {
    return this.retryableErrorCodes
  }

  /**
   * Set the retryable status codes
   * @param {Set} retryableStatusCodes
   */
  setRetryableStatusCodes (retryableStatusCodes) {
    this.retryableStatusCodes = retryableStatusCodes
  }

  /**
   * Get the retryable status codes
   * @returns {Set}
   */
  getRetryableStatusCodes () {
    return this.retryableStatusCodes
  }

  /**
   * Set the retryable http methods
   * @param {Set} retryableHttpMethods
   */
  setRetryableHttpMethods (retryableHttpMethods) {
    this.retryableHttpMethods = retryableHttpMethods
  }

  /**
   * Get the retryable http methods
   * @returns {Set}
   */
  getRetryableHttpMethods () {
    return this.retryableHttpMethods
  }

  /**
   * Set an http agent which is useful for http keepalive requests
   * @param {import('http').Agent} httpAgent An http agent
   */
  setHttpAgent (httpAgent) {
    this.httpAgent = httpAgent
  }

  /**
   * Get the set http agent
   * @returns {import('http').Agent|undefined} The https agent if it is set
   */
  getHttpAgent () {
    return this.httpAgent
  }

  /**
   * Set an https agent which is useful for https keepalive requests
   * @param {import('https').Agent} httpsAgent An https agent
   */
  setHttpsAgent (httpsAgent) {
    this.httpsAgent = httpsAgent
  }

  /**
   * Get the set https agent
   * @returns {import('https').Agent|undefined} The https agent if it is set
   */
  getHttpsAgent () {
    return this.httpsAgent
  }

  /**
   * Set the list of hosts
   * @param {String[]|String} hosts An array of RQLite hosts or a string
   * that will be split on "," to create an array of hosts, the first
   * host will be tried first when there are multiple hosts
   */
  setHosts (hosts) {
    this.hosts = !Array.isArray(hosts) ? String(hosts).split(',') : hosts
    this.hosts = this.hosts.reduce((acc, v) => {
      // Remove trailing slashed from hosts
      const host = String(v).trim().replace(/\/$/, '')
      if (!host) {
        return acc
      }
      return acc.concat(host)
    }, [])
  }

  /**
   * Get the list of hosts
   * @returns {String[]} The list of hosts
   */
  getHosts () {
    return this.hosts
  }

  /**
   * Given a host string find the index of that host in the hosts
   * @param {String} host A host to find in hosts
   * @returns {Number} The found host index or -1 if not found
   */
  findHostIndex (host) {
    const parsedHostToFind = parseUrl(host)
    return this.getHosts().findIndex((v) => {
      const parsedHost = parseUrl(v)
      // Find a host where all the parsed fields match the requested host
      return ['hostname', 'protocol', 'port', 'path'].every((field) => parsedHostToFind[field] === parsedHost[field])
    })
  }

  /**
   * Get the current active host from the hosts array
   * @param {Boolean} useLeader If true use the first host which is always
   * the master, this is prefered for write operations
   * @returns {String} The active host
   */
  getActiveHost (useLeader) {
    // When useLeader is true we should just use the first host
    const activeHostIndex = useLeader ? this.getLeaderHostIndex() : this.getActiveHostIndex()
    return this.getHosts()[activeHostIndex]
  }

  /**
   * Set the active host index with check based on this.hosts
   * @param {Number} activeHostIndex The index
   * @returns {Number} The active host index
   */
  setActiveHostIndex (activeHostIndex) {
    if (!Number.isFinite(activeHostIndex)) {
      throw new Error('The activeHostIndex should be a finite number')
    }
    const totalHosts = this.getTotalHosts()
    if (activeHostIndex < 0) {
      // Don't allow an index less then zero
      this.activeHostIndex = 0
    } else if (activeHostIndex >= totalHosts) {
      // Don't allow an index greater then the length of the hosts
      this.activeHostIndex = totalHosts - 1
    } else {
      this.activeHostIndex = activeHostIndex
    }
    return this.activeHostIndex
  }

  /**
   * Get the host index for the leader node
   * @returns {Number} The host index for the leader node
   */
  getLeaderHostIndex () {
    return this.leaderHostIndex
  }

  /**
   * Set the index in the host array for the leader node
   * @param {Number} leaderHostIndex The index of the host that is the leader node
   * @returns {Number} The host index for the leader node
   */
  setLeaderHostIndex (leaderHostIndex) {
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

  /**
   * Get the active host index
   * @returns {Number} The active host index
   */
  getActiveHostIndex () {
    return this.activeHostIndex
  }

  /**
   * Set active host round robin value
   * @param {Boolean} activeHostRoundRobin If true setActiveHostIndex() will
   * perform a round robin
   */
  setActiveHostRoundRobin (activeHostRoundRobin) {
    if (typeof activeHostRoundRobin !== 'boolean') {
      throw new Error('The activeHostRoundRobin argument must be boolean')
    }
    this.activeHostRoundRobin = activeHostRoundRobin
  }

  /**
   * Get active host round robin value
   * @returns {Boolean} The value of activeHostRoundRobin
   */
  getActiveHostRoundRobin () {
    return this.activeHostRoundRobin
  }

  /**
   * Get the next active host index
   * @param {Number} [activeHostIndex] An optional paramater to provide the active host index
   * @returns {Number} The next active host index which will wrap around to zero
   */
  getNextActiveHostIndex (activeHostIndex = this.getActiveHostIndex()) {
    const totalHosts = this.getTotalHosts()
    const nextIndex = activeHostIndex + 1
    // If we are past the last index start back over at 1
    if (totalHosts === nextIndex) {
      return 0
    }
    return nextIndex
  }

  /**
   * Set the active host index to the next host using a
   * round robin strategy
   */
  setNextActiveHostIndex () {
    // Don't bother if we only have one host
    if (!this.getActiveHostRoundRobin()) {
      return
    }
    const totalHosts = this.getTotalHosts()
    if (this.getActiveHostRoundRobin() && totalHosts <= 1) {
      return
    }
    this.setActiveHostIndex(this.getNextActiveHostIndex())
  }

  /**
   * Get the total number of hosts
   * @returns {Number} The total number of hosts
   */
  getTotalHosts () {
    return this.getHosts().length
  }

  /**
   * Returns whether or not the uri passes a test for this.absoluteUriPattern
   * @returns {Boolean} True if the path is absolute
   */
  uriIsAbsolute (uri) {
    return this.absoluteUriPattern.test(uri)
  }

  /**
   * Returns true when the HTTP request is retryable
   * @param {Object} options The options
   * @param {Number} options.statusCode The HTTP status code
   * @param {String} options.errorCode The error code
   * @param {String} options.httpMethod The http method
   * @returns {Boolean} True if the request is retry able
   */
  requestIsRetryable (options = {}) {
    const {
      statusCode,
      errorCode,
      httpMethod,
    } = options
    // Honor strictly the http method
    if (!this.getRetryableHttpMethods().has(httpMethod)) {
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
   * @param {HttpRequestOptions} [options={}] Options for the HTTP client
   * @returns {Promise<{status: Number, body: Object|String}>} An object with a status and body
   * property when stream is false and a stream when the stream option is true
   * @throws {ERROR_HTTP_REQUEST_MAX_REDIRECTS} When the maximum number of redirect has been reached
   */
  async fetch (options = {}) {
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
      exponentailBackoffBase = this.getExponentailBackoffBase(),
      httpAgent = this.getHttpAgent(),
      httpsAgent = this.getHttpsAgent(),
    } = options
    // Honor the supplied attemptHostIndex or get the active host
    const activeHost = Number.isFinite(attemptHostIndex) ? this.getHosts()[attemptHostIndex]
      : this.getActiveHost(useLeader)
    let { uri } = options
    if (!uri) {
      throw new Error('The uri option is required')
    }
    uri = this.uriIsAbsolute(uri) ? uri : `${activeHost}/${cleanPath(uri)}`
    try {
      let auth
      if (this.authentication.size) {
        auth = {
          username: this.authentication.get('username'),
          password: this.authentication.get('password'),
        }
      }
      const response = await axios({
        url: uri,
        auth,
        data: body,
        maxRedirects: 0, // Handle redirects manually to allow reposting data
        headers: createDefaultHeaders(headers),
        responseType: stream ? 'stream' : 'json',
        method: httpMethod,
        params: query,
        timeout,
        httpsAgent,
        httpAgent,
        paramsSerializer (params) {
          return stringifyQuery(params, { arrayFormat: 'brackets' })
        },
      })
      if (stream) {
        return response.data
      }
      return {
        body: response.data,
        status: response.status,
      }
    } catch (e) {
      const { response = {}, code: errorCode } = e
      const { status: responseStatus, headers: responseHeaders = {} } = response
      // Check if the error was a redirect
      const retryable = this.requestIsRetryable({
        statusCode: responseStatus,
        errorCode,
        httpMethod,
      })
      // Save the next active host index and pass it to retry manually
      let nextAttemptHostIndex = Number.isFinite(attemptHostIndex) ? attemptHostIndex
        : this.getActiveHostIndex()
      nextAttemptHostIndex += 1
      // We go past the last index start from zero
      if (nextAttemptHostIndex === this.getTotalHosts()) {
        nextAttemptHostIndex = 0
      }
      // First check if this is a redirect error
      if (responseStatus === 301 || responseStatus === 302) {
        // We maxed out on redirect attempts
        if (redirectAttempt >= maxRedirects) {
          throw ERROR_HTTP_REQUEST_MAX_REDIRECTS(`The maximum number of redirects ${maxRedirects} has been reached`)
        }
        const location = typeof responseHeaders === 'object' ? responseHeaders.location : undefined
        // If we were asked to use the leader, but got redirect the leader moved so remember it
        if (useLeader) {
          const newLeaderHostIndex = this.findHostIndex(location)
          // If the redirect exists in the hosts list remember it for next time
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
        const waitTime = getWaitTimeExponential(retryAttempt, exponentailBackoffBase)
        const delayPromise = new Promise((resolve) => {
          setTimeout(resolve, waitTime)
        })
        await delayPromise
        return this.fetch({
          ...options,
          attempt: attempt + 1,
          retryAttempt: retryAttempt + 1,
          attemptHostIndex: nextAttemptHostIndex,
        })
      }
      throw e
    }
  }

  /**
   * Perform an HTTP GET request
   * @param {HttpRequestOptions} [options={}] The options
   * @see this.fetch() for options
   */
  async get (options = {}) {
    return this.fetch({ ...options, httpMethod: HTTP_METHOD_GET })
  }

  /**
   * Perform an HTTP POST request
   * @param {HttpRequestOptions} [options={}] The options
   * @see this.fetch() for options
   */
  async post (options = {}) {
    return this.fetch({ ...options, httpMethod: HTTP_METHOD_POST })
  }
}
