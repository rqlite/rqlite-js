import {describe, it} from 'mocha'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import nock from 'nock'
import connect from './index'
import {CONTENT_TYPE_TEXT_PLAIN, CONTENT_TYPE_APPLICATION_JSON} from '../../../http/content-types'
import {PATH as PATH_BACKUP} from '../backup'
import {PATH as PATH_RESTORE} from '../restore'
import {backupSuccess, BACKUP_SUCCESS_RESPONSE} from '../../../test/backups/backup-nock'
import {restoreSuccess, RESTORE_SUCCESS_RESPONSE} from '../../../test/backups/restore-nock'

chai.use(chaiAsPromised)
const {assert} = chai

const URL = 'http://www.rqlite.com:4001'

describe('api backups client', () => {
  before(() => nock.disableNetConnect())
  beforeEach(() => nock.cleanAll())
  after(() => nock.enableNetConnect())
  describe('Function: connect()', () => {
    it(`should call the ${URL}${PATH_BACKUP} endpoint using HTTP GET when performing a backup`, async () => {
      const api = await assert.isFulfilled(connect(URL))
      const scope = backupSuccess({url: URL, path: PATH_BACKUP})
      const res = await assert.isFulfilled(api.backup())
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.equal(BACKUP_SUCCESS_RESPONSE, res.body.toString('utf8'))
    })
    it(`should call the ${URL}${PATH_RESTORE} endpoint with a request body using HTTP POST when performing a restore`, async () => {
      const api = await assert.isFulfilled(connect(URL))
      const scope = restoreSuccess({url: URL, path: PATH_RESTORE})
      const res = await assert.isFulfilled(api.restore({httpOptions: {body: BACKUP_SUCCESS_RESPONSE}}))
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.equal(BACKUP_SUCCESS_RESPONSE, res.request._data)
      assert.deepEqual(RESTORE_SUCCESS_RESPONSE, res.body)
    })
  })
})
