import {describe, it} from 'mocha'
import {assert} from 'chai'
import nock from 'nock'
import {
  get,
  post,
  createHttpOptions
} from './index'
import {CONTENT_TYPE_APPLICATION_JSON} from '../../http/content-types'
import {PATH as PATH_QUERY} from '../data/query'
import {PATH as PATH_EXECUTE} from '../data/execute'
import {querySuccess, QUERY_SUCCESS_RESPONSE} from '../../test/api-data-query-nock'
import {executeSuccess, EXECUTE_SUCCESS_RESPONSE} from '../../test/api-data-execute-nock'

const URL = 'http://www.rqlite.com:4001'

describe('api client', function () {
  beforeEach(nock.cleanAll)
  describe('Function: createHttpOptions()', function () {
    it('it should create the httpOptions using standard request options', function () {
      const httpOptions = {
        query: {
          preserved: true
        }
      }
      const options = {
        pretty: true,
        timings: true,
        transaction: true,
        httpOptions
      }
      const expected = {
        query: {
          preserved: true,
          pretty: true,
          timings: true,
          transaction: true
        }
      }
      const createdHttpOptions = createHttpOptions(options)
      assert.deepEqual(expected, createdHttpOptions)
    })
  })
  describe('Function: post()', function () {
    it(`should call the ${URL}${PATH_EXECUTE} endpoint with a request body using HTTP POST when using insert`, function (done) {
      const sql = 'INSERT INTO foo(name) VALUES(\"fiona\")'
      const scope = executeSuccess({url: URL, path: PATH_EXECUTE})
      post(URL, PATH_EXECUTE, {httpOptions: {body: [sql]}})
        .then((res) => {
          assert.isTrue(scope.isDone(), 'http request captured by nock')
          assert.deepEqual([sql], res.request._data)
          assert.deepEqual(EXECUTE_SUCCESS_RESPONSE, res.body)
          done()
        })
        .catch(done)
    })
  })
  describe('Function: get()', function () {
    it(`should call the ${URL}${PATH_QUERY} endpoint with a query using HTTP GET when using select`, function (done) {
      const sql = 'SELECT * FROM foo'
      const query = {
        q: sql
      }
      const scope = querySuccess({url: URL, path: PATH_QUERY})
      get(URL, PATH_QUERY, {httpOptions: {query}})
        .then((res) => {
          assert.isTrue(scope.isDone(), 'http request captured by nock')
          assert.deepEqual(query, res.request.qs)
          assert.deepEqual(QUERY_SUCCESS_RESPONSE, res.body)
          done()
        })
        .catch(done)
    })
  })
})