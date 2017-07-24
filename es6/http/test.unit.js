import {describe, it} from 'mocha'
import {assert} from 'chai'
import nock from 'nock'
import {querySuccess, QUERY_SUCCESS_RESPONSE} from '../test/api-data-query-nock'
import {executeSuccess, EXECUTE_SUCCESS_RESPONSE} from '../test/api-data-execute-nock'
import {
  CONTENT_TYPE_APPLICATION_JSON,
  CONTENT_TYPE_APPLICATION_X_WWW_FORM_URLENCODED
} from './content-types'
import {
  get,
  post,
  createDefaultHeaders,
  createJsonHeaders
} from './index'

describe('http', function () {
  beforeEach(nock.cleanAll)
  describe('Function: createDefaultHeaders()', function () {
    it(`should add the Accept header with a value of ${CONTENT_TYPE_APPLICATION_JSON}`, function () {
      assert.deepEqual({Accept: CONTENT_TYPE_APPLICATION_JSON}, createDefaultHeaders())
    })
  })
  describe('Function: createJsonHeaders()', function () {
    it(`should add the CotentType header with a value of ${CONTENT_TYPE_APPLICATION_JSON}`, function () {
      const headers = {'Content-Type': CONTENT_TYPE_APPLICATION_JSON}
      assert.deepEqual(headers, createJsonHeaders())
    })
  })
  describe('Function: get()', function () {
    it('should make a HTTP get request with a query', function (done) {
      const url = 'http://www.rqlite.com:4001'
      const path = '/test'
      const query = {
        test: '123'
      }
      const scope = querySuccess({url, path})
      get(`${url}${path}`, {query})
        .then((res) => {
          assert.isTrue(scope.isDone(), 'http request captured by nock')
          assert.deepEqual(query, res.request.qs)
          assert.deepEqual(QUERY_SUCCESS_RESPONSE, res.body)
          done()
        })
        .catch(done)
    })
  })
  describe('Function: post()', function () {
    it(`should make a HTTP post request and send a ${CONTENT_TYPE_APPLICATION_JSON} body`, function (done) {
      const url = 'http://www.rqlite.com:4001'
      const path = '/test'
      const body = [
        'INSERT INTO foo(name) VALUES("fiona")'
      ]
      const scope = executeSuccess({url, path})
      post(`${url}${path}`, {body})
        .then((res) => {
          assert.isTrue(scope.isDone(), 'http request captured by nock')
          assert.deepEqual(body, res.request._data)
          assert.deepEqual(EXECUTE_SUCCESS_RESPONSE, res.body)
          done()
        })
        .catch(done)
    })
  })
})