import _assign from 'lodash/assign'
import _isObject from 'lodash/isObject'
import superagent from 'superagent'
import queryString from 'query-string'
import {
  HTTP_METHOD_GET,
  HTTP_METHOD_POST,
} from './http-methods'
import {
  CONTENT_TYPE_APPLICATION_JSON,
  CONTENT_TYPE_APPLICATION_OCTET_STREAM,
} from './content-types'


const DEAULT_TIMEOUT = {
  response: 5000, // Wait 5 seconds for the server to start sending,
  deadline: 30000, // but allow 30 seconds for the data to finish loading.
}

/**
 * Get the HTTP library for use in requests.
 */
export function getHttpLibrary() {
  return superagent
}

/**
 * Create default header for all HTTP requests.
 * @param {object=} headers HTTP headers to send with the request.
 */
export function createDefaultHeaders(headers = {}) {
  const { Accept = CONTENT_TYPE_APPLICATION_JSON } = headers
  return _assign({}, headers, { Accept })
}

/**
 * Create JSON headers for all non HTTP GET requests.
 * @param {object=} headers HTTP headers to send with the request.
 */
export function createJsonHeaders(headers = {}) {
  return _assign({}, headers, { 'Content-Type': CONTENT_TYPE_APPLICATION_JSON })
}

/**
 * Prepare an http client promise with options.
 * @param {string} url The url for the http request i.e. http://localhost:4001/db/query
 * @param {object} options Options for the HTTP client.
 * @param {string=} options.httpMethod The HTTP method for the request i.e. get or post.
 * @param {object=} options.query An object with the query to send with the HTTP request.
 * @param {object=} options.body The body of the HTTP request for all non get requests.
 * @param {object=} options.agent Agent to replace the default agent i.e. keepalive.
 * @param {object=} options.timeout Optional timeout to override default.
 * @param {number=} options.timeout.response Milliseconds to wait for the server to start
 * sending data.
 * @param {number=} options.timeout.deadline Milliseconds to wait for the data to finish being sent.
 * @param {object=} options.headers HTTP headers to send with the request.
 */
export function prepare(url, options = {}) {
  const {
    httpMethod = HTTP_METHOD_GET,
    query,
    body,
    agent,
    auth,
    buffer,
    responseParserType,
  } = options
  let { headers = {}, timeout = {} } = options
  const client = getHttpLibrary()[httpMethod](url)
  // Add headers for the JSON requests which are all non-get requests.
  if (httpMethod !== HTTP_METHOD_GET) {
    headers = createJsonHeaders(headers)
  }
  // Add a query to the request
  if (query) {
    client.query(queryString.stringify(query))
  }
  // Add a query to the request
  if (_isObject(auth)) {
    const { user, pass, authOptions } = auth
    client.auth(user, pass, authOptions)
  }
  if (body && httpMethod !== HTTP_METHOD_GET) {
    client.send(body)
  }
  if (agent) {
    client.agent(agent)
  }
  if (buffer) {
    client.buffer(true)
  }
  if (responseParserType === CONTENT_TYPE_APPLICATION_OCTET_STREAM) {
    const parser = superagent.parse[responseParserType]
    client.parse(parser)
  }
  // Convert timeout to object if it is set and not an object
  if (timeout && !_isObject(timeout)) {
    timeout = { deadline: timeout }
  }
  client.timeout(_assign({}, timeout, DEAULT_TIMEOUT))
  client.set(createDefaultHeaders(headers))
  return client
}

/**
 * Create an HTTP GET request.
 * @param {string} url The url for the http request i.e. http://localhost:4001/db/query
 * @param {object=} options See prepare() options.
 */
export function get(url, options = {}) {
  return prepare(url, _assign({}, options, { httpMethod: HTTP_METHOD_GET }))
}

/**
 * Create an HTTP POST request.
 * @param {string} url The url for the http request i.e. http://localhost:4001/db/query
 * @param {object=} options See prepare() options.
 */
export function post(url, options = {}) {
  return prepare(url, _assign({}, options, { httpMethod: HTTP_METHOD_POST }))
}
