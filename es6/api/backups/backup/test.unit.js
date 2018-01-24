import {describe, it} from 'mocha'
import {assert} from 'chai'
import nock from 'nock'
import backup, {PATH} from './index'
import {backupSuccess, BACKUP_SUCCESS_RESPONSE} from '../../../test/backups/backup-nock'

const URL = 'http://www.rqlite.com:4001'

describe('api backups backup', () => {
  beforeEach(nock.cleanAll)
  describe('Function: backup()', () => {
    it(`should call the ${URL}${PATH} endpoint using HTTP GET`, (done) => {
      const scope = backupSuccess({url: URL, path: PATH})
      backup(URL)
        .then((res) => {
          assert.isTrue(scope.isDone(), 'http request captured by nock')
          assert.equal(BACKUP_SUCCESS_RESPONSE, res.body.toString('utf8'))
          done()
        })
        .catch(done)
    })
  })
})
