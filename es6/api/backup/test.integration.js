import { assert } from 'chai'
import join from 'lodash/join'
import get from 'lodash/get'
import { getUrl, checkRqliteServerReady } from '../../test/integrations'
import DataApiClient from '../data'
import BackupApiClient, { PATH_LOAD, PATH_BACKUP } from '.'

const HOST = getUrl()
const BACKUP_SQL_STATEMENTS = [
  'CREATE TABLE foo (id integer not null primary key, name text);',
  'INSERT INTO foo(name) VALUES("fiona");',
  'INSERT INTO foo(name) VALUES("justin");',
]
const BACKUP_SQL = join(BACKUP_SQL_STATEMENTS, '')

/**
 * Capture the stream data and resolve a promise with the parsed JSON
 */
function handleRequestSteamAsPromise (request) {
  return new Promise(async (resolve, reject) => {
    let result = Buffer.from('')
    request
      .on('data', (data) => {
        result = Buffer.concat([result, data])
      })
      .on('end', () => resolve(result))
      .on('error', reject)
  })
}

describe('api backups client', () => {
  const backupApiClient = new BackupApiClient(HOST)
  const dataApiClient = new DataApiClient(HOST)

  async function cleanUp () {
    await dataApiClient.dropTable('DROP TABLE IF EXISTS fooBackups')
  }

  async function createData () {
    const sql = 'CREATE TABLE fooBackups (id integer not null primary key, name text)'
    let dataResults = await dataApiClient.createTable(sql)
    assert.isUndefined(dataResults.getFirstError(), 'error')
    dataResults = await dataApiClient.insert([
      'INSERT INTO fooBackups(name) VALUES("fiona")',
      'INSERT INTO fooBackups(name) VALUES("justin")',
    ], { transaction: true })
    assert.isUndefined(dataResults.getFirstError(), 'error')
  }

  async function checkData () {
    const dataResults = await dataApiClient.select('SELECT id, name FROM foo WHERE name="fiona"')
    const error = dataResults.getFirstError()
    if (error) {
      throw error
    }
    const dataResult = dataResults.get(0)
    assert.isDefined(dataResult, 'dataResult')
    assert.deepEqual(dataResult.get('id'), 1, 'id')
    assert.deepEqual(dataResult.get('name'), 'fiona', 'name')
  }

  before(() => checkRqliteServerReady())
  beforeEach(cleanUp)
  after(cleanUp)
  describe('backup database', () => {
    it(`should call ${HOST}${PATH_BACKUP} and get a backup string`, async () => {
      before(createData)
      const request = await backupApiClient.backup()
      const data = await handleRequestSteamAsPromise(request)
      const backupText = data.toString('utf8')
      assert.isString(backupText)
    })
  })
  describe('restore database', () => {
    it(`should call ${HOST}${PATH_LOAD} and send a SQLite backup string`, async () => {
      const request = await backupApiClient.load(BACKUP_SQL)
      let results = JSON.parse(await handleRequestSteamAsPromise(request))
      results = get(results, 'results')
      assert.notNestedPropertyVal(results, '0.error', 'has an error')
      await checkData()
    })
  })
})
