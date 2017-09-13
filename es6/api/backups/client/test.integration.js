import {describe, it} from 'mocha'
import {assert} from 'chai'
import _join from 'lodash/join'
import connect from './index'
import connectData from '../../data/client'
import _get from 'lodash/get'
import _size from 'lodash/size'
import {getUrl} from '../../../test/integrations'
import {getError} from '../../results'
import {PATH as PATH_BACKUP} from '../backup'
import {PATH as PATH_RESTORE} from '../restore'

const URL = getUrl()
const BACKUP_SQL_STATEMENTS = [
  'CREATE TABLE foo (id integer not null primary key, name text);',
  'INSERT INTO foo(name) VALUES(\"fiona\");',
  'INSERT INTO foo(name) VALUES(\"justin\");'
]
const BACKUP_SQL = _join(BACKUP_SQL_STATEMENTS, '')

function cleanUp (done) {
  connectData(getUrl())
    .then(function (api) {
      const sql = 'DROP TABLE IF EXISTS fooBackups'
      api.table.drop(sql)
        .then(() => done())
        .catch(done)
    })
    .catch(done)
}

function createData (done) {
  connectData(getUrl())
    .then(function (api) {
      const sql = 'CREATE TABLE fooBackups (id integer not null primary key, name text)'
      api.table.create(sql)
        .then((res) => {
          const results = _get(res, ['body', 'results'])
          const error = getError(results)
          if (error) {
            done(error)
            return
          }
          const sql = [
            'INSERT INTO fooBackups(name) VALUES(\"fiona\")',
            'INSERT INTO fooBackups(name) VALUES(\"justin\")'
          ]
          api.insert(sql, {transaction: true})
            .then((res) => {
              const results = _get(res, ['body', 'results'])
              const error = getError(results)
              if (error) {
                done(error)
                return
              }
              done()
            })
            .catch(done)
        })
        .catch(done)
    })
    .catch(done)
}

function checkData (done) {
  connectData(URL)
    .then(function (api) {
      const sql = 'SELECT id, name FROM foo WHERE name=\"fiona\"'
      api.select(sql)
        .then((res) => {
          const results = _get(res, ['body', 'results'])
          const error = getError(results)
          if (error) {
            done(error)
            return
          }
          assert.deepEqual([1, 'fiona'], _get(results, [0, 'values', 0]))
          done()
        })
        .catch(done)
    })
    .catch(done)
}

describe('api backups client', function () {
  beforeEach(cleanUp)
  after(cleanUp)
  describe('Function: connect()', function () {
    it(`should call ${URL}${PATH_BACKUP} and get a backup string`, function (done) {
      before(createData)
      connect(URL)
        .then(function (api) {
          api.backup()
            .then((res) => {
              const backupText = res.body.toString('utf8')
              assert.isString(backupText)
              done()
            })
            .catch(done)
        })
        .catch(done)
    })
    it(`should call ${URL}${PATH_RESTORE} and send a SQLite backup string`, function (done) {
      connect(URL)
        .then(function (api) {
          api.restore({httpOptions: {body: BACKUP_SQL}})
            .then((res) => {
              const results = _get(res, ['body', 'results'])
              const error = getError(results)
              if (error) {
                done(error)
                return
              }
              checkData(done)
            })
            .catch(done)
        })
        .catch(done)
    })
  })
})
