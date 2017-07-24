import {describe, it} from 'mocha'
import {assert} from 'chai'
import {
  getError,
  toPlainJs
} from './index'

const URL = 'http://www.rqlite.com:4001'

describe('api data results', function () {
  describe('Function: getError()', function () {
    it(`should get an error from an data API results set`, function () {
      const error = 'near "nonsense": syntax error'
      const errorResult = {error}
      const results =  [errorResult]
      assert.equal(error, getError(results).message)
    })
  })
  describe('Function: toPlainJs()', function () {
    it(`should create a plain js array containing key value object pairs`, function () {
      const error = 'near "nonsense": syntax error'
      const errorResult = {error}
      const results =  [
        {
          'columns': ['id', 'name'],
          'types': ['integer','text'],
          'values': [
            [1, 'fiona']
          ],
          'time': 0.0150043
        }
      ]
      const plainJs = [
        {
          id: 1,
          name: 'fiona'
        }
      ]
      assert.deepEqual(plainJs, toPlainJs(results))
    })
  })
})