/**
 * Class for handling single RQLite data api result
 * @module api/results/data-result
 */

/**
 * A class that represents one data result from an RQLite query or execute
 * API call
 */
export default class DataResult {
  /**
   * The time the results query took to complete
   * @type {Number}
   */
  time = 0.0

  /**
   * The last insert id
   * @type {Number}
   */
  lastInsertId

  /**
   * The rows affected
   * @type {Number}
   */
  rowsAffected = 0

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
    this.time = parseFloat(result.time || 0.0)
    this.rowsAffected = parseInt(result.rows_affected || 0, 10)
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
