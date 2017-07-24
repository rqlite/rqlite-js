import _get from 'lodash/get'
import _assign from 'lodash/assign'
import {
  HTTP_METHOD_GET,
  HTTP_METHOD_POST
} from './http-methods'
import {
  CONTENT_TYPE_APPLICATION_JSON,
  CONTENT_TYPE_APPLICATION_X_WWW_FORM_URLENCODED
} from './content-types'
import superagent from 'superagent'

const DEAULT_TIMEOUT = 30

/**
 * Get the HTTP library for use in requests.
 */
export function getHttpLibrary () {
  return superagent 
}

/**
 * Prepare an http client promise with options.
 * @param {string} url - The url for the http request i.e. http://localhost:4001/db/query
 * @param {object} options - Options for the HTTP client.
 * @param {string=} options.httpMethod - The HTTP method for the request i.e. get or post.
 * @param {object=} options.query - An object with the query to send with the HTTP request.
 * @param {object=} options.body - The body of the HTTP request for all non get requests.
 * @param {object=} options.agent - Agent to replace the default agent i.e. keepalive.
 * @param {number=} options.timeout - Optional timeout to override default.
 * @param {object=} options.headers - HTTP headers to send with the request.
 */
export function prepare (url, options = {}) {
  const {
    httpMethod = HTTP_METHOD_GET,
    query,
    body,
    agent,
    timeout
  } = options
  let {headers = {}} = options
  const client = getHttpLibrary()[httpMethod](url)
  // Add headers for the JSON requests which are all non-get requests.
  if (httpMethod !== HTTP_METHOD_GET) {
    headers = createJsonHeaders(headers)
  }
  // Add a query to the request
  if (query) {
    client.query(query)
  }
  if (body && httpMethod !== HTTP_METHOD_GET) {
    client.send(body)
  }
  if (agent) {
    client.agent(agent)
  }
  client.timeout(timeout || DEAULT_TIMEOUT)
  client.set(createDefaultHeaders(headers))
  return client
}

/**
 * Create default header for all HTTP requests.
 * @param {object=} headers - HTTP headers to send with the request.
 */
export function createDefaultHeaders (headers = {}) {
  return _assign({}, headers, {Accept: CONTENT_TYPE_APPLICATION_JSON})
}

/**
 * Create JSON headers for all non HTTP GET requests.
 * @param {object=} headers - HTTP headers to send with the request.
 */
export function createJsonHeaders (headers = {}) {
  return _assign({}, headers, {'Content-Type': CONTENT_TYPE_APPLICATION_JSON})
}

/**
 * Create an HTTP GET request.
 * @param {string} url - The url for the http request i.e. http://localhost:4001/db/query
 * @param {object=} options - See prepare() options.
 */
export function get (url, options = {}) {
  return prepare(url, _assign({}, options, {httpMethod: HTTP_METHOD_GET}))
}

/**
 * Create an HTTP POST request.
 * @param {string} url - The url for the http request i.e. http://localhost:4001/db/query
 * @param {object=} options - See prepare() options.
 */
export function post (url, options = {}) {
  return prepare(url, _assign({}, options, {httpMethod: HTTP_METHOD_POST}))
}
