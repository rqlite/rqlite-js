import { assert } from 'chai'
import { Agent as HttpAgent } from 'http'
import { Agent as HttpsAgent } from 'https'
import {
  querySuccess,
  queryFailureHttpStatusCode,
  queryFailureErrorCode,
  queryRedirectSuccess,
  QUERY_SUCCESS_RESPONSE,
} from '../test/api-data-query-nock'
import {
  executeSuccess,
  executeFailureHttpStatusCode,
  executeFailureErrorCode,
  executeRedirectSuccess,
  EXECUTE_SUCCESS_RESPONSE,
} from '../test/api-data-execute-nock'
import { CONTENT_TYPE_APPLICATION_JSON } from './content-types'
import {
  RETRYABLE_ERROR_CODES,
  RETRYABLE_HTTP_METHODS,
  RETRYABLE_STATUS_CODES,
} from './retryable'
import HttpRequest, { createDefaultHeaders, getWaitTimeExponential } from '.'

const username = 'TestUsername'
const password = 'TestPassword'
const auth = Object.freeze({
  user: username,
  pass: password,
})

/**
 * Capture the stream data and resolve a promise with the parsed JSON
 */
function handleRequestStreamAsPromise (request) {
  return new Promise((resolve, reject) => {
    let json = Buffer.from('')
    request
      .on('data', (data) => {
        json = Buffer.concat([json, data])
      })
      .on('end', () => resolve(JSON.parse(json)))
      .on('error', reject)
  })
}
const ERROR_CODE_NOT_RETRYABLE = 'UNKNOWN'
const HTTP_STATUS_CODE_NOT_RETRYABLE = 418 // I am little tea pot

describe('http-request', () => {
  describe('construtor()', () => {
    it('should throw an error if no hosts are provided', () => {
      assert.throws(() => new HttpRequest(''), 'At least one host must be provided')
    })
    it('should set the hosts when provided as a string', () => {
      const host1 = 'http://www.rqlite.com:4001'
      const host2 = 'http://www.rqlite.com:4002'
      const request = new HttpRequest(`${host1}, ${host2}`)
      assert.deepEqual(request.getHosts(), [host1, host2])
    })
    it('should set the hosts provided as an array', () => {
      const host1 = 'http://www.rqlite.com:4001'
      const host2 = 'http://www.rqlite.com:4002'
      const request = new HttpRequest([host1, host2])
      assert.deepEqual(request.getHosts(), [host1, host2])
    })
  })
  describe('Function: createDefaultHeaders()', () => {
    it(`should add the Accept header with a value of ${CONTENT_TYPE_APPLICATION_JSON}`, () => {
      assert.deepEqual({ Accept: CONTENT_TYPE_APPLICATION_JSON }, createDefaultHeaders())
    })
  })
  describe('Function: getWaitTimeExponential()', () => {
    it('should get the exponential value for attempt 0', () => {
      assert.equal(getWaitTimeExponential(0, 100, 2), 0)
    })
    it('should get the exponential value for attempt 1', () => {
      assert.equal(getWaitTimeExponential(1, 100, 2), 200)
    })
    it('should get the exponential value for attempt 2', () => {
      assert.equal(getWaitTimeExponential(2, 100, 2), 400)
    })
  })
  describe('Method: HttpRequest.requestIsRetryable()', () => {
    const url = 'http://www.rqlite.com:4001'
    let httpRequest
    before('create http request instance', () => {
      httpRequest = new HttpRequest(url)
    })
    RETRYABLE_HTTP_METHODS.forEach((httpMethod) => {
      RETRYABLE_STATUS_CODES.forEach((statusCode) => {
        it(`should return true for HTTP method ${httpMethod} and status code ${statusCode}`, () => {
          assert.isTrue(httpRequest.requestIsRetryable({
            statusCode,
            httpMethod,
          }))
        })
      })
      RETRYABLE_ERROR_CODES.forEach((errorCode) => {
        it(`should return true for HTTP method ${httpMethod} error code ${errorCode}`, () => {
          assert.isTrue(httpRequest.requestIsRetryable({
            httpMethod,
            statusCode: HTTP_STATUS_CODE_NOT_RETRYABLE,
            errorCode,
          }))
        })
      })
      it(`should return false for HTTP method ${httpMethod} and status code ${HTTP_STATUS_CODE_NOT_RETRYABLE}`, () => {
        assert.isFalse(httpRequest.requestIsRetryable({
          httpMethod,
          statusCode: HTTP_STATUS_CODE_NOT_RETRYABLE,
        }))
      })
      it(`should return false for HTTP method ${httpMethod} and error code ${ERROR_CODE_NOT_RETRYABLE}`, () => {
        assert.isFalse(httpRequest.requestIsRetryable({
          httpMethod,
          statusCode: HTTP_STATUS_CODE_NOT_RETRYABLE,
          errorCode: ERROR_CODE_NOT_RETRYABLE,
        }))
      })
    })
    it('should return false for HTTP method UNKNOWN', () => {
      assert.isFalse(httpRequest.requestIsRetryable({
        httpMethod: 'UNKNOWN',
      }))
    })
  })
  describe('Method: HttpRequest.get()', () => {
    it('should set and get an http agent', async () => {
      const url = 'http://www.rqlite.com:4001'
      const httpAgent = new HttpAgent()
      const httpRequest = new HttpRequest(url, { httpAgent })
      assert.equal(httpRequest.getHttpAgent(), httpAgent, 'http agent is set on http request')
    })
    it('should set and get an https agent', async () => {
      const url = 'http://www.rqlite.com:4001'
      const httpsAgent = new HttpsAgent()
      const httpRequest = new HttpRequest(url, { httpsAgent })
      assert.equal(httpRequest.getHttpsAgent(), httpsAgent, 'https agent is set on http request')
    })
    it('should perform a HTTP GET request', async () => {
      const url = 'http://www.rqlite.com:4001'
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const scope = querySuccess({ url, path, query: {} })
      const res = await httpRequest.get({ uri: path })
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(QUERY_SUCCESS_RESPONSE, res.body)
    })
    RETRYABLE_STATUS_CODES.forEach((statusCode) => {
      it(`should perform a HTTP GET request and retry using the next host on retryable http status code ${statusCode}`, async () => {
        const host1 = 'http://www.rqlite.com:4001'
        const host2 = 'http://www.rqlite.com:4002'
        const httpRequest = new HttpRequest(`${host1},${host2}`, { exponentailBackoffBase: 0 })
        const path = '/test'
        const scopeFailure = queryFailureHttpStatusCode({ url: host1, path, statusCode })
        const scopeSuccess = querySuccess({ url: host2, path })
        const res = await httpRequest.get({ uri: path })
        assert.isTrue(scopeSuccess.isDone(), 'http success request captured by nock')
        assert.isTrue(scopeFailure.isDone(), 'http failure request captured by nock')
        assert.deepEqual(QUERY_SUCCESS_RESPONSE, res.body)
      })
      it(`should perform a HTTP GET request, retry using the next host on retryable http status code ${statusCode} and reject on max retries`, async () => {
        const host1 = 'http://www.rqlite.com:4001'
        const host2 = 'http://www.rqlite.com:4002'
        const httpRequest = new HttpRequest(`${host1},${host2}`, { exponentailBackoffBase: 0 })
        const path = '/test'
        const scopes = [
          queryFailureHttpStatusCode({ url: host1, path, statusCode }),
          queryFailureHttpStatusCode({ url: host2, path, statusCode }),
          queryFailureHttpStatusCode({ url: host1, path, statusCode }),
          queryFailureHttpStatusCode({ url: host2, path, statusCode }),
          queryFailureHttpStatusCode({ url: host1, path, statusCode }),
          queryFailureHttpStatusCode({ url: host2, path, statusCode }),
          // Circles back to original host on last retry
          queryFailureHttpStatusCode({ url: host1, path, statusCode }),
        ]
        await assert.isRejected(httpRequest.get({ uri: path }), `Request failed with status code ${statusCode}`)
        scopes.forEach((scope, i) => {
          assert.isTrue(scope.isDone(), `http failure request attempt ${i} captured by nock`)
        })
      })
    })
    it(`should perform a HTTP GET request and not retry on http status code ${HTTP_STATUS_CODE_NOT_RETRYABLE}`, async () => {
      const host1 = 'http://www.rqlite.com:4001'
      const host2 = 'http://www.rqlite.com:4002'
      const httpRequest = new HttpRequest(`${host1},${host2}`, { exponentailBackoffBase: 0 })
      const path = '/test'
      const scopeFailure = queryFailureHttpStatusCode({
        url: host1, path, statusCode: HTTP_STATUS_CODE_NOT_RETRYABLE,
      })
      const scopeSuccess = querySuccess({ url: host2, path })
      await assert.isRejected(httpRequest.get({ uri: path }), `Request failed with status code ${HTTP_STATUS_CODE_NOT_RETRYABLE}`)
      assert.isFalse(scopeSuccess.isDone(), 'http success request captured by nock, but not performed')
      assert.isTrue(scopeFailure.isDone(), 'http failure request captured by nock')
    })
    RETRYABLE_ERROR_CODES.forEach((errorCode) => {
      it(`should perform a HTTP GET request and retry using the next host on retryable error code ${errorCode}`, async () => {
        const host1 = 'http://www.rqlite.com:4001'
        const host2 = 'http://www.rqlite.com:4002'
        const httpRequest = new HttpRequest(`${host1},${host2}`, { exponentailBackoffBase: 0 })
        const path = '/test'
        const scopeFailure = queryFailureErrorCode({ url: host1, path, errorCode })
        const scopeSuccess = querySuccess({ url: host2, path })
        const res = await httpRequest.get({ uri: path })
        assert.isTrue(scopeSuccess.isDone(), 'http success request captured by nock')
        assert.isTrue(scopeFailure.isDone(), 'http failure request captured by nock')
        assert.deepEqual(QUERY_SUCCESS_RESPONSE, res.body)
      })
      it(`should perform a HTTP GET request, retry using the next host on retryable error code ${errorCode} and reject on max retries`, async () => {
        const host1 = 'http://www.rqlite.com:4001'
        const host2 = 'http://www.rqlite.com:4002'
        const httpRequest = new HttpRequest(`${host1},${host2}`, { exponentailBackoffBase: 0 })
        const path = '/test'
        const scopes = [
          queryFailureErrorCode({ url: host1, path, errorCode }),
          queryFailureErrorCode({ url: host2, path, errorCode }),
          queryFailureErrorCode({ url: host1, path, errorCode }),
          queryFailureErrorCode({ url: host2, path, errorCode }),
          queryFailureErrorCode({ url: host1, path, errorCode }),
          queryFailureErrorCode({ url: host2, path, errorCode }),
          // Circles back to original host on last retry
          queryFailureErrorCode({ url: host1, path, errorCode }),
        ]
        await assert.isRejected(httpRequest.get({ uri: path }), errorCode)
        scopes.forEach((scope, i) => {
          assert.isTrue(scope.isDone(), `http failure request attempt ${i} captured by nock`)
        })
      })
    })
    it(`should perform a HTTP GET request and not retry on error code ${ERROR_CODE_NOT_RETRYABLE}`, async () => {
      const host1 = 'http://www.rqlite.com:4001'
      const host2 = 'http://www.rqlite.com:4002'
      const httpRequest = new HttpRequest(`${host1},${host2}`, { exponentailBackoffBase: 0 })
      const path = '/test'
      const scopeFailure = queryFailureErrorCode({
        url: host1, path, errorCode: ERROR_CODE_NOT_RETRYABLE,
      })
      const scopeSuccess = querySuccess({ url: host2, path })
      await assert.isRejected(httpRequest.get({ uri: path }), ERROR_CODE_NOT_RETRYABLE)
      assert.isFalse(scopeSuccess.isDone(), 'http success request captured by nock, but not performed')
      assert.isTrue(scopeFailure.isDone(), 'http failure request captured by nock')
    })
    it('should perform a HTTP GET request with a query', async () => {
      const url = 'http://www.rqlite.com:4001'
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const query = { test: '123' }
      const scope = querySuccess({ url, path, query })
      const res = await httpRequest.get({ uri: path, query })
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(QUERY_SUCCESS_RESPONSE, res.body)
    })
    it('should perform a HTTP GET request with a query and follow redirects', async () => {
      const url = 'http://www.rqlite.com:4001'
      const urlRedirectDestination = 'http://www.rqlite.com:4002'
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const query = { test: '123' }
      const scopeRedirect = queryRedirectSuccess({
        url,
        path,
        query,
        redirectLocation: `${urlRedirectDestination}${path}`,
      })
      const scope = querySuccess({ url: urlRedirectDestination, path, query })
      const res = await httpRequest.get({ uri: path, query })
      assert.isTrue(scopeRedirect.isDone(), 'http redirect request captured by nock')
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(QUERY_SUCCESS_RESPONSE, res.body)
    })
    it('should perform a HTTP GET request with basic authentication', async () => {
      const url = 'http://www.rqlite.com:4001'
      const httpRequest = new HttpRequest(url, {
        authentication: {
          username,
          password,
        },
      })
      const path = '/test'
      const query = { test: '123' }
      const scope = querySuccess({ url, path, auth, query })
      const res = await httpRequest.get({ uri: path, query })
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(QUERY_SUCCESS_RESPONSE, res.body)
    })
    it('should perform a HTTP GET request with a query when the stream option is true', async () => {
      const url = 'http://www.rqlite.com:4001'
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const query = { test: '123' }
      const scope = querySuccess({ url, path, query })
      const request = await httpRequest.get({ uri: path, query, stream: true })
      const result = await handleRequestStreamAsPromise(request)
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(result, QUERY_SUCCESS_RESPONSE)
    })
    it('should perform a HTTP GET request with a query when the stream option is true and follow redirects', async () => {
      const url = 'http://www.rqlite.com:4001'
      const urlRedirectDestination = 'http://www.rqlite.com:4002'
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const query = { test: '123' }
      const scopeRedirect = queryRedirectSuccess({
        url,
        path,
        query,
        redirectLocation: `${urlRedirectDestination}${path}`,
      })
      const scope = querySuccess({ url: urlRedirectDestination, path, query })
      const request = await httpRequest.get({ uri: path, query, stream: true })
      const result = await handleRequestStreamAsPromise(request)
      assert.isTrue(scopeRedirect.isDone(), 'http redirect request captured by nock')
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(result, QUERY_SUCCESS_RESPONSE)
    })
    it('should perform a HTTP GET request with basic authentication when the stream option is true', async () => {
      const url = 'http://www.rqlite.com:4001'
      const httpRequest = new HttpRequest(url, {
        authentication: {
          username,
          password,
        },
      })
      const path = '/test'
      const query = { test: '123' }
      const scope = querySuccess({ url, path, auth, query })
      const request = await httpRequest.get({ uri: path, query, stream: true })
      const result = await handleRequestStreamAsPromise(request)
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(result, QUERY_SUCCESS_RESPONSE)
    })
  })
  describe('Method: HttpRequest.post()', () => {
    it(`should send a HTTP POST request including ${CONTENT_TYPE_APPLICATION_JSON} body`, async () => {
      const url = 'http://www.rqlite.com:4001'
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const body = ['INSERT INTO foo(name) VALUES("fiona")']
      const scope = executeSuccess({ url, path, body })
      const res = await httpRequest.post({ uri: path, body })
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(res.body, EXECUTE_SUCCESS_RESPONSE)
    })
    RETRYABLE_STATUS_CODES.forEach((statusCode) => {
      it(`should send a HTTP POST request including ${CONTENT_TYPE_APPLICATION_JSON} body and retry using the next host on retryable http status code ${statusCode}`, async () => {
        const host1 = 'http://www.rqlite.com:4001'
        const host2 = 'http://www.rqlite.com:4002'
        const httpRequest = new HttpRequest(`${host1},${host2}`, { exponentailBackoffBase: 0 })
        const path = '/test'
        const body = ['INSERT INTO foo(name) VALUES("fiona")']
        const scopeFailure = executeFailureHttpStatusCode({ url: host1, path, body, statusCode })
        const scopeSuccess = executeSuccess({ url: host2, path, body })
        const res = await httpRequest.post({ uri: path, body })
        assert.isTrue(scopeSuccess.isDone(), 'http success request captured by nock')
        assert.isTrue(scopeFailure.isDone(), 'http failure request captured by nock')
        assert.deepEqual(res.body, EXECUTE_SUCCESS_RESPONSE)
      })
      it(`should send a HTTP POST request including ${CONTENT_TYPE_APPLICATION_JSON} body and retry using the next host on retryable http status code ${statusCode} and reject on max retries`, async () => {
        const host1 = 'http://www.rqlite.com:4001'
        const host2 = 'http://www.rqlite.com:4002'
        const httpRequest = new HttpRequest(`${host1},${host2}`, { exponentailBackoffBase: 0 })
        const path = '/test'
        const body = ['INSERT INTO foo(name) VALUES("fiona")']
        const scopes = [
          executeFailureHttpStatusCode({ url: host1, path, body, statusCode }),
          executeFailureHttpStatusCode({ url: host2, path, body, statusCode }),
          executeFailureHttpStatusCode({ url: host1, path, body, statusCode }),
          executeFailureHttpStatusCode({ url: host2, path, body, statusCode }),
          executeFailureHttpStatusCode({ url: host1, path, body, statusCode }),
          executeFailureHttpStatusCode({ url: host2, path, body, statusCode }),
          // Circles back to original host on last retry
          executeFailureHttpStatusCode({ url: host1, path, body, statusCode }),
        ]
        await assert.isRejected(httpRequest.post({ uri: path, body }), `Request failed with status code ${statusCode}`)
        scopes.forEach((scope, i) => {
          assert.isTrue(scope.isDone(), `http failure request attempt ${i} captured by nock`)
        })
      })
    })
    it(`should send a HTTP POST request including ${CONTENT_TYPE_APPLICATION_JSON} body and not retry on http status code ${HTTP_STATUS_CODE_NOT_RETRYABLE}`, async () => {
      const host1 = 'http://www.rqlite.com:4001'
      const host2 = 'http://www.rqlite.com:4002'
      const httpRequest = new HttpRequest(`${host1},${host2}`, { exponentailBackoffBase: 0 })
      const path = '/test'
      const body = ['INSERT INTO foo(name) VALUES("fiona")']
      const scopeFailure = executeFailureHttpStatusCode({
        url: host1, path, body, statusCode: HTTP_STATUS_CODE_NOT_RETRYABLE,
      })
      const scopeSuccess = executeSuccess({ url: host2, path, body })
      await assert.isRejected(httpRequest.post({ uri: path, body }), `Request failed with status code ${HTTP_STATUS_CODE_NOT_RETRYABLE}`)
      assert.isFalse(scopeSuccess.isDone(), 'http success request captured by nock, but not called')
      assert.isTrue(scopeFailure.isDone(), 'http failure request captured by nock')
    })
    RETRYABLE_ERROR_CODES.forEach((errorCode) => {
      it(`should send a HTTP POST request including ${CONTENT_TYPE_APPLICATION_JSON} body and retry using the next host on retryable error code ${errorCode}`, async () => {
        const host1 = 'http://www.rqlite.com:4001'
        const host2 = 'http://www.rqlite.com:4002'
        const httpRequest = new HttpRequest(`${host1},${host2}`, { exponentailBackoffBase: 0 })
        const path = '/test'
        const body = ['INSERT INTO foo(name) VALUES("fiona")']
        const scopeFailure = executeFailureErrorCode({ url: host1, path, body, errorCode })
        const scopeSuccess = executeSuccess({ url: host2, path, body })
        const res = await httpRequest.post({ uri: path, body })
        assert.isTrue(scopeSuccess.isDone(), 'http success request captured by nock')
        assert.isTrue(scopeFailure.isDone(), 'http failure request captured by nock')
        assert.deepEqual(res.body, EXECUTE_SUCCESS_RESPONSE)
      })
      it(`should send a HTTP POST request including ${CONTENT_TYPE_APPLICATION_JSON} body and retry using the next host on retryable error code ${errorCode} and reject on max retries`, async () => {
        const host1 = 'http://www.rqlite.com:4001'
        const host2 = 'http://www.rqlite.com:4002'
        const httpRequest = new HttpRequest(`${host1},${host2}`, { exponentailBackoffBase: 0 })
        const path = '/test'
        const body = ['INSERT INTO foo(name) VALUES("fiona")']
        const scopes = [
          executeFailureErrorCode({ url: host1, path, body, errorCode }),
          executeFailureErrorCode({ url: host2, path, body, errorCode }),
          executeFailureErrorCode({ url: host1, path, body, errorCode }),
          executeFailureErrorCode({ url: host2, path, body, errorCode }),
          executeFailureErrorCode({ url: host1, path, body, errorCode }),
          executeFailureErrorCode({ url: host2, path, body, errorCode }),
          // Circles back to original host on last retry
          executeFailureErrorCode({ url: host1, path, body, errorCode }),
        ]
        await assert.isRejected(httpRequest.post({ uri: path, body }), errorCode)
        scopes.forEach((scope, i) => {
          assert.isTrue(scope.isDone(), `http failure request attempt ${i} captured by nock`)
        })
      })
    })
    it(`should send a HTTP POST request including ${CONTENT_TYPE_APPLICATION_JSON} body and not retry on error code ${ERROR_CODE_NOT_RETRYABLE}`, async () => {
      const host1 = 'http://www.rqlite.com:4001'
      const host2 = 'http://www.rqlite.com:4002'
      const httpRequest = new HttpRequest(`${host1},${host2}`, { exponentailBackoffBase: 0 })
      const path = '/test'
      const body = ['INSERT INTO foo(name) VALUES("fiona")']
      const scopeFailure = executeFailureErrorCode({
        url: host1, path, body, errorCode: ERROR_CODE_NOT_RETRYABLE,
      })
      const scopeSuccess = executeSuccess({ url: host2, path, body })
      await assert.isRejected(httpRequest.post({ uri: path, body }), ERROR_CODE_NOT_RETRYABLE)
      assert.isFalse(scopeSuccess.isDone(), 'http success request captured by nock, but not called')
      assert.isTrue(scopeFailure.isDone(), 'http failure request captured by nock')
    })
    it(`should send a HTTP POST request including ${CONTENT_TYPE_APPLICATION_JSON} body and follow redirects`, async () => {
      const url = 'http://www.rqlite.com:4001'
      const urlRedirectDestination = 'http://www.rqlite.com:4002'
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const body = ['INSERT INTO foo(name) VALUES("fiona")']
      const scopeRedirect = executeRedirectSuccess({
        url,
        path,
        redirectLocation: `${urlRedirectDestination}${path}`,
        body,
      })
      const scope = executeSuccess({ url: urlRedirectDestination, path })
      const res = await httpRequest.post({ uri: path, body })
      assert.isTrue(scopeRedirect.isDone(), 'http redirect request captured by nock')
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(res.body, EXECUTE_SUCCESS_RESPONSE)
    })
    it(`should send a HTTP POST request including ${CONTENT_TYPE_APPLICATION_JSON} body and follow redirects when useLeader is true plus redirect host is not in host list`, async () => {
      const url = 'http://www.rqlite.com:4001'
      const urlRedirectDestination = 'http://www.rqlite.com:4002'
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const body = ['INSERT INTO foo(name) VALUES("fiona")']
      const scopeRedirect = executeRedirectSuccess({
        url,
        path,
        redirectLocation: `${urlRedirectDestination}${path}`,
        body,
      })
      const scope = executeSuccess({ url: urlRedirectDestination, path })
      const res = await httpRequest.post({ uri: path, body, useLeader: true })
      assert.isTrue(scopeRedirect.isDone(), 'http redirect request captured by nock')
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(res.body, EXECUTE_SUCCESS_RESPONSE)
    })
    it(`should send a HTTP POST request including ${CONTENT_TYPE_APPLICATION_JSON} body and follow redirects when useLeader is true plus redirect host is in host list`, async () => {
      const url = 'http://www.rqlite.com:4001'
      const urlRedirectDestination = 'http://www.rqlite.com:4002'
      const path = '/test'
      const httpRequest = new HttpRequest(`${url},${urlRedirectDestination}${path}`)
      const body = ['INSERT INTO foo(name) VALUES("fiona")']
      const scopeRedirect = executeRedirectSuccess({
        url,
        path,
        redirectLocation: `${urlRedirectDestination}${path}`,
        body,
      })
      const scope = executeSuccess({ url: urlRedirectDestination, path })
      const res = await httpRequest.post({ uri: path, body, useLeader: true })
      assert.isTrue(scopeRedirect.isDone(), 'http redirect request captured by nock')
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(res.body, EXECUTE_SUCCESS_RESPONSE)
      assert.equal(httpRequest.getLeaderHostIndex(), 1, 'leader host index matches redirect')
    })
    it(`should send a HTTP POST request including ${CONTENT_TYPE_APPLICATION_JSON} body with basic auth`, async () => {
      const url = 'http://www.rqlite.com:4001'
      const httpRequest = new HttpRequest(url, {
        authentication: {
          username,
          password,
        },
      })
      const path = '/test'
      const body = ['INSERT INTO foo(name) VALUES("fiona")']
      const scope = executeSuccess({ url, path, auth })
      const res = await httpRequest.post({ uri: path, body })
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(res.body, EXECUTE_SUCCESS_RESPONSE)
    })
    it(`should send a HTTP POST request including ${CONTENT_TYPE_APPLICATION_JSON} body when the stream option is true`, async () => {
      const url = 'http://www.rqlite.com:4001'
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const body = ['INSERT INTO foo(name) VALUES("fiona")']
      const scope = executeSuccess({ url, path })
      const request = await httpRequest.post({ uri: path, body, stream: true })
      const result = await handleRequestStreamAsPromise(request)
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(result, EXECUTE_SUCCESS_RESPONSE)
    })
    it(`should send a HTTP POST request including ${CONTENT_TYPE_APPLICATION_JSON} body with basic auth when the stream option is true`, async () => {
      const url = 'http://www.rqlite.com:4001'
      const httpRequest = new HttpRequest(url, {
        authentication: {
          username,
          password,
        },
      })
      const path = '/test'
      const body = ['INSERT INTO foo(name) VALUES("fiona")']
      const scope = executeSuccess({ url, path, auth })
      const request = await httpRequest.post({ uri: path, body, stream: true })
      const result = await handleRequestStreamAsPromise(request)
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(result, EXECUTE_SUCCESS_RESPONSE)
    })
    it(`should send a HTTP POST request including ${CONTENT_TYPE_APPLICATION_JSON} body with basic auth used in constructor when the stream option is true`, async () => {
      const url = 'http://www.rqlite.com:4001'
      const httpRequest = new HttpRequest(url, {
        authentication: {
          username,
          password,
        },
      })
      const path = '/test'
      const body = ['INSERT INTO foo(name) VALUES("fiona")']
      const scope = executeSuccess({ url, path, auth })
      const request = await httpRequest.post({ uri: path, body, stream: true })
      const result = await handleRequestStreamAsPromise(request)
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(result, EXECUTE_SUCCESS_RESPONSE)
    })
  })
})
