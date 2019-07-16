import { assert } from 'chai'
import { DataResult, DataResultError, DataResults } from '.'

describe('api data results', () => {
  describe('DataResultError', () => {
    it('should create a plain object', () => {
      const message = 'test'
      const dataResultError = new DataResultError(message)
      assert.deepEqual(dataResultError.toObject(), { error: message })
    })
  })
  describe('DataResult', () => {
    it('should throw an error when a result argument is missing', () => {
      assert.throws(() => new DataResult(), 'The result argument is required to be an object')
    })
    it('should throw an error when a valuesIndex argument is provided a letter', () => {
      assert.throws(() => new DataResult({}, 'a'), 'The valuesIndex argument is required to be a a finite number when provided')
    })
    it('should create a plain object', () => {
      const result = {
        columns: ['id', 'name'],
        types: ['integer', 'text'],
        values: [
          [1, 'fiona'],
          [2, 'justin'],
        ],
        time: 0.0150043,
      }
      const dataResult = new DataResult(result, 0)
      assert.deepEqual(dataResult.toObject(), { id: 1, name: 'fiona' })
    })
    it('should create a an array of values', () => {
      const result = {
        columns: ['id', 'name'],
        types: ['integer', 'text'],
        values: [
          [1, 'fiona'],
          [2, 'justin'],
        ],
        time: 0.0150043,
      }
      const dataResult = new DataResult(result, 0)
      assert.deepEqual(dataResult.toArray(), [1, 'fiona'])
    })
    it('should create a an array of columns', () => {
      const result = {
        columns: ['id', 'name'],
        types: ['integer', 'text'],
        values: [
          [1, 'fiona'],
          [2, 'justin'],
        ],
        time: 0.0150043,
      }
      const dataResult = new DataResult(result, 0)
      assert.deepEqual(dataResult.toColumnsArray(), ['id', 'name'])
    })
    it('should get the time', () => {
      const time = 0.123424324
      const result = {
        columns: ['id', 'name'],
        types: ['integer', 'text'],
        values: [
          [1, 'fiona'],
          [2, 'justin'],
        ],
        time,
      }
      const dataResult = new DataResult(result, 0)
      assert.equal(dataResult.getTime(), time)
    })
  })
  describe('DataResults', () => {
    it('should throw an error when a data argument is not provided to the constructor', () => {
      assert.throws(() => new DataResults(), 'The data argument is required to be an object')
    })
    it('should create a list of data results and get the time', () => {
      const time = 0.8234
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
      const dataResults = new DataResults({ results, time })
      const expected = [
        { id: 1, name: 'fiona' },
        { id: 2, name: 'justin' },
        { id: 5, name: 'bob' },
        { id: 10, name: 'sally' },
      ]
      assert.deepEqual(dataResults.toArray(), expected)
      assert.equal(dataResults.getTime(), time)
    })
    it('should create a list of data result errors', () => {
      const results = [
        { error: 'Test error 1' },
        { error: 'Test error 2' },
      ]
      const dataResults = new DataResults({ results })
      const expected = [
        { error: 'Test error 1' },
        { error: 'Test error 2' },
      ]
      assert.deepEqual(dataResults.toArray(), expected)
    })
    it('should create a list of data results and errors', () => {
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
        { error: 'Test error 2' },
      ]
      const dataResults = new DataResults({ results })
      const expected = [
        { id: 1, name: 'fiona' },
        { id: 2, name: 'justin' },
        { error: 'Test error 2' },
      ]
      assert.deepEqual(dataResults.toArray(), expected)
    })
  })
})
