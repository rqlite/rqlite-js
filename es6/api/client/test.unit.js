import { assert } from 'chai'
import { PATH_QUERY, PATH_EXECUTE } from '../data'
import { querySuccess, QUERY_SUCCESS_RESPONSE } from '../../test/api-data-query-nock'
import { executeSuccess, EXECUTE_SUCCESS_RESPONSE } from '../../test/api-data-execute-nock'
import ApiClient, { createQuery } from '.'

const HOST = 'http://www.rqlite.com:4001'

describe('api client', () => {
  describe('Function: createQuery()', () => {
    it('it should create the httpOptions using standard request options', () => {
      const options = {
        atomic: true,
        level: 'strong',
        pretty: true,
        timings: true,
        transaction: true,
      }
      const expected = {
        atomic: true,
        level: 'strong',
        pretty: true,
        timings: true,
        transaction: true,
      }
      const result = createQuery(options)
      assert.deepEqual(result, expected)
    })
  })
  describe('Function: post()', () => {
    it(`should call ${HOST}${PATH_EXECUTE} endpoint with a request body using HTTP POST when using insert`, async () => {
      const apiClient = new ApiClient(HOST)
      const sql = 'INSERT INTO foo(name) VALUES("fiona")'
      const scope = executeSuccess({ url: HOST, path: PATH_EXECUTE, body: [sql] })
      const res = await apiClient.post(PATH_EXECUTE, sql)
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      // eslint-disable-next-line  no-underscore-dangle
      assert.deepEqual(res.body, EXECUTE_SUCCESS_RESPONSE)
    })
  })
  describe('Function: get()', () => {
    it(`should call ${HOST}${PATH_QUERY} endpoint with a query using HTTP GET when using select`, async () => {
      const apiClient = new ApiClient(HOST)
      const sql = 'SELECT * FROM foo'
      const query = { q: sql }
      const scope = querySuccess({ url: HOST, path: PATH_QUERY, query })
      const res = await apiClient.get(PATH_QUERY, sql)
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(res.body, QUERY_SUCCESS_RESPONSE)
    })
  })
})
