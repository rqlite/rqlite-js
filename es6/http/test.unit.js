import { describe, it } from 'mocha'
import { assert } from 'chai'
import nock from 'nock'
import { querySuccess, QUERY_SUCCESS_RESPONSE } from '../test/api-data-query-nock'
import { executeSuccess, EXECUTE_SUCCESS_RESPONSE } from '../test/api-data-execute-nock'
import { CONTENT_TYPE_APPLICATION_JSON } from './content-types'
import {
  get,
  post,
  createDefaultHeaders,
  createJsonHeaders,
} from './index'

const username = 'TestUsername'
const password = 'TestPassword'
const auth = {
  user: username,
  pass: password,
}

describe('http', () => {
  beforeEach(() => nock.cleanAll())
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
    it('should make a HTTP get request with a query', (done) => {
      const url = 'http://www.rqlite.com:4001'
      const path = '/test'
      const query = {
        test: '123',
      }
      const scope = querySuccess({ url, path, query })
      get(`${url}${path}`, { query })
        .then((res) => {
          assert.isTrue(scope.isDone(), 'http request captured by nock')
          assert.deepEqual(QUERY_SUCCESS_RESPONSE, res.body)
          done()
        })
        .catch(done)
    })
    it('should make a HTTP get request with basic authentication', (done) => {
      const url = `http://${username}:${password}@www.rqlite.com:4001`
      const path = '/test'
      const query = {
        test: '123',
      }
      const scope = querySuccess({
        url, path, auth, query,
      })
      get(`${url}${path}`, { query })
        .then((res) => {
          assert.isTrue(scope.isDone(), 'http request captured by nock')
          assert.deepEqual(QUERY_SUCCESS_RESPONSE, res.body)
          done()
        })
        .catch(done)
    })
  })
  describe('Function: post()', () => {
    it(`should make a HTTP post request and send a ${CONTENT_TYPE_APPLICATION_JSON} body`, (done) => {
      const url = 'http://www.rqlite.com:4001'
      const path = '/test'
      const body = [
        'INSERT INTO foo(name) VALUES("fiona")',
      ]
      const scope = executeSuccess({ url, path })
      post(`${url}${path}`, { body })
        .then((res) => {
          assert.isTrue(scope.isDone(), 'http request captured by nock')
          // eslint-disable-next-line no-underscore-dangle
          assert.deepEqual(body, res.request._data)
          assert.deepEqual(EXECUTE_SUCCESS_RESPONSE, res.body)
          done()
        })
        .catch(done)
    })
    it(`should make a HTTP post request and send a ${CONTENT_TYPE_APPLICATION_JSON} body with basic auth`, (done) => {
      const url = 'http://www.rqlite.com:4001'
      const path = '/test'
      const body = [
        'INSERT INTO foo(name) VALUES("fiona")',
      ]
      const scope = executeSuccess({ url, path, auth })
      post(`${url}${path}`, { body, auth })
        .then((res) => {
          assert.isTrue(scope.isDone(), 'http request captured by nock')
          // eslint-disable-next-line no-underscore-dangle
          assert.deepEqual(body, res.request._data)
          assert.deepEqual(EXECUTE_SUCCESS_RESPONSE, res.body)
          done()
        })
        .catch(done)
    })
  })
})
