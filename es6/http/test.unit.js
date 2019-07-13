import { describe, it } from 'mocha'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { querySuccess, QUERY_SUCCESS_RESPONSE } from '../test/api-data-query-nock'
import { executeSuccess, EXECUTE_SUCCESS_RESPONSE } from '../test/api-data-execute-nock'
import { CONTENT_TYPE_APPLICATION_JSON } from './content-types'
import {
  get,
  post,
  createDefaultHeaders,
  createJsonHeaders,
} from './index'

chai.use(chaiAsPromised)
const { assert } = chai

const username = 'TestUsername'
const password = 'TestPassword'
const auth = {
  user: username,
  pass: password,
}

describe('http', () => {
  describe('Function: createDefaultHeaders()', () => {
    it(`should add the Accept header with a value of ${CONTENT_TYPE_APPLICATION_JSON}`, () => {
      assert.deepEqual({ Accept: CONTENT_TYPE_APPLICATION_JSON }, createDefaultHeaders())
    })
  })
  describe('Function: createJsonHeaders()', () => {
    it(`should add the CotentType header with a value of ${CONTENT_TYPE_APPLICATION_JSON}`, () => {
      const headers = { 'Content-Type': CONTENT_TYPE_APPLICATION_JSON }
      assert.deepEqual(headers, createJsonHeaders())
    })
  })
  describe('Function: get()', () => {
    it('should make a HTTP get request with a query', async () => {
      const url = 'http://www.rqlite.com:4001'
      const path = '/test'
      const query = {
        test: '123',
      }
      const scope = querySuccess({ url, path, query })
      const res = await assert.isFulfilled(get(`${url}${path}`, { query }))
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(QUERY_SUCCESS_RESPONSE, res.body)
    })
    it('should make a HTTP get request with basic authentication', async () => {
      const url = `http://${username}:${password}@www.rqlite.com:4001`
      const path = '/test'
      const query = {
        test: '123',
      }
      const scope = querySuccess({
        url, path, auth, query,
      })
      const res = await assert.isFulfilled(get(`${url}${path}`, { query }))
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(QUERY_SUCCESS_RESPONSE, res.body)
    })
  })
  describe('Function: post()', () => {
    it(`should make a HTTP post request and send a ${CONTENT_TYPE_APPLICATION_JSON} body`, async () => {
      const url = 'http://www.rqlite.com:4001'
      const path = '/test'
      const body = [
        'INSERT INTO foo(name) VALUES("fiona")',
      ]
      const scope = executeSuccess({ url, path })
      const res = await assert.isFulfilled(post(`${url}${path}`, { body }))
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      // eslint-disable-next-line no-underscore-dangle
      assert.deepEqual(body, res.request._data)
      assert.deepEqual(EXECUTE_SUCCESS_RESPONSE, res.body)
    })
    it(`should make a HTTP post request and send a ${CONTENT_TYPE_APPLICATION_JSON} body with basic auth`, async () => {
      const url = 'http://www.rqlite.com:4001'
      const path = '/test'
      const body = [
        'INSERT INTO foo(name) VALUES("fiona")',
      ]
      const scope = executeSuccess({ url, path, auth })
      const res = await assert.isFulfilled(post(`${url}${path}`, { body, auth }))
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      // eslint-disable-next-line no-underscore-dangle
      assert.deepEqual(body, res.request._data)
      assert.deepEqual(EXECUTE_SUCCESS_RESPONSE, res.body)
    })
  })
})
