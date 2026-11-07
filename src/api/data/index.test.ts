import {
  querySuccess,
  QUERY_SUCCESS_RESPONSE,
  queryMultipleSuccess,
  QUERY_MULTIPLE_SUCCESS_RESPONSE,
} from '../../test/api-data-query-nock'
import { executeSuccess, EXECUTE_SUCCESS_RESPONSE } from '../../test/api-data-execute-nock'
import DataApiClient, {
  PATH_QUERY,
  PATH_EXECUTE,
  CONSISTENCY_LEVEL_NONE,
} from '.'
import { DataResults } from '../results'

const HOST = 'http://www.rqlite.com:4001'

describe('api data', () => {
  describe('DataApiclient.query()', () => {
    it(`should call ${HOST}${PATH_QUERY} endpoint with a query using HTTP GET and include a level query`, async () => {
      const dataApiClient = new DataApiClient(HOST)
      const sql = 'SELECT * FROM foo'
      const level = 'strong'
      const apiQuery = { q: sql, level }
      const scope = querySuccess({ url: HOST, path: PATH_QUERY, query: apiQuery })
      const res = await dataApiClient.query(sql, { level, raw: true })
      expect(scope.isDone()).toBe(true)
      expect(QUERY_SUCCESS_RESPONSE).toEqual(res.body)
    })
    it(`should call ${HOST}${PATH_QUERY} endpoint with a query using HTTP POST if sql is an array`, async () => {
      const dataApiClient = new DataApiClient(HOST)
      const sql = ['SELECT * FROM foo', 'SELECT * FROM bar']
      const level = 'weak'
      const apiQuery = { level }
      const scope = queryMultipleSuccess({
        url: HOST, path: PATH_QUERY, query: apiQuery, body: sql,
      })
      const res = await dataApiClient.query(sql, { level, raw: true })
      expect(scope.isDone()).toBe(true)
      expect(QUERY_MULTIPLE_SUCCESS_RESPONSE).toEqual(res.body)
    })
    it(`should call ${HOST}${PATH_QUERY} endpoint with a query using HTTP GET when using select`, async () => {
      const dataApiClient = new DataApiClient(HOST)
      const sql = 'SELECT * FROM foo'
      const query = { q: sql }
      const scope = querySuccess({ url: HOST, path: PATH_QUERY, query })
      const res = await dataApiClient.query(sql, { raw: true })
      expect(scope.isDone()).toBe(true)
      expect(QUERY_SUCCESS_RESPONSE).toEqual(res.body)
    })
    it(`should call ${HOST}${PATH_QUERY} with level=none and still return DataResults by default`, async () => {
      const dataApiClient = new DataApiClient(HOST)
      const sql = 'SELECT * FROM foo'
      const query = { q: sql, level: CONSISTENCY_LEVEL_NONE }
      const scope = querySuccess({ url: HOST, path: PATH_QUERY, query })
      const res = await dataApiClient.query(sql, { level: CONSISTENCY_LEVEL_NONE })
      expect(scope.isDone()).toBe(true)
      expect(res).toBeInstanceOf(DataResults)
    })
    it(`should POST parameterized SELECT statements as nested JSON arrays`, async () => {
      const dataApiClient = new DataApiClient(HOST)
      const sql = [['SELECT * FROM foo WHERE id = ?', 1]]
      const scope = queryMultipleSuccess({
        url: HOST,
        path: PATH_QUERY,
        query: {},
        body: sql,
        response: QUERY_SUCCESS_RESPONSE,
      })
      const res = await dataApiClient.query(sql as unknown as string[], { raw: true })
      expect(scope.isDone()).toBe(true)
      expect(res.body).toEqual(QUERY_SUCCESS_RESPONSE)
    })
  })
  describe('DataApiclient.execute()', () => {
    it(`should call ${HOST}${PATH_EXECUTE} endpoint with a query using HTTP POST`, async () => {
      const dataApiClient = new DataApiClient(HOST)
      const sql = 'INSERT INTO foo(name) VALUES("fiona")'
      const scope = executeSuccess({ url: HOST, path: PATH_EXECUTE, body: [sql] })
      const res = await dataApiClient.execute(sql, { raw: true })
      expect(scope.isDone()).toBe(true)
      expect(res.body).toEqual(EXECUTE_SUCCESS_RESPONSE)
    })
    it(`should call ${HOST}${PATH_EXECUTE} endpoint with a request body using HTTP POST when performing an insert`, async () => {
      const dataApiClient = new DataApiClient(HOST)
      const sql = 'INSERT INTO foo(name) VALUES("fiona")'
      const scope = executeSuccess({ url: HOST, path: PATH_EXECUTE, body: [sql] })
      const res = await dataApiClient.execute(sql, { raw: true })
      expect(scope.isDone()).toBe(true)
      expect(EXECUTE_SUCCESS_RESPONSE).toEqual(res.body)
    })
    it(`should call ${HOST}${PATH_EXECUTE} endpoint with a request body using HTTP POST when performing an update`, async () => {
      const dataApiClient = new DataApiClient(HOST)
      const sql = 'UPDATE foo SET name="fionaTest" WHERE name="fiona"'
      const scope = executeSuccess({ url: HOST, path: PATH_EXECUTE, body: [sql] })
      const res = await dataApiClient.execute(sql, { raw: true })
      expect(scope.isDone()).toBe(true)
      expect(EXECUTE_SUCCESS_RESPONSE).toEqual(res.body)
    })
    it(`should call ${HOST}${PATH_EXECUTE} endpoint with a request body using HTTP POST when performing a delete`, async () => {
      const dataApiClient = new DataApiClient(HOST)
      const sql = 'DELETE FROM foo WHERE name="fiona"'
      const scope = executeSuccess({ url: HOST, path: PATH_EXECUTE, body: [sql] })
      const res = await dataApiClient.execute(sql, { raw: true })
      expect(scope.isDone()).toBe(true)
      expect(EXECUTE_SUCCESS_RESPONSE).toEqual(res.body)
    })
    it(`should call ${HOST}${PATH_EXECUTE} endpoint with a request body using HTTP POST when performing a create table`, async () => {
      const dataApiClient = new DataApiClient(HOST)
      const sql = 'CREATE TABLE foo (id integer not null primary key, name text)'
      const scope = executeSuccess({ url: HOST, path: PATH_EXECUTE, body: [sql] })
      const res = await dataApiClient.execute(sql, { raw: true })
      expect(scope.isDone()).toBe(true)
      expect(EXECUTE_SUCCESS_RESPONSE).toEqual(res.body)
    })
    it(`should call ${HOST}${PATH_EXECUTE} endpoint with a request body using HTTP POST when performing a drop table`, async () => {
      const dataApiClient = new DataApiClient(HOST)
      const sql = 'DROP TABLE foo'
      const scope = executeSuccess({ url: HOST, path: PATH_EXECUTE, body: [sql] })
      const res = await dataApiClient.execute(sql, { raw: true })
      expect(scope.isDone()).toBe(true)
      expect(EXECUTE_SUCCESS_RESPONSE).toEqual(res.body)
    })
    it(`should POST parameterized INSERT statements as nested JSON arrays`, async () => {
      const dataApiClient = new DataApiClient(HOST)
      const sql = [['INSERT INTO foo(name) VALUES(?)', 'fiona']]
      const scope = executeSuccess({ url: HOST, path: PATH_EXECUTE, body: sql })
      const res = await dataApiClient.execute(sql as unknown as string[], { raw: true })
      expect(scope.isDone()).toBe(true)
      expect(res.body).toEqual(EXECUTE_SUCCESS_RESPONSE)
    })
    it(`should include atomic=true on execute query string`, async () => {
      const dataApiClient = new DataApiClient(HOST)
      const sql = ['INSERT INTO foo(name) VALUES("a")', 'INSERT INTO foo(name) VALUES("b")']
      const scope = executeSuccess({
        url: HOST,
        path: PATH_EXECUTE,
        body: sql,
        query: { atomic: 'true' },
      })
      const res = await dataApiClient.execute(sql, { raw: true, atomic: true })
      expect(scope.isDone()).toBe(true)
      expect(res.body).toEqual(EXECUTE_SUCCESS_RESPONSE)
    })
  })
})

