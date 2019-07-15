/**
 * RQLite API execute nock HTTP Mocks
 * @module test/api-data-execute-nock
 */
import nock from 'nock'
import { CONTENT_TYPE_APPLICATION_JSON } from '../http-request/content-types'

/**
 * A nock HTTP request mock
 * @typedef {import('nock')} Nock
 */

/**
 * Execute success response body
 */
export const EXECUTE_SUCCESS_RESPONSE = {
  results: [
    {
      last_insert_id: 1,
      rows_affected: 1,
    },
  ],
}

/**
 * Creates a nock that represents a successful call to execute endpoint
 * @param {Object} [options={}] The options
 * @param {Object} [options.auth] Optional object for auth
 * @param {String} [options.path] The path of the request
 * @param {Object} [options.response=EXECUTE_SUCCESS_RESPONSE] The response body
 * @param {String} [options.url] The url for the request
 * @returns {Nock} A query api success mock
 */
export function executeSuccess (options = {}) {
  const {
    auth,
    body,
    path,
    response = EXECUTE_SUCCESS_RESPONSE,
    url,
  } = options
  const scope = nock(url)
    .matchHeader('Accept', CONTENT_TYPE_APPLICATION_JSON)
    .matchHeader('Content-Type', CONTENT_TYPE_APPLICATION_JSON)
    .post(path, body)
  if (auth) {
    scope.basicAuth(auth)
  }
  return scope.reply(200, response)
}

/**
 * Creates a nock that represents a successful call to execute endpoint
 * @param {Object} [options={}] The options
 * @param {Object} [options.auth] Optional object for auth
 * @param {String} [options.path] The path of the request
 * @param {String} [options.redirectLocation] The uri for the location header
 * @param {Number} [options.statusCode=301] The redirect status code
 * @param {String} [options.url] The url for the request
 * @returns {Nock} A query api success mock
 */
export function executeRedirectSuccess (options = {}) {
  const {
    auth,
    body,
    path,
    redirectLocation,
    statusCode = 301,
    url,
  } = options
  const scope = nock(url)
    .matchHeader('Accept', CONTENT_TYPE_APPLICATION_JSON)
    .matchHeader('Content-Type', CONTENT_TYPE_APPLICATION_JSON)
    .post(path, body)
  if (auth) {
    scope.basicAuth(auth)
  }
  return scope.reply(statusCode, { Location: redirectLocation }, {
    Location: redirectLocation,
  })
}
