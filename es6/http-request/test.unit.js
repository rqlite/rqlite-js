import { assert } from 'chai'
import { Agent as HttpAgent } from 'http'
import { Agent as HttpsAgent } from 'https'
import { querySuccess, queryRedirectSuccess, QUERY_SUCCESS_RESPONSE } from '../test/api-data-query-nock'
import { executeSuccess, executeRedirectSuccess, EXECUTE_SUCCESS_RESPONSE } from '../test/api-data-execute-nock'
import { CONTENT_TYPE_APPLICATION_JSON } from './content-types'
import HttpRequest, { createDefaultHeaders } from '.'

const username = 'TestUsername'
const password = 'TestPassword'
const auth = {
  user: username,
  pass: password,
}

/**
 * Capture the stream data and resolve a promise with the parsed JSON
 */
function handleRequestStreamAsPromise (request) {
  return new Promise(async (resolve, reject) => {
    let json = Buffer.from('')
    request
      .on('data', (data) => {
        json = Buffer.concat([json, data])
      })
      .on('end', () => resolve(JSON.parse(json)))
      .on('error', reject)
  })
}

describe('http-request', () => {
  describe('Function: createDefaultHeaders()', () => {
    it(`should add the Accept header with a value of ${CONTENT_TYPE_APPLICATION_JSON}`, () => {
      assert.deepEqual({ Accept: CONTENT_TYPE_APPLICATION_JSON }, createDefaultHeaders())
    })
  })
  describe('Function: get()', () => {
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
      const url = `http://${username}:${password}@www.rqlite.com:4001`
      const httpRequest = new HttpRequest(url)
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
      const url = `http://${username}:${password}@www.rqlite.com:4001`
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const query = { test: '123' }
      const scope = querySuccess({ url, path, auth, query })
      const request = await httpRequest.get({ uri: path, query, stream: true })
      const result = await handleRequestStreamAsPromise(request)
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(result, QUERY_SUCCESS_RESPONSE)
    })
  })
  describe('Function: post()', () => {
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
    it(`should send a HTTP POST request including ${CONTENT_TYPE_APPLICATION_JSON} body with basic auth`, async () => {
      const url = 'http://www.rqlite.com:4001'
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const body = ['INSERT INTO foo(name) VALUES("fiona")']
      const scope = executeSuccess({ url, path, auth })
      const res = await httpRequest.post({ uri: path, body, auth })
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
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const body = ['INSERT INTO foo(name) VALUES("fiona")']
      const scope = executeSuccess({ url, path, auth })
      const request = await httpRequest.post({ auth, uri: path, body, stream: true })
      const result = await handleRequestStreamAsPromise(request)
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(result, EXECUTE_SUCCESS_RESPONSE)
    })
  })
})
