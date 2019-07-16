import { assert } from 'chai'
import { getUrl } from '../../test/integrations'
import DataApiClient, { PATH_EXECUTE, PATH_QUERY } from '.'

const HOST = getUrl()

describe('api data client', () => {
  const dataApiClient = new DataApiClient(HOST)
  async function cleanUp () {
    await dataApiClient.dropTable('DROP TABLE IF EXISTS foo')
  }
  before(cleanUp)
  after(cleanUp)
  describe('create table', () => {
    it(`should call ${HOST}${PATH_EXECUTE} and create table named foo`, async () => {
      const sql = 'CREATE TABLE foo (id integer not null primary key, name text)'
      const dataResults = await dataApiClient.createTable(sql)
      assert.isUndefined(dataResults.getFirstError(), 'error')
      const results = dataResults.getResults()
      assert.lengthOf(results, 1)
    })
  })
  describe('insert one row', () => {
    it(`should call ${HOST}${PATH_EXECUTE} and insert a record with the name fiona`, async () => {
      const sql = 'INSERT INTO foo(name) VALUES("fiona")'
      const dataResults = await dataApiClient.insert(sql)
      assert.isUndefined(dataResults.getFirstError(), 'error')
      const dataResult = dataResults.get(0)
      assert.isDefined(dataResult, 'dataResult')
      assert.equal(dataResult.getRowsAffected(), 1, 'row_affected')
      assert.equal(dataResult.getLastInsertId(), 1, 'last_insert_id')
    })
    it(`should call ${HOST}${PATH_QUERY} and select a record with the name fiona`, async () => {
      const sql = 'SELECT name FROM foo WHERE name="fiona"'
      const dataResults = await dataApiClient.select(sql)
      assert.isUndefined(dataResults.getFirstError(), 'error')
      const dataResult = dataResults.get(0)
      assert.isDefined(dataResult, 'dataResult')
      assert.equal(dataResult.get('name'), 'fiona', 'name')
    })
  })
  describe('update one row', () => {
    it(`should call ${HOST}${PATH_EXECUTE} and update the record with the name fiona to the name justin`, async () => {
      const sql = 'UPDATE foo SET name="justin" WHERE name="fiona"'
      const dataResults = await dataApiClient.update(sql)
      assert.isUndefined(dataResults.getFirstError(), 'error')
      const dataResult = dataResults.get(0)
      assert.isDefined(dataResult, 'dataResult')
      assert.equal(dataResult.getRowsAffected(), 1, 'row_affected')
    })
    it(`should call ${HOST}${PATH_QUERY} and select a record with the name justin`, async () => {
      const sql = 'SELECT name FROM foo WHERE name="justin"'
      const dataResults = await dataApiClient.select(sql)
      assert.isUndefined(dataResults.getFirstError(), 'error')
      const dataResult = dataResults.get(0)
      assert.isDefined(dataResult, 'dataResult')
      assert.equal(dataResult.get('name'), 'justin', 'name')
    })
  })
  describe('delete one row', () => {
    it(`should call ${HOST}${PATH_EXECUTE} and delete a record with the name justin`, async () => {
      const sql = 'DELETE FROM foo WHERE name="justin"'
      const dataResults = await dataApiClient.delete(sql)
      assert.isUndefined(dataResults.getFirstError(), 'error')
      const dataResult = dataResults.get(0)
      assert.isDefined(dataResult, 'dataResult')
      assert.equal(dataResult.getRowsAffected(), 1, 'row_affected')
    })
    it(`should call ${HOST}${PATH_QUERY} and select a count of foo item that has a result of zero`, async () => {
      const sql = 'SELECT COUNT(id) AS idCount FROM foo'
      const dataResults = await dataApiClient.select(sql)
      assert.isUndefined(dataResults.getFirstError(), 'error')
      const dataResult = dataResults.get(0)
      assert.isDefined(dataResult, 'dataResult')
      assert.equal(dataResult.get('idCount'), 0, 'idCount')
    })
  })
  describe('insert multiple rows', () => {
    it(`should call ${HOST}${PATH_EXECUTE} and insert a record with the name fiona and justin using a transaction`, async () => {
      const sql = [
        'INSERT INTO foo(name) VALUES("fiona")',
        'INSERT INTO foo(name) VALUES("justin")',
      ]
      const dataResults = await dataApiClient.insert(sql, { atomic: true })
      assert.isUndefined(dataResults.getFirstError(), 'error')
      const dataResult = dataResults.get(0)
      assert.isDefined(dataResult, 'dataResult')
      assert.equal(dataResult.getRowsAffected(), 1, 'row_affected')
      assert.equal(dataResult.getLastInsertId(), 1, 'last_insert_id')
    })
    it(`should call ${HOST}${PATH_QUERY} and select a count of foo items that has a result of two`, async () => {
      const sql = 'SELECT COUNT(id) AS idCount FROM foo WHERE name IN("fiona", "justin")'
      const dataResults = await dataApiClient.select(sql)
      assert.isUndefined(dataResults.getFirstError(), 'error')
      const dataResult = dataResults.get(0)
      assert.isDefined(dataResult, 'dataResult')
      assert.equal(dataResult.get('idCount'), 2, 'idCount')
    })
    it(`should call ${HOST}${PATH_QUERY} and select an array of records with the name fiona then justin`, async () => {
      const sql = [
        'SELECT name FROM foo WHERE name="fiona"',
        'SELECT name FROM foo WHERE name="justin"',
      ]
      const dataResults = await dataApiClient.select(sql)
      assert.isUndefined(dataResults.getFirstError(), 'error')
      assert.equal(dataResults.get(0).get('name'), 'fiona', 'item 0 name')
      assert.equal(dataResults.get(1).get('name'), 'justin', 'item 1 name')
    })
  })
  describe('drop the table', () => {
    it(`should call ${HOST}${PATH_EXECUTE} and drop the table foo`, async () => {
      const sql = 'DROP TABLE foo'
      const dataResults = await dataApiClient.dropTable(sql)
      assert.isUndefined(dataResults.getFirstError(), 'error')
      const dataResult = dataResults.get(0)
      assert.isDefined(dataResult, 'dataResult')
      assert.equal(dataResult.getRowsAffected(), 1, 'row_affected')
    })
  })
})
