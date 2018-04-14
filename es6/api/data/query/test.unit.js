import {describe, it} from 'mocha'
import {assert} from 'chai'
import nock from 'nock'
import query, {PATH} from './index'
import {CONTENT_TYPE_APPLICATION_JSON} from '../../../http/content-types'
import {
  querySuccess,
  QUERY_SUCCESS_RESPONSE,
  queryMultipleSuccess,
  QUERY_MULTIPLE_SUCCESS_RESPONSE,
} from '../../../test/api-data-query-nock'

const URL = 'http://www.rqlite.com:4001'

describe('api data query', () => {
  beforeEach(() => nock.cleanAll())
  describe('Function: query()', () => {
    it(`should call the ${URL}${PATH} endpoint with a query using HTTP GET and include a level query`, (done) => {
      const sql = 'SELECT * FROM foo'
      const level = 'strong'
      const apiQuery = {
        q: sql,
        level,
      }
      const scope = querySuccess({url: URL, path: PATH, query: apiQuery})
      query(URL, sql, {level})
        .then((res) => {
          assert.isTrue(scope.isDone(), 'http request captured by nock')
          assert.deepEqual(QUERY_SUCCESS_RESPONSE, res.body)
          done()
        })
        .catch(done)
    })
    it(`should call the ${URL}${PATH} endpoint with a query using HTTP POST if sql is an array`, (done) => {
      const sql = ['SELECT * FROM foo', 'SELECT * FROM bar']
      const level = 'weak'
      const apiQuery = {
        level,
      }
      const scope = queryMultipleSuccess({url: URL, path: PATH, query: apiQuery})
      query(URL, sql, {level})
        .then((res) => {
          assert.isTrue(scope.isDone(), 'http request captured by nock')
          assert.deepEqual(QUERY_MULTIPLE_SUCCESS_RESPONSE, res.body)
          done()
        })
        .catch(done)
    })
  })
})
