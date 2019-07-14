import { describe, it } from 'mocha'
import { assert } from 'chai'
import {
  get,
  post,
  createHttpOptions,
} from './index'
import { PATH as PATH_QUERY } from '../data/query'
import { PATH as PATH_EXECUTE } from '../data/execute'
import { querySuccess, QUERY_SUCCESS_RESPONSE } from '../../test/api-data-query-nock'
import { executeSuccess, EXECUTE_SUCCESS_RESPONSE } from '../../test/api-data-execute-nock'

const URL = 'http://www.rqlite.com:4001'

describe('api client', () => {
  describe('Function: createHttpOptions()', () => {
    it('it should create the httpOptions using standard request options', () => {
      const httpOptions = {
        query: {
          preserved: true,
        },
      }
      const options = {
        level: true,
        pretty: true,
        timings: true,
        transaction: true,
        httpOptions,
      }
      const expected = {
        query: {
          level: true,
          preserved: true,
          pretty: true,
          timings: true,
          transaction: true,
        },
      }
      const createdHttpOptions = createHttpOptions(options)
      assert.deepEqual(expected, createdHttpOptions)
    })
  })
  describe('Function: post()', () => {
    it(`should call ${URL}${PATH_EXECUTE} endpoint with a request body using HTTP POST when using insert`, async () => {
      const sql = 'INSERT INTO foo(name) VALUES("fiona")'
      const scope = executeSuccess({ url: URL, path: PATH_EXECUTE })
      const res = await assert.isFulfilled(post(URL, PATH_EXECUTE, {
        httpOptions: { body: [sql] },
      }))
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      // eslint-disable-next-line  no-underscore-dangle
      assert.deepEqual([sql], res.request._data)
      assert.deepEqual(EXECUTE_SUCCESS_RESPONSE, res.body)
    })
  })
  describe('Function: get()', () => {
    it(`should call ${URL}${PATH_QUERY} endpoint with a query using HTTP GET when using select`, async () => {
      const sql = 'SELECT * FROM foo'
      const query = {
        q: sql,
      }
      const scope = querySuccess({ url: URL, path: PATH_QUERY, query })
      const res = await assert.isFulfilled(get(URL, PATH_QUERY, { httpOptions: { query } }))
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(QUERY_SUCCESS_RESPONSE, res.body)
    })
  })
})
