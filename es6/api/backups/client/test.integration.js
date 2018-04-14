import {describe, it} from 'mocha'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import _join from 'lodash/join'
import _get from 'lodash/get'
import connect from './index'
import connectData from '../../data/client'
import {getUrl} from '../../../test/integrations'
import {getError} from '../../results'
import {PATH as PATH_BACKUP} from '../backup'
import {PATH as PATH_RESTORE} from '../restore'

chai.use(chaiAsPromised)
const {assert} = chai
const URL = getUrl()
const BACKUP_SQL_STATEMENTS = [
  'CREATE TABLE foo (id integer not null primary key, name text);',
  'INSERT INTO foo(name) VALUES("fiona");',
  'INSERT INTO foo(name) VALUES("justin");',
]
const BACKUP_SQL = _join(BACKUP_SQL_STATEMENTS, '')

async function cleanUp() {
  const api = await connectData(getUrl())
  await api.table.drop('DROP TABLE IF EXISTS fooBackups')
}

async function createData() {
  let error
  let res
  let results
  const api = await connectData(getUrl())
  const sql = 'CREATE TABLE fooBackups (id integer not null primary key, name text)'
  res = await api.table.create(sql)
  results = _get(res, ['body', 'results'])
  error = getError(results)
  if (error) {
    throw error
  }
  res = await api.insert([
    'INSERT INTO fooBackups(name) VALUES("fiona")',
    'INSERT INTO fooBackups(name) VALUES("justin")',
  ], {transaction: true})
  results = _get(res, ['body', 'results'])
  error = getError(results)
  if (error) {
    throw error
  }
}

async function checkData() {
  const api = await connectData(URL)
  const res = await api.select('SELECT id, name FROM foo WHERE name="fiona"')
  const results = _get(res, ['body', 'results'])
  const error = getError(results)
  if (error) {
    throw error
  }
  assert.deepEqual([1, 'fiona'], _get(results, [0, 'values', 0]))
}

describe('api backups client', () => {
  beforeEach(cleanUp)
  after(cleanUp)
  describe('Function: connect()', () => {
    it(`should call ${URL}${PATH_BACKUP} and get a backup string`, async () => {
      before(createData)
      const api = await connect(URL)
      const res = await assert.isFulfilled(api.backup())
      const backupText = res.body.toString('utf8')
      assert.isString(backupText)
    })
    it(`should call ${URL}${PATH_RESTORE} and send a SQLite backup string`, async () => {
      const api = await connect(URL)
      const res = await assert.isFulfilled(api.restore({httpOptions: {body: BACKUP_SQL}}))
      const results = _get(res, ['body', 'results'])
      const error = getError(results)
      if (error) {
        throw error
      }
      await checkData()
    })
  })
})
