import { assert } from 'chai'
import get from 'lodash/get'
import size from 'lodash/size'
import { getUrl } from '../../test/integrations'
import { getError } from '../results'
import DataApiClient, { PATH_EXECUTE, PATH_QUERY } from '.'

const HOST = getUrl()

describe('api data client', () => {
  const dataApiClient = new DataApiClient(HOST)
  async function cleanUp () {
    await dataApiClient.dropTable('DROP TABLE IF EXISTS foo')
  }
  before(cleanUp)
  after(cleanUp)
  describe('Function: connect()', () => {
    it(`should call ${HOST}${PATH_EXECUTE} and create table named foo`, async () => {
      const sql = 'CREATE TABLE foo (id integer not null primary key, name text)'
      const res = await dataApiClient.createTable(sql)
      const results = get(res, ['body', 'results'])
      const error = getError(results)
      if (error) {
        throw error
      }
      assert.equal(1, size(results))
    })
    it(`should call ${HOST}${PATH_EXECUTE} and insert a record with the name fiona`, async () => {
      const sql = 'INSERT INTO foo(name) VALUES("fiona")'
      const res = await dataApiClient.insert(sql)
      const results = get(res, ['body', 'results'])
      const error = getError(results)
      if (error) {
        throw error
      }
      assert.equal(1, get(results, [0, 'rows_affected']))
      assert.equal(1, get(results, [0, 'last_insert_id']))
    })
    it(`should call ${HOST}${PATH_QUERY} and select a record with the name fiona`, async () => {
      const sql = 'SELECT name FROM foo WHERE name="fiona"'
      const res = await dataApiClient.select(sql)
      const results = get(res, ['body', 'results'])
      const error = getError(results)
      if (error) {
        throw error
      }
      assert.equal('fiona', get(results, [0, 'values', 0]))
    })
    it(`should call ${HOST}${PATH_EXECUTE} and update the record with the name fiona to the name justin`, async () => {
      const sql = 'UPDATE foo SET name="justin" WHERE name="fiona"'
      const res = await dataApiClient.update(sql)
      const results = get(res, ['body', 'results'])
      const error = getError(results)
      if (error) {
        throw error
      }
      assert.equal(1, get(results, [0, 'rows_affected']))
    })
    it(`should call ${HOST}${PATH_QUERY} and select a record with the name justin`, async () => {
      const sql = 'SELECT name FROM foo WHERE name="justin"'
      const res = await dataApiClient.select(sql)
      const results = get(res, ['body', 'results'])
      const error = getError(results)
      if (error) {
        throw error
      }
      assert.equal('justin', get(results, [0, 'values', 0]))
    })
    it(`should call ${HOST}${PATH_EXECUTE} and delete a record with the name justin`, async () => {
      const sql = 'DELETE FROM foo WHERE name="justin"'
      const res = await dataApiClient.delete(sql)
      const results = get(res, ['body', 'results'])
      const error = getError(results)
      if (error) {
        throw error
      }
      assert.equal(1, get(results, [0, 'rows_affected']))
    })
    it(`should call ${HOST}${PATH_QUERY} and select a count of foo item that has a result of zero`, async () => {
      const sql = 'SELECT COUNT(id) AS idCount FROM foo'
      const res = await dataApiClient.select(sql)
      const results = get(res, ['body', 'results'])
      const error = getError(results)
      if (error) {
        throw error
      }
      assert.equal(0, get(results, [0, 'values', 0]))
    })
    it(`should call ${HOST}${PATH_EXECUTE} and insert a record with the name fiona and justin using a transaction`, async () => {
      const sql = [
        'INSERT INTO foo(name) VALUES("fiona")',
        'INSERT INTO foo(name) VALUES("justin")',
      ]
      const res = await dataApiClient.insert(sql, { transaction: true })
      const results = get(res, ['body', 'results'])
      const error = getError(results)
      if (error) {
        throw error
      }
      assert.equal(1, get(results, [0, 'rows_affected']))
      assert.equal(1, get(results, [0, 'last_insert_id']))
    })
    it(`should call ${HOST}${PATH_QUERY} and select a count of foo items that has a result of two`, async () => {
      const sql = 'SELECT COUNT(id) AS idCount FROM foo WHERE name IN("fiona", "justin")'
      const res = await dataApiClient.select(sql)
      const results = get(res, ['body', 'results'])
      const error = getError(results)
      if (error) {
        throw error
      }
      assert.equal(2, get(results, [0, 'values', 0]))
    })
    it(`should call ${HOST}${PATH_QUERY} and select an array of records with the name fiona then justin`, async () => {
      const sql = [
        'SELECT name FROM foo WHERE name="fiona"',
        'SELECT name FROM foo WHERE name="justin"',
      ]
      const res = await dataApiClient.select(sql)
      const results = get(res, ['body', 'results'])
      const error = getError(results)
      if (error) {
        throw error
      }
      assert.equal('fiona', get(results, [0, 'values', 0]))
      assert.equal('justin', get(results, [1, 'values', 0]))
    })
    it(`should call ${HOST}${PATH_EXECUTE} and drop the table foo`, async () => {
      const sql = 'DROP TABLE foo'
      const res = await dataApiClient.table.dropTable(sql)
      const results = get(res, ['body', 'results'])
      const error = getError(results)
      if (error) {
        throw error
      }
      assert.equal(1, get(results, [0, 'rows_affected']))
    })
  })
})
