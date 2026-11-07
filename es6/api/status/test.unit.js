import { assert } from 'chai'
import nock from 'nock'
import StatusApiClient, { PATH_STATUS } from '.'
import { HTTP_HEADER_ACCEPT } from '../../http-request/http-headers'
import { CONTENT_TYPE_APPLICATION_JSON } from '../../http-request/content-types'

const HOST1 = 'http://www.rqlite.com:4001'
const HOST2 = 'http://www.rqlite.com:4002'

const STATUS_BODY = {
  build: { version: '10.6.6' },
  http: { addr: '127.0.0.1:4001' },
  node: {},
  runtime: {},
  store: { ready: true },
}

describe('api status client', () => {
  before(() => nock.disableNetConnect())
  afterEach(() => nock.cleanAll())
  after(() => nock.enableNetConnect())

  describe('status()', () => {
    it(`should GET ${PATH_STATUS} on the leader host`, async () => {
      const scope = nock(HOST1)
        .matchHeader(HTTP_HEADER_ACCEPT, CONTENT_TYPE_APPLICATION_JSON)
        .get(PATH_STATUS)
        .reply(200, STATUS_BODY)
      const client = new StatusApiClient(`${HOST1},${HOST2}`)
      const res = await client.status()
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.equal(res.status, 200)
      assert.deepEqual(res.body, STATUS_BODY)
    })
  })

  describe('statusAllHosts()', () => {
    it('should query each host using attemptHostIndex', async () => {
      const scope1 = nock(HOST1)
        .get(PATH_STATUS)
        .reply(200, { ...STATUS_BODY, http: { addr: 'host1' } })
      const scope2 = nock(HOST2)
        .get(PATH_STATUS)
        .reply(200, { ...STATUS_BODY, http: { addr: 'host2' } })
      const client = new StatusApiClient(`${HOST1},${HOST2}`)
      const results = await client.statusAllHosts()
      assert.isTrue(scope1.isDone(), 'host1 request captured')
      assert.isTrue(scope2.isDone(), 'host2 request captured')
      assert.lengthOf(results, 2)
      assert.equal(results[0].host, HOST1)
      assert.equal(results[1].host, HOST2)
      assert.equal(results[0].response.body.http.addr, 'host1')
      assert.equal(results[1].response.body.http.addr, 'host2')
    })
  })
})
