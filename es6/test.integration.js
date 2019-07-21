import { assert } from 'chai'
import { PATH_EXECUTE, PATH_QUERY } from './api/data'
import { PATH_LOAD, PATH_BACKUP } from './api/backup'
import { PATH_STATUS } from './api/status'
// eslint-disable-next-line import/named
import { DataApiClient, BackupApiClient, StatusApiClient } from '.'

/**
 * The RQLite host for integration tests, which can be changed
 * using the RQLITE_URL environment variable or defaults to
 * http://localhost:4001
 * @type {String} The RQLite host address
 */
const HOST = process.env.RQLITE_HOSTS || 'http://localhost:4001'

describe('api status client', () => {
  const statusApiClient = new StatusApiClient(HOST)
  /**
   * Before beginning test check the status endpoint for a response from
   * RQLite server
   * @param {Number} attempt The current attempt
   * @param {Number} wait The amount of time to wait
   * @param {Number} maxAttempts The maximum number of attempts before
   * throw the current error
   */
  async function checkRqliteServerReady (attempt = 0, wait = 500, maxAttempts = 10) {
    try {
      return await statusApiClient.statusAllHosts()
    } catch (e) {
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, wait))
        return checkRqliteServerReady(attempt + 1)
      }
      throw e
    }
  }

  before(() => checkRqliteServerReady())
  describe('should get status response', () => {
    it(`should call ${HOST}${PATH_STATUS} and create table named foo`, async () => {
      const sql = 'CREATE TABLE foo (id integer not null primary key, name text)'
      const { body } = await statusApiClient.status(sql)
      assert.isObject(body, 'response body is object')
      assert.property(body, 'build')
      assert.property(body, 'http')
      // assert.property(body, 'last_backup')
      assert.property(body, 'node')
      assert.property(body, 'runtime')
      assert.property(body, 'store')
    })
  })
})

describe('api data client', () => {
  const dataApiClient = new DataApiClient(HOST)
  // eslint-disable-next-line prefer-arrow-callback
  after(async function cleanUpApiDataClientTests () {
    await dataApiClient.execute('DROP TABLE IF EXISTS foo')
  })
  describe('create table', () => {
    it(`should call ${HOST}${PATH_EXECUTE} and create table named foo`, async () => {
      const sql = 'CREATE TABLE foo (id integer not null primary key, name text)'
      const dataResults = await dataApiClient.execute(sql)
      assert.isUndefined(dataResults.getFirstError(), 'error')
      const results = dataResults.getResults()
      assert.lengthOf(results, 1)
    })
  })
  describe('insert one row', () => {
    it(`should call ${HOST}${PATH_EXECUTE} and insert a record with the name fiona`, async () => {
      const sql = 'INSERT INTO foo(name) VALUES("fiona")'
      const dataResults = await dataApiClient.execute(sql)
      assert.isUndefined(dataResults.getFirstError(), 'error')
      const dataResult = dataResults.get(0)
      assert.isDefined(dataResult, 'dataResult')
      assert.equal(dataResult.getRowsAffected(), 1, 'row_affected')
      assert.equal(dataResult.getLastInsertId(), 1, 'last_insert_id')
    })
    it(`should call ${HOST}${PATH_QUERY} and select a record with the name fiona`, async () => {
      const sql = 'SELECT name FROM foo WHERE name="fiona"'
      const dataResults = await dataApiClient.query(sql)
      assert.isUndefined(dataResults.getFirstError(), 'error')
      const dataResult = dataResults.get(0)
      assert.isDefined(dataResult, 'dataResult')
      assert.equal(dataResult.get('name'), 'fiona', 'name')
    })
  })
  describe('update one row', () => {
    it(`should call ${HOST}${PATH_EXECUTE} and update the record with the name fiona to the name justin`, async () => {
      const sql = 'UPDATE foo SET name="justin" WHERE name="fiona"'
      const dataResults = await dataApiClient.execute(sql)
      assert.isUndefined(dataResults.getFirstError(), 'error')
      const dataResult = dataResults.get(0)
      assert.isDefined(dataResult, 'dataResult')
      assert.equal(dataResult.getRowsAffected(), 1, 'row_affected')
    })
    it(`should call ${HOST}${PATH_QUERY} and select a record with the name justin`, async () => {
      const sql = 'SELECT name FROM foo WHERE name="justin"'
      const dataResults = await dataApiClient.query(sql)
      assert.isUndefined(dataResults.getFirstError(), 'error')
      const dataResult = dataResults.get(0)
      assert.isDefined(dataResult, 'dataResult')
      assert.equal(dataResult.get('name'), 'justin', 'name')
    })
  })
  describe('delete one row', () => {
    it(`should call ${HOST}${PATH_EXECUTE} and delete a record with the name justin`, async () => {
      const sql = 'DELETE FROM foo WHERE name="justin"'
      const dataResults = await dataApiClient.execute(sql)
      assert.isUndefined(dataResults.getFirstError(), 'error')
      const dataResult = dataResults.get(0)
      assert.isDefined(dataResult, 'dataResult')
      assert.equal(dataResult.getRowsAffected(), 1, 'row_affected')
    })
    it(`should call ${HOST}${PATH_QUERY} and select a count of foo item that has a result of zero`, async () => {
      const sql = 'SELECT COUNT(id) AS idCount FROM foo'
      const dataResults = await dataApiClient.query(sql)
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
      const dataResults = await dataApiClient.execute(sql, { transaction: true })
      assert.isUndefined(dataResults.getFirstError(), 'error')
      const dataResult = dataResults.get(0)
      assert.isDefined(dataResult, 'dataResult')
      assert.equal(dataResult.getRowsAffected(), 1, 'row_affected')
      assert.equal(dataResult.getLastInsertId(), 1, 'last_insert_id')
    })
    it(`should call ${HOST}${PATH_QUERY} and select a count of foo items that has a result of two`, async () => {
      const sql = 'SELECT COUNT(id) AS idCount FROM foo WHERE name IN("fiona", "justin")'
      const dataResults = await dataApiClient.query(sql)
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
      const dataResults = await dataApiClient.query(sql)
      assert.isUndefined(dataResults.getFirstError(), 'error')
      assert.equal(dataResults.get(0).get('name'), 'fiona', 'item 0 name')
      assert.equal(dataResults.get(1).get('name'), 'justin', 'item 1 name')
    })
  })
  describe('drop the table', () => {
    it(`should call ${HOST}${PATH_EXECUTE} and drop the table foo`, async () => {
      const sql = 'DROP TABLE foo'
      const dataResults = await dataApiClient.execute(sql)
      assert.isUndefined(dataResults.getFirstError(), 'error')
      const dataResult = dataResults.get(0)
      assert.isDefined(dataResult, 'dataResult')
      assert.equal(dataResult.getRowsAffected(), 1, 'row_affected')
    })
  })
})

describe('api backups client', () => {
  const backupApiClient = new BackupApiClient(HOST)
  const dataApiClient = new DataApiClient(HOST)
  /**
   * Capture the stream data and resolve a promise with the parsed JSON
   * @returns {Stream} The stream
   */
  function handleRequestSteamAsPromise (request) {
    return new Promise(async (resolve, reject) => {
      let result = Buffer.alloc(0)
      request
        .on('data', (data) => {
          result = Buffer.concat([result, data])
        })
        .on('end', () => resolve(result))
        .on('error', reject)
    })
  }

  // eslint-disable-next-line prefer-arrow-callback
  after(async function cleanUpApiBackupTests () {
    await dataApiClient.execute('DROP TABLE IF EXISTS fooBackups')
    await dataApiClient.execute('DROP TABLE IF EXISTS fooRestore')
  })
  describe('backup database', () => {
    it(`should call ${HOST}${PATH_BACKUP} and get a SQL backup string`, async () => {
      const sql = 'CREATE TABLE fooBackups (id integer not null primary key, name text)'
      let dataResults = await dataApiClient.execute(sql)
      assert.isUndefined(dataResults.getFirstError(), 'error')
      dataResults = await dataApiClient.execute([
        'INSERT INTO fooBackups(name) VALUES("fiona")',
        'INSERT INTO fooBackups(name) VALUES("justin")',
      ], { transaction: true })
      assert.isUndefined(dataResults.getFirstError(), 'error')
      const request = await backupApiClient.backup()
      const stream = await handleRequestSteamAsPromise(request)
      assert.isString(stream.toString())
    })
  })
  describe('restore database', () => {
    it(`should call ${HOST}${PATH_LOAD} and send a SQLite backup stream`, async () => {
      /**
       * Individual SQL statements to create back up data
       */
      const BACKUP_SQL_STATEMENTS = [
        'CREATE TABLE fooRestore (id integer not null primary key, name text)',
        'INSERT INTO fooRestore(name) VALUES("fiona")',
        'INSERT INTO fooRestore(name) VALUES("justin")',
      ]
      const sql = Buffer.from(BACKUP_SQL_STATEMENTS.join(';'))
      const request = await backupApiClient.load(sql)
      const { results } = JSON.parse(await handleRequestSteamAsPromise(request))
      assert.notNestedProperty(results, 'results.0.error', 'has an error')
      const dataResults = await dataApiClient.query('SELECT id, name FROM fooRestore WHERE name="fiona"', { level: 'strong' })
      const error = dataResults.getFirstError()
      if (error) {
        throw error
      }
      const dataResult = dataResults.get(0)
      assert.isDefined(dataResult, 'dataResult')
      assert.deepEqual(dataResult.get('id'), 1, 'id')
      assert.deepEqual(dataResult.get('name'), 'fiona', 'name')
    })
  })
})
