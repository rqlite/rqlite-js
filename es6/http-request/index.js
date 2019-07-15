/**
 * Plain HTTP client to be used when creating RQLite specific API HTTP clients
 * @module http-request
 */
import assign from 'lodash/assign'
import isArray from 'lodash/isArray'
import map from 'lodash/map'
import replace from 'lodash/replace'
import size from 'lodash/size'
import split from 'lodash/split'
import rp from 'request-promise'
import r from 'request'
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
  return assign({}, headers, { Accept })
}

/**
 * Clean the request path remove / from the beginning
 * @param {String} path The path to clean
 * @returns {String} The clean path
 */
function cleanPath (path) {
  return replace(path, /^\//, '')
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
   * Construtor for HttpRequest
   * @param {String[]|String} hosts An array of RQLite hosts or a string
   * that will be split on "," to create an array of hosts, the first
   * host will be tried first when there are multiple hosts
   */
  constructor (hosts) {
    this.setHosts(hosts)
    if (this.getTotalHosts() === 0) {
      throw new Error('At least one host must be provided')
    }
  }

  /**
   * Set the list of hosts
   * @param {String[]|String} hosts An array of RQLite hosts or a string
   * that will be split on "," to create an array of hosts, the first
   * host will be tried first when there are multiple hosts
   */
  setHosts (hosts) {
    this.hosts = !isArray(hosts) ? split(hosts, ',') : hosts
    // Remove trailing slashed from hosts
    this.hosts = map(this.hosts, host => replace(host, /\/$/, ''))
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
   * @returns {String} The active host
   */
  getActiveHost () {
    return this.getHosts()[this.activeHostIndex]
  }

  /**
   * Set the active host index to the next host using a
   * round robin strategy
   */
  setNextActiveHostIndex () {
    let nextIndex = this.activeHostIndex + 1
    // If we are past the last index start back over at 1
    if (this.getTotalHosts() === nextIndex) {
      nextIndex = 0
    }
    this.activeHostIndex = nextIndex
  }

  /**
   * Get the total number of hosts
   * @returns {Number} The total number of hosts
   */
  getTotalHosts () {
    return size(this.getHosts())
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
   * @param {Object} [options.auth] A object for user authentication
   * i.e. { username: 'test', password: "password" }
   * @param {Object} [options.body] The body of the HTTP request
   * @param {Boolean} [options.forever=true] When true use the forever keepalive agent
   * @param {Boolean|Function} [options.gzip=true] If true add accept deflate headers and
   * uncompress the response body
   * @param {Object} [options.headers={}] HTTP headers to send with the request
   * @param {String} [options.httpMethod=HTTP_METHOD_GET] The HTTP method for the request
   * i.e. GET or POST
   * @param {Boolean} [options.json=true] When true automatically parse JSON in the response body
   * and stringify the request body
   * @param {Object} [options.query] An object with the query to send with the HTTP request
   * @param {Boolean} [options.stream=false] When true the returned value is a request object with
   * stream support instead of a request-promise result
   * @param {Object} [options.timeout=DEAULT_TIMEOUT] Optional timeout to override default
   * @param {String} options.uri The uri for the request which can be a relative path to use
   * the currently active host or a full i.e. http://localhost:4001/db/query which is used
   * literally
   * @returns {Object} A request-promise result when stream is false and a request object
   * with stream support when stream is true
   */
  async fetch (options = {}) {
    const {
      auth,
      body,
      forever = true,
      gzip = true,
      headers = {},
      httpMethod = HTTP_METHOD_GET,
      json = true,
      query,
      stream = false,
      timeout = DEAULT_TIMEOUT,
    } = options
    let { uri } = options
    if (!uri) {
      throw new Error('The uri option is required')
    }
    uri = this.uriIsAbsolute(uri) ? uri : `${this.getActiveHost()}/${cleanPath(uri)}`
    // If a stream is request use the request library directly
    if (stream) {
      return r({
        auth,
        body,
        forever,
        gzip,
        followAllRedirects: true,
        followOriginalHttpMethod: true,
        followRedirect: true,
        headers: assign({}, createDefaultHeaders(headers)),
        json,
        method: httpMethod,
        qs: query,
        timeout,
        uri,
      })
    }
    const requestPromiseOptions = {
      auth,
      body,
      followAllRedirects: false,
      followOriginalHttpMethod: false,
      followRedirect: false,
      forever,
      gzip,
      headers: assign({}, createDefaultHeaders(headers)),
      json,
      method: httpMethod,
      qs: query,
      resolveWithFullResponse: true,
      simple: false,
      timeout,
      transform (responseBody, response, resolveWithFullResponse) {
        // Handle 301 and 302 redirects
        const { statusCode: responseStatusCode, headers: responseHeaders = {} } = response
        if (responseStatusCode === 301 || responseStatusCode === 302) {
          const { location: redirectUri } = responseHeaders
          this.uri = redirectUri
          this.qs = undefined
          return rp(assign({}, requestPromiseOptions, { uri: redirectUri }))
        }
        return resolveWithFullResponse ? response : responseBody
      },
      uri,
    }
    return rp(requestPromiseOptions)
  }

  /**
   * Perform an HTTP GET request
   * @param {Object} [options={}] The options
   * @see fetch() for options
   */
  async get (options = {}) {
    return this.fetch(assign({}, options, { httpMethod: HTTP_METHOD_GET }))
  }

  /**
   * Perform an HTTP POST request
   * @param {Object} [options={}] The options
   * @see fetch() for options
   */
  async post (options = {}) {
    return this.fetch(assign({}, options, { httpMethod: HTTP_METHOD_POST }))
  }
}
