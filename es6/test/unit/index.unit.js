/**
 * Bootstrap for unit tests
 * @module test/unit
 */
import nock from 'nock'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

/**
 * Disable external network connections except to localhost before all tests
 */
before(() => {
  chai.use(chaiAsPromised)
  nock.disableNetConnect()
  nock.enableNetConnect('127.0.0.1')
})

/**
 * Destory all nocks before each test
 */
beforeEach(() => nock.cleanAll())

/**
 * Enable network connection after all tests
 */
after(() => nock.enableNetConnect())
