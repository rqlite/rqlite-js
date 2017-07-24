import {describe, it} from 'mocha'
import {assert} from 'chai'
import nock from 'nock'
import query, {PATH} from './index'
import {CONTENT_TYPE_APPLICATION_JSON} from '../../../http/content-types'
import {querySuccess, QUERY_SUCCESS_RESPONSE} from '../../../test/api-data-query-nock'

const URL = 'http://www.rqlite.com:4001'

describe('api data query', function () {
  beforeEach(nock.cleanAll)
  describe('Function: query()', function () {
    it(`should call the ${URL}${PATH} endpoint with a query using HTTP GET`, function (done) {
      const sql = 'SELECT * FROM foo'
      const apiQuery = {
        q: sql
      }
      const scope = querySuccess({url: URL, path: PATH})
      query(URL, sql)
        .then((res) => {
          assert.isTrue(scope.isDone(), 'http request captured by nock')
          assert.deepEqual(apiQuery, res.request.qs)
          assert.deepEqual(QUERY_SUCCESS_RESPONSE, res.body)
          done()
        })
        .catch(done)
    })
  })
})