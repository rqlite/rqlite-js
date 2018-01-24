import {describe, it} from 'mocha'
import {assert} from 'chai'
import nock from 'nock'
import connect from './index'
import {CONTENT_TYPE_TEXT_PLAIN, CONTENT_TYPE_APPLICATION_JSON} from '../../../http/content-types'
import {PATH as PATH_BACKUP} from '../backup'
import {PATH as PATH_RESTORE} from '../restore'
import {backupSuccess, BACKUP_SUCCESS_RESPONSE} from '../../../test/backups/backup-nock'
import {restoreSuccess, RESTORE_SUCCESS_RESPONSE} from '../../../test/backups/restore-nock'

const URL = 'http://www.rqlite.com:4001'

describe('api backups client', () => {
  beforeEach(nock.cleanAll)
  describe('Function: connect()', () => {
    it(`should call the ${URL}${PATH_BACKUP} endpoint using HTTP GET when performing a backup`, (done) => {
      connect(URL)
        .then((api) => {
          const scope = backupSuccess({url: URL, path: PATH_BACKUP})
          api.backup()
            .then((res) => {
              assert.isTrue(scope.isDone(), 'http request captured by nock')
              assert.equal(BACKUP_SUCCESS_RESPONSE, res.body.toString('utf8'))
              done()
            })
            .catch(done)
        })
        .catch(done)
    })
    it(`should call the ${URL}${PATH_RESTORE} endpoint with a request body using HTTP POST when performing a restore`, (done) => {
      connect(URL)
        .then((api) => {
          const scope = restoreSuccess({url: URL, path: PATH_RESTORE})
          api.restore({httpOptions: {body: BACKUP_SUCCESS_RESPONSE}})
            .then((res) => {
              assert.isTrue(scope.isDone(), 'http request captured by nock')
              assert.equal(BACKUP_SUCCESS_RESPONSE, res.request._data)
              assert.deepEqual(RESTORE_SUCCESS_RESPONSE, res.body)
              done()
            })
            .catch(done)
        })
        .catch(done)
    })
  })
})
