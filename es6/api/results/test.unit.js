import {describe, it} from 'mocha'
import {assert} from 'chai'
import {
  getError,
  toPlainJs,
} from './index'

describe('api data results', () => {
  describe('Function: getError()', () => {
    it('should get an error from an data API results set', () => {
      const error = 'near "nonsense": syntax error'
      const errorResult = {error}
      const results = [errorResult]
      assert.equal(error, getError(results).message)
    })
  })
  describe('Function: toPlainJs()', () => {
    it('should create a plain js array containing key value object pairs', () => {
      const results = [
        {
          columns: ['id', 'name'],
          types: ['integer', 'text'],
          values: [
            [1, 'fiona'],
          ],
          time: 0.0150043,
        },
      ]
      const plainJs = [
        {
          id: 1,
          name: 'fiona',
        },
      ]
      assert.deepEqual(plainJs, toPlainJs(results))
    })
  })
})
