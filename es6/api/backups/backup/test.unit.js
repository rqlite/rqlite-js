import { describe, it } from 'mocha'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import nock from 'nock'
import backup, { PATH } from './index'
import { backupSuccess, BACKUP_SUCCESS_RESPONSE } from '../../../test/backups/backup-nock'

chai.use(chaiAsPromised)
const { assert } = chai

const URL = 'http://www.rqlite.com:4001'

describe('api backups backup', () => {
  before(() => nock.disableNetConnect())
  beforeEach(() => nock.cleanAll())
  after(() => nock.enableNetConnect())
  describe('Function: backup()', () => {
    it(`should call ${URL}${PATH} endpoint using HTTP GET`, async () => {
      const scope = backupSuccess({ url: URL, path: PATH })
      const res = await assert.isFulfilled(backup(URL))
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.equal(BACKUP_SUCCESS_RESPONSE, res.body.toString('utf8'))
    })
  })
})
