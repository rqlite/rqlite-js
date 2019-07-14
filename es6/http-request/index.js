/**
 * Plain HTTP client to be used when creating RQLite specific API HTTP clients
 * @module http
 */
import assign from 'lodash/assign'
import isArray from 'lodash/isArray'
import map from 'lodash/map'
import replace from 'lodash/replace'
import size from 'lodash/size'
import split from 'lodash/split'
import requestPromise from 'request-promise'
import request from 'request'
import {
  HTTP_METHOD_GET,
  HTTP_METHOD_POST,
} from './http-methods'
import {
  CONTENT_TYPE_APPLICATION_JSON,
  CONTENT_TYPE_APPLICATION_OCTET_STREAM,
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
 * @param {String} path 
 * @returns {String} The clean path
 */
function cleanPath (path) {
  return replace(path, /^\//, '')
}

export default class HttpRequest {
  /**
   * The index of the host in this.hosts which will be tried
   * first before attempting other hosts
   * @type {Number}
   */
  activeHostIndex = 0

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
   * @param {Object} [options={}] The options
   */
  constructor (hosts, options = {}) {
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
   * Perform an HTTP request using the provided options
   * @param {String} url The url for the http request i.e. http://localhost:4001/db/query
   * @param {Object} [options={}] Options for the HTTP client
   * @param {String} [options.httpMethod='get'] The HTTP method for the request i.e. get or post
   * @param {Object} [options.query] An object with the query to send with the HTTP request
   * @param {Object} [options.body] The body of the HTTP request for all non get requests
   * @param {Object} [options.json=true] When true automatically parse JSON in the response
   * @param {Object} [options.agent] Agent to replace the default agent i.e. keepalive
   * @param {Object} [options.timeout={}] Optional timeout to override default
   * @param {Number} [options.timeout.response] Milliseconds to wait for the server to start
   * sending data
   * @param {Number} [options.timeout.deadline] Milliseconds to wait for the data to finish
   * being sent
   * @param {Object} [options.headers={}] HTTP headers to send with the request
   * @returns {Object} Request promise response
   */
  async fetch (options = {}) {
    const {
      agent,
      attempt = 0,
      auth,
      body,
      path,
      stream = false,
      followAllRedirects = true,
      followOriginalHttpMethod = true,
      headers = {},
      httpMethod = HTTP_METHOD_GET,
      json = true,
      query,
      resolveWithFullResponse = true,
      timeout = DEAULT_TIMEOUT,
    } = options
    if (!path) {
      throw new Error('The path option is required')
    }
    try {
      const requestOptions = {
        agent,
        auth,
        method: httpMethod,
        body,
        followAllRedirects,
        followOriginalHttpMethod,
        qs: query,
        resolveWithFullResponse,
        uri: `${this.getActiveHost()}/${cleanPath(path)}`,
        headers: assign({}, createDefaultHeaders(headers)),
        json, // Automatically parses the JSON string in the response
        timeout,
      }
      if (stream) {
        return request(requestOptions)
      }
      return await requestPromise(requestOptions)
    } catch (e) {
      const { response: { statusCode } = {} } = e
      // Handle a gateway timeout by trying the next host
      if (statusCode === 503) {
        this.setNextActiveHostIndex()
        const totalHosts = this.getTotalHosts()
        if (totalHosts > 1 && attempt !== this.getTotalHosts()) {
          return this.fetch(assign({}, options, { attempt: attempt + 1 }))
        }
      }
      throw e
    }
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
