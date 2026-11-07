import { DataResult, DataResultError, DataResults } from '.'

describe('api data results', () => {
  describe('DataResultError', () => {
    it('should create a JS object', () => {
      const message = 'test'
      const dataResultError = new DataResultError(message)
      expect(dataResultError.toObject()).toEqual({ error: message })
    })
    it('should create a JSON object', () => {
      const message = 'test'
      const dataResultError = new DataResultError(message)
      expect(dataResultError.toString()).toEqual(JSON.stringify({ error: message }))
    })
    it('should have the error name and code DataResultError', () => {
      const message = 'test'
      const dataResultError = new DataResultError(message)
      expect(dataResultError).toHaveProperty('name', 'DataResultError')
      expect(dataResultError).toHaveProperty('code', 'DataResultError')
    })
    it('should include error_v2 when provided', () => {
      const message = 'incomplete input'
      const errorV2 = {
        message,
        sqlite: { code: 1, extended_code: 1 },
      }
      const dataResultError = new DataResultError(message, errorV2)
      expect(dataResultError.getErrorV2()).toEqual(errorV2)
      expect(dataResultError.toObject()).toEqual({
        error: message,
        error_v2: errorV2,
      })
    })
  })
  describe('DataResult', () => {
    it('should throw an error when a result argument is missing', () => {
      expect(() => new DataResult()).toThrow('The result argument is required to be an object')
    })
    it('should throw an error when a valuesIndex argument is provided a letter', () => {
      expect(() => new DataResult({}, 'a')).toThrow('The valuesIndex argument is required to be a finite number when provided')
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
      expect(dataResult.toObject()).toEqual({ id: 1, name: 'fiona' })
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
      expect(dataResult.toArray()).toEqual([1, 'fiona'])
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
      expect(dataResult.toColumnsArray()).toEqual(['id', 'name'])
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
      expect(dataResult.getTime()).toEqual(time)
      expect(dataResult.getRowsAffected()).toEqual(rowsAffected)
      expect(dataResult.getLastInsertId()).toEqual(lastInsertId)
    })
  })
  describe('DataResults', () => {
    it('should throw an error when a data argument is not provided to the constructor', () => {
      expect(() => new DataResults()).toThrow('The data argument is required to be an object')
    })
    it('should return false on method hasError when results are empty', () => {
      const dataResults = new DataResults({ results: [] })
      expect(dataResults.hasError()).toBe(false)
    })
    it('should return true on method hasError when results have an error', () => {
      const dataResults = new DataResults({
        results: [{
          error: 'There was an error',
        }],
      })
      expect(dataResults.hasError()).toBe(true)
    })
    it('should return the first DataResultError via getFirstError', () => {
      const error = 'There was an error'
      const dataResults = new DataResults({
        results: [{
          error,
        }],
      })
      const dataResultError = dataResults.getFirstError()
      expect(dataResultError).toBeInstanceOf(DataResultError)
      expect(dataResultError.message).toEqual(error)
    })
    it('should capture error_v2 from rqlite v10+ responses', () => {
      const error = 'incomplete input'
      const errorV2 = {
        message: error,
        sqlite: { code: 1, extended_code: 1 },
      }
      const dataResults = new DataResults({
        results: [{
          error,
          error_v2: errorV2,
        }],
      })
      const dataResultError = dataResults.getFirstError()
      expect(dataResultError).toBeInstanceOf(DataResultError)
      expect(dataResultError.getErrorV2()).toEqual(errorV2)
      expect(dataResultError.toObject()).toEqual({
        error,
        error_v2: errorV2,
      })
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
      expect(dataResults.toArray()).toEqual(expected)
      expect(dataResults.getTime()).toEqual(time)
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
      expect(dataResults.toArray()).toEqual(expected)
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
      expect(dataResults.toArray()).toEqual(expected)
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
      expect(dataResults.toString()).toEqual(JSON.stringify(expected))
    })
  })
})
