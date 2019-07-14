/**
 * Features for handle RQLite data api responses for success and errors
 * @module api/results
 */

/**
 * A class that represents one data result from an RQLite query or execute
 * API call
 */
export class DataResult {
  /**
   * The time the results query took to complete
   */
  time = 0

  /**
   * The last insert id
   * @type {Number}
   */
  lastInsertId

  /**
   * The rows affected
   * @type {Number}
   */
  rowsAffected

  /**
   * An array of DataResult and/or DataResultError instances
   * @type {Array<DataResult|DataResultError>}
   */
  results = []

  /**
   * An object after the columns and values are mapped from
   * an RQLite response
   */
  data = {}

  /**
   * The data result constructor
   * @param {Array} result An API response individual result
   * @param {Array} [valuesIndex] The index to get the values from the result
   */
  constructor (result, valuesIndex) {
    if (typeof result !== 'object') {
      throw new Error('The result argument is required to be an object')
    }
    if (typeof valuesIndex !== 'undefined' && !Number.isFinite(valuesIndex)) {
      throw new Error('The valuesIndex argument is required to be a finite number when provided')
    }
    this.time = result.time
    this.rowsAffected = result.rows_affected
    this.lastInsertId = result.last_insert_id
    // Map the values array to an object where columns are the properties
    if (Number.isFinite(valuesIndex)) {
      const { columns } = result
      const resultValues = result.values[valuesIndex]
      if (resultValues) {
        this.data = resultValues.reduce((acc, val, i) => {
          const col = columns[i]
          acc[col] = val
          return acc
        }, {})
      }
    }
  }

  /**
   * Return the value a property or undefined if it does not exist
   * @returns {*} The value of the property or undefined
   */
  get (property) {
    return this.data[property]
  }

  /**
   * Get the time the result took
   * @param {Number}
   */
  getTime () {
    return this.time
  }

  /**
   * Get the last insert id
   * @returns {Number|undefined}
   */
  getLastInsertId () {
    return this.lastInsertId
  }

  /**
   * Get the row affected
   * @returns {Number|undefined}
   */
  getRowsAffected () {
    return this.rowsAffected
  }

  /**
   * Get the result data as plain object
   * @returns {Object} The data as an object
   */
  toObject () {
    // Clone deep
    return JSON.parse(JSON.stringify(this.data))
  }

  /**
   * Map the data values to an array
   * @returns {Array}
   */
  toArray () {
    return Object.values(this.data)
  }

  /**
   * Map the data properites to an array
   * @returns {String[]}
   */
  toColumnsArray () {
    return Object.keys(this.data)
  }

  /**
   * Convert the result data to a JSON string
   * @returns {String} The JSON string for the data object
   */
  toString () {
    return JSON.stringify(this.data)
  }
}

/**
 * A class that represents one data error result from an RQLite query or execute
 * API call
 */
export class DataResultError extends Error {
  /**
   * Get the result data error as plain object
   * @returns {Object} The data as an object
   */
  toObject () {
    return { error: this.message }
  }

  /**
   * Convert the result data error to a JSON string
   * @returns {String} The JSON string for the data object
   */
  toString () {
    return JSON.stringify(this.toObject())
  }
}

/**
 * A class to manage a list of results from an RQLite query or execute API response
 */
export class DataResults {
  /**
   * The time the results took to return from the
   * RQLite api
   */
  time = 0

  /**
   * The results which is an empty arry to start
   * @type {DataResult[]}
   */
  results = []

  /**
   * The data result list constructor
   * @param {Array} data The data object sent from a RQLite API response
   * @param {Number} time The time the API response took to complete
   */
  constructor (data) {
    this.setApiData(data)
  }

  /**
   * Set the api as results
   * @param {Object} data Api data
   */
  setApiData (data) {
    if (typeof data !== 'object') {
      throw new Error('The data argument is required to be an object')
    }
    if (!data.results) {
      throw new Error('The data object is required to have a results property')
    }
    this.time = data.time || 0
    const { results = [] } = data
    this.results = results.reduce((acc, result) => {
      // If there is an error property this is an error
      if (typeof result === 'object' && result.error) {
        return acc.concat(new DataResultError(result.error))
      }
      const { values: vals } = result
      // We don't have values so this is a single result row
      if (!vals) {
        return acc.concat(new DataResult(result))
      }
      // Map the values to DataResult instances
      const dataResults = vals.map((_v, valuesIndex) => new DataResult(result, valuesIndex))
      return acc.concat(dataResults)
    }, [])
  }

  /**
   * Returns true if an instance of DataResultError exists in the results
   * @returns {Boolean} True if a DataResultError instance exists
   */
  hasError () {
    return !!this.getFirstError()
  }

  /**
   * Get the first error that occured
   * @returns {DataResultError|undefined}
   */
  getFirstError () {
    return this.results.find(v => v instanceof DataResultError)
  }

  /**
   * Get the time the results took
   * @param {Number}
   */
  getTime () {
    return this.time
  }

  /**
   * Return one result at a specific index or undefined it it does not exist
   * @returns {DataResult|DataResultError|undefined}
   */
  get (index) {
    return this.results[index]
  }

  /**
   * Return the results array
   * @returns {Array<DataResult|DataResultError>}
   */
  getResults () {
    return this.results
  }

  /**
   * Get the result data list as array of plain objects
   * @returns {Object[]} The data as an array or objects
   */
  toArray () {
    return this.results.map(result => result.toObject())
  }

  /**
   * Convert the result data list to a JSON string that is an
   * array of objects
   * @returns {String} A JSON string
   */
  toString () {
    const list = this.results.map(result => result.toString())
    return JSON.stringify(list)
  }
}
