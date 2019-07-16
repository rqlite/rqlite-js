import cloneDeep from 'lodash/cloneDeep'
import concat from 'lodash/concat'
import get from 'lodash/get'
import find from 'lodash/find'
import has from 'lodash/has'
import isFinite from 'lodash/isFinite'
import isObject from 'lodash/isObject'
import isUndefined from 'lodash/isUndefined'
import keys from 'lodash/keys'
import map from 'lodash/map'
import reduce from 'lodash/reduce'
import values from 'lodash/values'
import zipObject from 'lodash/zipObject'

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
    if (!isObject(result)) {
      throw new Error('The result argument is required to be an object')
    }
    if (!isUndefined(valuesIndex) && !isFinite(valuesIndex)) {
      throw new Error('The valuesIndex argument is required to be a a finite number when provided')
    }
    this.time = get(result, 'time')
    this.rowsAffected = get(result, 'rows_affected')
    this.lastInsertId = get(result, 'last_insert_id')
    // Map the values array to an object where columns are the properties
    if (isFinite(valuesIndex)) {
      const columns = get(result, 'columns')
      const resultValues = get(result, ['values', valuesIndex])
      if (resultValues) {
        this.data = zipObject(columns, resultValues)
      }
    }
  }

  /**
   * Return the value a property or undefined if it does not exist
   * @returns {*} The value of the property or undefined
   */
  get (property) {
    return get(this.data, property)
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
    return cloneDeep(this.data)
  }

  /**
   * Map the data values to an array
   * @returns {Array}
   */
  toArray () {
    return values(this.data)
  }

  /**
   * Map the data properites to an array
   * @returns {String[]}
   */
  toColumnsArray () {
    return keys(this.data)
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
    if (!isObject(data)) {
      throw new Error('The data argument is required to be an object')
    }
    if (!has(data, 'results')) {
      throw new Error('The data object is required to have a results property')
    }
    this.time = get(data, 'time', 0)
    this.results = reduce(get(data, 'results', []), (acc, result) => {
      // If there is an error property this is an error
      if (isObject(result) && has(result, 'error')) {
        return concat(acc, new DataResultError(get(result, 'error')))
      }
      const vals = get(result, 'values')
      // We don't have values so this is a single result row
      if (!vals) {
        return concat(acc, new DataResult(result))
      }
      // Map the values to DataResult instances
      const dataResults = map(vals, (_v, valuesIndex) => new DataResult(result, valuesIndex))
      return concat(acc, dataResults)
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
    return find(this.results, v => v instanceof DataResultError)
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
    return get(this.results, index)
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
    return map(this.results, result => result.toObject())
  }

  /**
   * Convert the result data list to a JSON string that is an
   * array of objects
   * @returns {String} A JSON string
   */
  toString () {
    const list = map(this.results, result => result.toString())
    return JSON.stringify(list)
  }
}
