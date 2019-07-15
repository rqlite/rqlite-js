import { assert } from 'chai'
import _join from 'lodash/join'
import get from 'lodash/get'
import { getUrl } from '../../test/integrations'
import { getError } from '../results'
import DataApiClient from '../data'
import BackupApiClient, { PATH_LOAD, PATH_BACKUP } from '.'

const HOST = getUrl()
const BACKUP_SQL_STATEMENTS = [
  'CREATE TABLE foo (id integer not null primary key, name text);',
  'INSERT INTO foo(name) VALUES("fiona");',
  'INSERT INTO foo(name) VALUES("justin");',
]
const BACKUP_SQL = _join(BACKUP_SQL_STATEMENTS, '')

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
    let error
    let res
    let results
    const sql = 'CREATE TABLE fooBackups (id integer not null primary key, name text)'
    res = await dataApiClient.createTable(sql)
    results = get(res, ['body', 'results'])
    error = getError(results)
    if (error) {
      throw error
    }
    res = await dataApiClient.insert([
      'INSERT INTO fooBackups(name) VALUES("fiona")',
      'INSERT INTO fooBackups(name) VALUES("justin")',
    ], { transaction: true })
    results = get(res, ['body', 'results'])
    error = getError(results)
    if (error) {
      throw error
    }
  }

  async function checkData () {
    const res = await dataApiClient.select('SELECT id, name FROM foo WHERE name="fiona"')
    const results = get(res, ['body', 'results'])
    const error = getError(results)
    if (error) {
      throw error
    }
    assert.deepEqual([1, 'fiona'], get(results, [0, 'values', 0]))
  }

  beforeEach(cleanUp)
  after(cleanUp)
  describe('Function: connect()', () => {
    it(`should call ${HOST}${PATH_BACKUP} and get a backup string`, async () => {
      before(createData)
      const request = await backupApiClient.backup()
      const data = await handleRequestSteamAsPromise(request)
      const backupText = data.toString('utf8')
      assert.isString(backupText)
    })
    it(`should call ${HOST}${PATH_LOAD} and send a SQLite backup string`, async () => {
      const request = await backupApiClient.load(BACKUP_SQL)
      const results = JSON.parse(await handleRequestSteamAsPromise(request))
      const error = getError(get(results, 'results'))
      if (error) {
        throw error
      }
      await checkData()
    })
  })
})
