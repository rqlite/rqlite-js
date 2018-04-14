import {describe, it} from 'mocha'
import {assert} from 'chai'
import nock from 'nock'
import execute, {PATH} from './index'
import {CONTENT_TYPE_APPLICATION_JSON} from '../../../http/content-types'
import {executeSuccess, EXECUTE_SUCCESS_RESPONSE} from '../../../test/api-data-execute-nock'

const URL = 'http://www.rqlite.com:4001'

describe('api data execute', () => {
  beforeEach(() => nock.cleanAll())
  describe('Function: execute()', () => {
    it(`should call the ${URL}${PATH} endpoint with a query using HTTP POST`, (done) => {
      const sql = 'INSERT INTO foo(name) VALUES(\"fiona\")'
      const scope = executeSuccess({url: URL, path: PATH})
      execute(URL, sql)
        .then((res) => {
          assert.isTrue(scope.isDone(), 'http request captured by nock')
          assert.deepEqual([sql], res.request._data)
          assert.deepEqual(EXECUTE_SUCCESS_RESPONSE, res.body)
          done()
        })
        .catch(done)
    })
  })
})
