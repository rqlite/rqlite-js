import { assert } from 'chai'
import { DataResult, DataResultError, DataResults } from './index.mjs'

describe('api data results', () => {
  describe('DataResultError', () => {
    it('should create a JS object', () => {
      const message = 'test'
      const dataResultError = new DataResultError(message)
      assert.deepEqual(dataResultError.toObject(), { error: message })
    })
    it('should create a JSON object', () => {
      const message = 'test'
      const dataResultError = new DataResultError(message)
      assert.equal(dataResultError.toString(), JSON.stringify({ error: message }))
    })
    it('should have the error name and code DataResultError', () => {
      const message = 'test'
      const dataResultError = new DataResultError(message)
      assert.propertyVal(dataResultError, 'name', 'DataResultError')
      assert.propertyVal(dataResultError, 'code', 'DataResultError')
    })
  })
  describe('DataResult', () => {
    it('should throw an error when a result argument is missing', () => {
      assert.throws(() => new DataResult(), 'The result argument is required to be an object')
    })
    it('should throw an error when a valuesIndex argument is provided a letter', () => {
      assert.throws(() => new DataResult({}, 'a'), 'The valuesIndex argument is required to be a finite number when provided')
    })
    it('should create a JS object', () => {
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
    it('should create a an Array of values', () => {
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
    it('should get the last_insert_id, last insert id, and rows affected', () => {
      const time = 0.123424324
      const rowsAffected = 2
      const lastInsertId = 201
      const result = {
        columns: ['id', 'name'],
        types: ['integer', 'text'],
        values: [
          [1, 'fiona'],
          [2, 'justin'],
        ],
        time,
        rows_affected: rowsAffected,
        last_insert_id: lastInsertId,
      }
      const dataResult = new DataResult(result, 0)
      assert.equal(dataResult.getTime(), time, 'time')
      assert.equal(dataResult.getRowsAffected(), rowsAffected, 'rows_affected')
      assert.equal(dataResult.getLastInsertId(), lastInsertId, 'last_insert_id')
    })
  })
  describe('DataResults', () => {
    it('should throw an error when a data argument is not provided to the constructor', () => {
      assert.throws(() => new DataResults(), 'The data argument is required to be an object')
    })
    it('should return false on method hasError when results are empty', () => {
      const dataResults = new DataResults({ results: [] })
      assert.isFalse(dataResults.hasError())
    })
    it('should return true on method hasError when results have an error', () => {
      const dataResults = new DataResults({
        results: [{
          error: 'There was an error',
        }],
      })
      assert.isTrue(dataResults.hasError())
    })
    it('should return true on method hasError when results have an error', () => {
      const error = 'There was an error'
      const dataResults = new DataResults({
        results: [{
          error,
        }],
      })
      const dataResultError = dataResults.getFirstError()
      assert.instanceOf(dataResultError, DataResultError)
      assert.equal(dataResultError.message, error)
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
    it('should create a string of data results and errors', () => {
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
      assert.equal(dataResults.toString(), JSON.stringify(expected))
    })
  })
})
