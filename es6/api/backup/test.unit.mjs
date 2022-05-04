import { assert } from 'chai'
import { backupSuccess, BACKUP_SUCCESS_RESPONSE } from '../../test/backups/backup-nock.mjs'
import { restoreSuccess, RESTORE_SUCCESS_RESPONSE } from '../../test/backups/restore-nock.mjs'
import BackupApiClient, { PATH_BACKUP, PATH_LOAD } from './index.mjs'

const HOST = 'http://www.rqlite.com:4001'

/**
 * Capture the stream data and resolve a promise with the parsed JSON
 */
function handleRequestStreamAsPromise (request) {
  return new Promise((resolve, reject) => {
    let result = Buffer.from('')
    request
      .on('data', (data) => {
        result = Buffer.concat([result, data])
      })
      .on('end', () => resolve(result))
      .on('error', reject)
  })
}

describe('api backup', () => {
  describe('backupApiClient.backup()', () => {
    it(`should call ${HOST}${PATH_BACKUP} endpoint using HTTP GET`, async () => {
      const backupApiClient = new BackupApiClient(HOST)
      const scope = backupSuccess({ url: HOST, path: PATH_BACKUP })
      const request = await backupApiClient.backup()
      const result = await handleRequestStreamAsPromise(request)
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.equal(result, BACKUP_SUCCESS_RESPONSE)
    })
  })
  describe('backupApiClient.load()', () => {
    it(`should call ${HOST}${PATH_LOAD} endpoint using HTTP POST`, async () => {
      const backupApiClient = new BackupApiClient(HOST)
      const scope = restoreSuccess({ url: HOST, path: PATH_LOAD, body: BACKUP_SUCCESS_RESPONSE })
      const request = await backupApiClient.load(BACKUP_SUCCESS_RESPONSE)
      const result = await handleRequestStreamAsPromise(request)
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(JSON.parse(result.toString()), RESTORE_SUCCESS_RESPONSE)
    })
  })
})
