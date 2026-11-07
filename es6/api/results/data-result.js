/**
 * Class for handling single RQLite data api result
 * @module api/results/data-result
 * @see https://rqlite.io/docs/api/api/
 * @see module:api/results/result-fields
 */
import {
  RESULT_FIELD_COLUMNS,
  RESULT_FIELD_LAST_INSERT_ID,
  RESULT_FIELD_ROWS_AFFECTED,
  RESULT_FIELD_TIME,
  RESULT_FIELD_VALUES,
} from './result-fields'

/**
 * A class that represents one data result from an RQLite query or execute
 * API call
 * @see https://rqlite.io/docs/api/api/
 */
export default class DataResult {
  /**
   * The time the results query took to complete
   * @type {Number}
   */
  time = 0.0

  /**
   * The last insert id
   * @type {Number|undefined}
   */
  lastInsertId

  /**
   * The rows affected
   * @type {Number}
   */
  rowsAffected = 0

  /**
   * An object after the columns and values are mapped from
   * an RQLite response
   * @type {Object}
   */
  data = {}

  /**
   * The data result constructor
   * @param {Object} result An API response individual result
   * @param {Number} [valuesIndex] The index to get the values from the result
   */
  constructor (result, valuesIndex) {
    if (typeof result !== 'object') {
      throw new Error('The result argument is required to be an object')
    }
    if (typeof valuesIndex !== 'undefined' && !Number.isFinite(valuesIndex)) {
      throw new Error('The valuesIndex argument is required to be a finite number when provided')
    }
    this.time = parseFloat(result[RESULT_FIELD_TIME] || 0.0)
    this.rowsAffected = parseInt(result[RESULT_FIELD_ROWS_AFFECTED] || 0, 10)
    this.lastInsertId = result[RESULT_FIELD_LAST_INSERT_ID]
    // Map the values array to an object where columns are the properties
    if (Number.isFinite(valuesIndex)) {
      const columns = result[RESULT_FIELD_COLUMNS]
      const resultValues = result[RESULT_FIELD_VALUES][valuesIndex]
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
   * @param {String} property The property name
   * @returns {*} The value of the property or undefined
   */
  get (property) {
    return this.data[property]
  }

  /**
   * Get the time the result took
   * @returns {Number} The time the query took
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
   * @returns {Number}
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
   * @returns {Array<*>}
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
