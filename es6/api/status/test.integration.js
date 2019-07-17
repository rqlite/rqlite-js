import { assert } from 'chai'
import { getUrl, checkRqliteServerReady } from '../../test/integrations'
import StatusApiClient, { PATH_STATUS } from '.'

const HOST = getUrl()

describe('api status client', () => {
  const statusApiClient = new StatusApiClient(HOST)

  before(() => checkRqliteServerReady())
  describe('should get status response', () => {
    it(`should call ${HOST}${PATH_STATUS} and create table named foo`, async () => {
      const sql = 'CREATE TABLE foo (id integer not null primary key, name text)'
      const { body } = await statusApiClient.status(sql)
      assert.isObject(body, 'response body is object')
      assert.property(body, 'build')
      assert.property(body, 'http')
      assert.property(body, 'last_backup')
      assert.property(body, 'node')
      assert.property(body, 'runtime')
      assert.property(body, 'store')
    })
  })
})
