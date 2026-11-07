import nock from 'nock'

const runningIntegrations = process.argv.some((arg) => /integration/i.test(arg))

beforeAll(() => {
  if (runningIntegrations) {
    nock.enableNetConnect()
    return
  }
  nock.disableNetConnect()
  nock.enableNetConnect('127.0.0.1')
})

beforeEach(() => {
  if (!runningIntegrations) {
    nock.cleanAll()
  }
})

afterAll(() => {
  nock.enableNetConnect()
})
