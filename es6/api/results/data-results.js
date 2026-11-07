/**
 * Class for handling many RQLite data api results
 * @module api/results/data-results
 * @see https://rqlite.io/docs/api/api/
 * @see module:api/results/result-fields
 */
import DataResult from './data-result'
import DataResultError from './data-result-error'
import {
  RESULT_FIELD_ERROR,
  RESULT_FIELD_ERROR_V2,
  RESULT_FIELD_RESULTS,
  RESULT_FIELD_TIME,
  RESULT_FIELD_VALUES,
} from './result-fields'

/**
 * @typedef {Object} RqliteResultRow
 * @property {String} [error] Legacy error message
 * @property {Object} [error_v2] Structured error from rqlite v10+
 * @property {Array<*>} [values] Query row values
 */

/**
 * A class to manage a list of results from an RQLite query or execute API response
 * @see https://rqlite.io/docs/api/api/
 */
export default class DataResults {
  /**
   * The time the results took to return from the
   * RQLite api
   * @type {Number}
   */
  time = 0.0

  /**
   * The results which is an empty array to start
   * @type {Array<DataResult|DataResultError>}
   */
  results = []

  /**
   * The data result list constructor
   * @param {Object} data The data object sent from a RQLite API response
   * @param {Number} [data.time] The time the API response took to complete
   * @param {RqliteResultRow[]} data.results The results array
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
    if (!data[RESULT_FIELD_RESULTS]) {
      throw new Error('The data object is required to have a results property')
    }
    this.time = parseFloat(data[RESULT_FIELD_TIME] || 0.0)
    const results = data[RESULT_FIELD_RESULTS] || []
    this.results = results.reduce((acc, result) => {
      // If there is an error property this is an error
      if (typeof result === 'object' && result[RESULT_FIELD_ERROR]) {
        return acc.concat(
          new DataResultError(result[RESULT_FIELD_ERROR], result[RESULT_FIELD_ERROR_V2]),
        )
      }
      const vals = result[RESULT_FIELD_VALUES]
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
    return this.results.find((v) => v instanceof DataResultError)
  }

  /**
   * Get the time the results took
   * @returns {Number} The time the query took
   */
  getTime () {
    return this.time
  }

  /**
   * Return one result at a specific index or undefined it it does not exist
   * @param {Number} index The result index
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
    return this.results.map((result) => result.toObject())
  }

  /**
   * Convert the result data list to a JSON string that is an
   * array of objects
   * @returns {String} A JSON string
   */
  toString () {
    const list = this.results.map((result) => result.toObject())
    return JSON.stringify(list)
  }
}
