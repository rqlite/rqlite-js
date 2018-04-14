import {describe, it} from 'mocha'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import nock from 'nock'
import query, {PATH} from './index'
import {
  querySuccess,
  QUERY_SUCCESS_RESPONSE,
  queryMultipleSuccess,
  QUERY_MULTIPLE_SUCCESS_RESPONSE,
} from '../../../test/api-data-query-nock'

chai.use(chaiAsPromised)
const {assert} = chai

const URL = 'http://www.rqlite.com:4001'

describe('api data query', () => {
  before(() => nock.disableNetConnect())
  beforeEach(() => nock.cleanAll())
  after(() => nock.enableNetConnect())
  describe('Function: query()', () => {
    it(`should call the ${URL}${PATH} endpoint with a query using HTTP GET and include a level query`, async () => {
      const sql = 'SELECT * FROM foo'
      const level = 'strong'
      const apiQuery = {
        q: sql,
        level,
      }
      const scope = querySuccess({url: URL, path: PATH, query: apiQuery})
      const res = await assert.isFulfilled(query(URL, sql, {level}))
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(QUERY_SUCCESS_RESPONSE, res.body)
    })
    it(`should call the ${URL}${PATH} endpoint with a query using HTTP POST if sql is an array`, async () => {
      const sql = ['SELECT * FROM foo', 'SELECT * FROM bar']
      const level = 'weak'
      const apiQuery = {
        level,
      }
      const scope = queryMultipleSuccess({url: URL, path: PATH, query: apiQuery})
      const res = await assert.isFulfilled(query(URL, sql, {level}))
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(QUERY_MULTIPLE_SUCCESS_RESPONSE, res.body)
    })
  })
})
