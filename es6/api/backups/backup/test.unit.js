import { assert } from 'chai'
import backup, { PATH } from './index'
import { backupSuccess, BACKUP_SUCCESS_RESPONSE } from '../../../test/backups/backup-nock'

const URL = 'http://www.rqlite.com:4001'

describe('api backups backup', () => {
  describe('Function: backup()', () => {
    it(`should call ${URL}${PATH} endpoint using HTTP GET`, async () => {
      const scope = backupSuccess({ url: URL, path: PATH })
      const res = await assert.isFulfilled(backup(URL))
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.equal(BACKUP_SUCCESS_RESPONSE, res.body.toString('utf8'))
    })
  })
})
