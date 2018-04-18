import {describe, it} from 'mocha'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import nock from 'nock'
import restore, {PATH} from './index'
import {BACKUP_SUCCESS_RESPONSE} from '../../../test/backups/backup-nock'
import {restoreSuccess, RESTORE_SUCCESS_RESPONSE} from '../../../test/backups/restore-nock'

chai.use(chaiAsPromised)
const {assert} = chai

const URL = 'http://www.rqlite.com:4001'

describe('api backups restore', () => {
  before(() => nock.disableNetConnect())
  beforeEach(() => nock.cleanAll())
  after(() => nock.enableNetConnect())
  describe('Function: execute()', () => {
    it(`should call ${URL}${PATH} endpoint using HTTP POST`, async () => {
      const scope = restoreSuccess({url: URL, path: PATH})
      const res = await assert.isFulfilled(restore(URL, {
        httpOptions: {body: BACKUP_SUCCESS_RESPONSE},
      }))
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      // eslint-disable-next-line no-underscore-dangle
      assert.equal(BACKUP_SUCCESS_RESPONSE, res.request._data)
      assert.deepEqual(RESTORE_SUCCESS_RESPONSE, res.body)
    })
  })
})
