import { describe, it } from 'mocha'
import { assert } from 'chai'
import {
  getError,
  toPlainJs,
} from './index'

describe('api data results', () => {
  describe('Function: getError()', () => {
    it('should get an error from an data API results set', () => {
      const error = 'near "nonsense": syntax error'
      const errorResult = { error }
      const results = [errorResult]
      assert.equal(error, getError(results).message)
    })
  })
  describe('Function: toPlainJs()', () => {
    it('should create a plain js array containing name value objects', () => {
      const results = [
        {
          columns: ['id', 'name'],
          types: ['integer', 'text'],
          values: [
            [1, 'fiona'],
            [2, 'justin'],
          ],
          time: 0.0150043,
        },
        {
          columns: ['id', 'name'],
          types: ['integer', 'text'],
          values: [
            [5, 'bob'],
            [10, 'sally'],
          ],
          time: 0.0150043,
        },
      ]
      const plainJs = [
        { id: 1, name: 'fiona' },
        { id: 2, name: 'justin' },
        { id: 5, name: 'bob' },
        { id: 10, name: 'sally' },
      ]
      assert.deepEqual(plainJs, toPlainJs(results))
    })
    it('should create a plain js array containing an array of object with name value objects', () => {
      const results = [
        {
          columns: ['id', 'name'],
          types: ['integer', 'text'],
          values: [
            [1, 'fiona'],
            [2, 'justin'],
          ],
          time: 0.0150043,
        },
        {
          columns: ['id', 'name'],
          types: ['integer', 'text'],
          values: [
            [5, 'bob'],
            [10, 'sally'],
          ],
          time: 0.0150043,
        },
      ]
      const plainJs = [
        [
          { id: 1, name: 'fiona' },
          { id: 2, name: 'justin' },
        ],
        [
          { id: 5, name: 'bob' },
          { id: 10, name: 'sally' },
        ],
      ]
      assert.deepEqual(plainJs, toPlainJs(results, { valuesAsArrays: true }))
    })
  })
})
