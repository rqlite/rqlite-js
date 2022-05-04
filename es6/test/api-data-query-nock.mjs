/**
 * RQLite API execute nock HTTP Mocks
 * @module test/api-data-query-nock
 */
import nock from 'nock'
import { CONTENT_TYPE_APPLICATION_JSON } from '../http-request/content-types.mjs'

/**
 * A nock HTTP request mock
 * @typedef {import('nock')} Nock
 */

/**
 * Single query success response body
 */
export const QUERY_SUCCESS_RESPONSE = {
  results: [
    {
      columns: ['id', 'name'],
      types: ['integer', 'text'],
      values: [[1, 'fiona']],
    },
  ],
}

/**
 * Multiple query success response body
 */
export const QUERY_MULTIPLE_SUCCESS_RESPONSE = {
  results: [
    {
      columns: ['id', 'name'],
      types: ['integer', 'text'],
      values: [[1, 'fiona']],
    },
    {
      columns: ['id', 'value'],
      types: ['integer', 'text'],
      values: [[1, 'test']],
    },
  ],
}

/**
 * Nock function to all queries
 * @returns {Boolean} Return the value true
 */
function queryAllowAll () {
  return true
}

/**
 * Creates a nock that represents a successful call to data query endpoint
 * @param {Object} [options={}] The options
 * @param {Object} [options.auth] Optional object for auth
 * @param {String} [options.path] The path of the request
 * @param {Object} [options.query] The query which allows all by default
 * @param {Object} [options.response=QUERY_SUCCESS_RESPONSE] The response body
 * @param {String} [options.url] The url for the request
 * @returns {Nock} A query api success mock
 */
export function querySuccess (options = {}) {
  const {
    auth,
    path,
    query = queryAllowAll,
    response = QUERY_SUCCESS_RESPONSE,
    url,
  } = options
  const scope = nock(url)
    .matchHeader('Accept', CONTENT_TYPE_APPLICATION_JSON)
    .get(path)
    .query(query)
  if (auth) {
    scope.basicAuth(auth)
  }
  return scope.reply(200, response)
}

/**
 * Creates a nock that represents a failed call to data query endpoint based on status code
 * @param {Object} [options={}] The options
 * @param {Object} [options.auth] Optional object for auth
 * @param {String} [options.path] The path of the request
 * @param {Object} [options.query] The query which allows all by default
 * @param {Object} [options.response=QUERY_SUCCESS_RESPONSE] The response body
 * @param {String} [options.url] The url for the request
 * @param {Number} [options.statusCode] The statusCode for the response
 * @param {Number} [options.times] The number of times the request should repeat
 * @returns {Nock} A query api success mock
 */
export function queryFailureHttpStatusCode (options = {}) {
  const {
    auth,
    path,
    query = queryAllowAll,
    response = {},
    url,
    statusCode,
    times,
  } = options
  const scope = nock(url)
    .matchHeader('Accept', CONTENT_TYPE_APPLICATION_JSON)
    .get(path)
    .query(query)
  if (auth) {
    scope.basicAuth(auth)
  }
  if (times) {
    scope.times(times)
  }
  return scope.reply(statusCode, response)
}

/**
 * Creates a nock that represents a failed call to data query endpoint based on error code
 * @param {Object} [options={}] The options
 * @param {Object} [options.auth] Optional object for auth
 * @param {String} [options.path] The path of the request
 * @param {Object} [options.query] The query which allows all by default
 * @param {Object} [options.response=QUERY_SUCCESS_RESPONSE] The response body
 * @param {String} [options.url] The url for the request
 * @param {String} [options.errorCode] The error code for the response
 * @returns {Nock} A query api success mock
 */
export function queryFailureErrorCode (options = {}) {
  const {
    auth,
    path,
    query = queryAllowAll,
    errorCode,
    url,
  } = options
  const scope = nock(url)
    .matchHeader('Accept', CONTENT_TYPE_APPLICATION_JSON)
    .get(path)
    .query(query)
  if (auth) {
    scope.basicAuth(auth)
  }
  return scope.replyWithError({
    message: errorCode,
    code: errorCode,
  })
}

/**
 * Creates a nock that represents a successful HTTP request to the query endpoint
 * that responds with a statusCode (301 by default) redirect
 * @param {Object} [options={}] The options
 * @param {Object} [options.auth] Optional object for auth
 * @param {String} [options.path] The path of the request
 * @param {Object} [options.query] The query which allows all by default
 * @param {String} [options.redirectLocation] The uri for the location header
 * @param {Object} [options.response=QUERY_SUCCESS_RESPONSE] The response body
 * @param {Number} [options.statusCode=301] The redirect status code
 * @param {String} [options.url] The url for the request
 * @returns {Nock} A query api redirect success mock
 */
export function queryRedirectSuccess (options = {}) {
  const {
    auth,
    path,
    query = queryAllowAll,
    redirectLocation,
    statusCode = 301,
    url,
  } = options
  const scope = nock(url)
    .matchHeader('Accept', CONTENT_TYPE_APPLICATION_JSON)
    .get(path)
    .query(query)
  if (auth) {
    scope.basicAuth(auth)
  }
  return scope.reply(statusCode, { Location: redirectLocation }, {
    Location: redirectLocation,
  })
}

/**
 * Creates a nock that represents a successful HTTP POST request to the mutliple query endpoint
 * @param {Object} [options={}] The options
 * @param {Object} [options.auth] Optional object for auth
 * @param {String} [options.path] The path of the request
 * @param {Object} [options.query] The query which allows all by default
 * @param {Object} [options.response=QUERY_MULTIPLE_SUCCESS_RESPONSE] The response body
 * @param {String} [options.url] The url for the request
 * @returns {Nock} A multiple query api success mock
 */
export function queryMultipleSuccess (options = {}) {
  const {
    auth,
    body,
    path,
    query = queryAllowAll,
    response = QUERY_MULTIPLE_SUCCESS_RESPONSE,
    url,
  } = options
  const scope = nock(url)
    .matchHeader('Accept', CONTENT_TYPE_APPLICATION_JSON)
    .post(path, body)
    .query(query)
  if (auth) {
    scope.basicAuth(auth)
  }
  return scope.reply(200, response)
}
