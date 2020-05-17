/**
 * Plain HTTP client to be used when creating RQLite specific API HTTP clients
 * @module http-request
 */
import axios from 'axios'
import { stringify as stringifyQuery } from 'qs'
import {
  HTTP_METHOD_GET,
  HTTP_METHOD_POST,
} from './http-methods'
import {
  CONTENT_TYPE_APPLICATION_JSON,
  // CONTENT_TYPE_APPLICATION_OCTET_STREAM,
} from './content-types'

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
   * Construtor for HttpRequest
   * @param {String[]|String} hosts An array of RQLite hosts or a string
   * that will be split on "," to create an array of hosts, the first
   * host will be tried first when there are multiple hosts
   * @param {Object} [options={}] Additional options
   * @param {Boolean} [options.activeHostRoundRobin=true] If true this.setNextActiveHostIndex()
   * will perform a round robin when called
   * @param {import('http').Agent} [options.httpAgent] An option http agent, useful for
   * keepalive pools using plain HTTP
   * @param {import('https').Agent} [options.httpsAgent] An option http agent, useful
   * for keepalive pools using SSL
   */
  constructor (hosts, options = {}) {
    this.setHosts(hosts)
    if (this.getTotalHosts() === 0) {
      throw new Error('At least one host must be provided')
    }
    const { activeHostRoundRobin = true, httpAgent, httpsAgent } = options
    if (typeof activeHostRoundRobin !== 'undefined') {
      this.setActiveHostRoundRobin(activeHostRoundRobin)
    }
    if (typeof httpAgent !== 'undefined') {
      this.setHttpAgent(httpAgent)
    }
    if (typeof httpsAgent !== 'undefined') {
      this.setHttpsAgent(httpsAgent)
    }
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
    // Remove trailing slashed from hosts
    this.hosts = this.hosts.map(host => host.replace(/\/$/, ''))
  }

  /**
   * Get the list of hosts
   * @returns {String[]} The list of hosts
   */
  getHosts () {
    return this.hosts
  }

  /**
   * Get the current active host from the hosts array
   * @param {Boolean} useLeader If true use the first host which is always
   * the master, this is prefered for write operations
   * @returns {String} The active host
   */
  getActiveHost (useLeader) {
    // When useLeader is true we should just use the first host
    const activeHostIndex = useLeader ? 0 : this.activeHostIndex
    return this.getHosts()[activeHostIndex]
  }

  /**
   * Set the active host index with check based on this.hosts
   * @param {Number} activeHostIndex The index
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
   * Set the active host index to the next host using a
   * round robin strategy
   */
  setNextActiveHostIndex () {
    // Don't bother if we only have one host
    if (this.activeHostRoundRobin && this.getHosts().length === 0) {
      return
    }
    let nextIndex = this.activeHostIndex + 1
    // If we are past the last index start back over at 1
    if (this.getTotalHosts() === nextIndex) {
      nextIndex = 0
    }
    this.setActiveHostIndex(nextIndex)
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
   * Perform an HTTP request using the provided options
   * @param {Object} [options={}] Options for the HTTP client
   * @param {String} [options.activeHost] Provide the active host manually e.g. http://localhost:4001
   * @param {Object} [options.auth] A object for user authentication
   * @param {String} [options.auth.username] The username for authentication
   * @param {String} [options.auth.password] The username for authentication
   * @param {Object} [options.body] The body of the HTTP request
   * @param {Object} [options.headers={}] HTTP headers to send with the request
   * @param {String} [options.httpMethod=HTTP_METHOD_GET] The HTTP method for the request
   * i.e. GET or POST
   * @param {Object} [options.query] An object with the query to send with the HTTP request
   * @param {Boolean} [options.stream=false] When true the returned value is a request object with
   * stream support instead of a request-promise result
   * @param {Number} [options.timeout=DEAULT_TIMEOUT] Optional timeout to override default
   * @param {String} options.uri The uri for the request which can be a relative path to use
   * the currently active host or a full i.e. http://localhost:4001/db/query which is used
   * literally
   * @param {Boolean} [options.useLeader=false] When true the request will use the master host, the
   * first host in this.hosts, this is ideal for write operations to skip the redirect
   * @param {Number} [options.retries=0] The number of times to retry the request on any error
   * @param {Number} [options.maxRedirects=0] The maximum number of HTTP redirects to follow before
   * throwing an error
   * @param {Number} [options.attempt=0] The current attempt count when retrying or
   * the number of redirects followed, this value should NOT be passed by runtime code it is used
   * internal by the fetch function to track call depth
   * @param {import('http').Agent} [options.httpAgent] An option http agent, useful for
   * keepalive pools using plain HTTP
   * @param {import('https').Agent} [options.httpsAgent] An option http agent, useful
   * for keepalive pools using SSL
   * @returns {Promise<{status: Number, body: Object|String}>} An object with a status and body
   * property when stream is false and a stream when the stream option is true
   */
  async fetch (options = {}) {
    const {
      auth,
      body,
      headers = {},
      httpMethod = HTTP_METHOD_GET,
      query,
      stream = false,
      timeout = DEAULT_TIMEOUT,
      useLeader = false,
      retries = 0,
      maxRedirects = 10,
      attempt = 0,
      httpAgent = this.getHttpAgent(),
      httpsAgent = this.getHttpsAgent(),
    } = options
    // Honor the supplied activeHost or get the active host
    const { activeHost = this.getActiveHost(useLeader) } = options
    let { uri } = options
    if (!uri) {
      throw new Error('The uri option is required')
    }
    uri = this.uriIsAbsolute(uri) ? uri : `${activeHost}/${cleanPath(uri)}`
    try {
      const response = await axios({
        url: uri,
        auth: auth && typeof auth === 'object' ? {
          username: auth.user || auth.username,
          password: auth.pass || auth.password,
        } : undefined,
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
      const { response = {} } = e
      const { status: responseStatus, headers: responseHeaders = {} } = response
      // Check if the error was a redirect
      if (responseStatus === 301 || responseStatus === 302) {
        const location = typeof responseHeaders === 'object' ? responseHeaders.location : undefined
        // If we are not at the max redirect try again and have a location try again
        if (attempt < maxRedirects && location) {
          return this.fetch({ ...options, uri: location, attempt: attempt + 1 })
        }
      } else if (attempt < retries) {
        return this.fetch({ ...options, attempt: attempt + 1 })
      }
      throw e
    }
  }

  /**
   * Perform an HTTP GET request
   * @param {Object} [options={}] The options
   * @see this.fetch() for options
   */
  async get (options = {}) {
    return this.fetch({ ...options, httpMethod: HTTP_METHOD_GET })
  }

  /**
   * Perform an HTTP POST request
   * @param {Object} [options={}] The options
   * @see this.fetch() for options
   */
  async post (options = {}) {
    return this.fetch({ ...options, httpMethod: HTTP_METHOD_POST })
  }
}
