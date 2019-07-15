import { assert } from 'chai'
import connect from './index'
import { PATH as PATH_QUERY } from '../query'
import { PATH as PATH_EXECUTE } from '../execute'
import { querySuccess, QUERY_SUCCESS_RESPONSE } from '../../../test/api-data-query-nock'
import { executeSuccess, EXECUTE_SUCCESS_RESPONSE } from '../../../test/api-data-execute-nock'

const URL = 'http://www.rqlite.com:4001'

describe('api data client', () => {
  describe('Function: connect()', () => {
    it(`should call ${URL}${PATH_EXECUTE} endpoint with a request body using HTTP POST when performing an insert`, async () => {
      const api = await assert.isFulfilled(connect(URL))
      const scope = executeSuccess({ url: URL, path: PATH_EXECUTE })
      const sql = 'INSERT INTO foo(name) VALUES("fiona")'
      const res = await assert.isFulfilled(api.insert(sql))
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      // eslint-disable-next-line no-underscore-dangle
      assert.deepEqual([sql], res.request._data)
      assert.deepEqual(EXECUTE_SUCCESS_RESPONSE, res.body)
    })
    it(`should call ${URL}${PATH_EXECUTE} endpoint with a request body using HTTP POST when performing an update`, async () => {
      const api = await assert.isFulfilled(connect(URL))
      const scope = executeSuccess({ url: URL, path: PATH_EXECUTE })
      const sql = 'UPDATE foo SET name="fionaTest" WHERE name="fiona"'
      const res = await assert.isFulfilled(api.update(sql))
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      // eslint-disable-next-line no-underscore-dangle
      assert.deepEqual([sql], res.request._data)
      assert.deepEqual(EXECUTE_SUCCESS_RESPONSE, res.body)
    })
    it(`should call ${URL}${PATH_EXECUTE} endpoint with a request body using HTTP POST when performing a delete`, async () => {
      const api = await assert.isFulfilled(connect(URL))
      const scope = executeSuccess({ url: URL, path: PATH_EXECUTE })
      const sql = 'DELETE FROM foo WHERE name="fiona"'
      const res = await assert.isFulfilled(api.delete(sql))
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      // eslint-disable-next-line no-underscore-dangle
      assert.deepEqual([sql], res.request._data)
      assert.deepEqual(EXECUTE_SUCCESS_RESPONSE, res.body)
    })
    it(`should call ${URL}${PATH_EXECUTE} endpoint with a request body using HTTP POST when performing a create table`, async () => {
      const api = await assert.isFulfilled(connect(URL))
      const scope = executeSuccess({ url: URL, path: PATH_EXECUTE })
      const sql = 'CREATE TABLE foo (id integer not null primary key, name text)'
      const res = await assert.isFulfilled(api.table.create(sql))
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      // eslint-disable-next-line no-underscore-dangle
      assert.deepEqual([sql], res.request._data)
      assert.deepEqual(EXECUTE_SUCCESS_RESPONSE, res.body)
    })
    it(`should call ${URL}${PATH_EXECUTE} endpoint with a request body using HTTP POST when performing a drop table`, async () => {
      const api = await assert.isFulfilled(connect(URL))
      const scope = executeSuccess({ url: URL, path: PATH_EXECUTE })
      const sql = 'DROP TABLE foo'
      const res = await assert.isFulfilled(api.table.create(sql))
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      // eslint-disable-next-line no-underscore-dangle
      assert.deepEqual([sql], res.request._data)
      assert.deepEqual(EXECUTE_SUCCESS_RESPONSE, res.body)
    })
    it(`should call ${URL}${PATH_QUERY} endpoint with a query using HTTP GET when using select`, async () => {
      const api = await assert.isFulfilled(connect(URL))
      const sql = 'SELECT * FROM foo'
      const query = {
        q: sql,
      }
      const scope = querySuccess({ url: URL, path: PATH_QUERY, query })
      const res = await assert.isFulfilled(api.select(sql))
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(QUERY_SUCCESS_RESPONSE, res.body)
    })
  })
})
