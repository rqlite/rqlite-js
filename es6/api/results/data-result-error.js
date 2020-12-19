/**
 * Class for handling RQLite data api result error
 * @module api/results/data-results
 */

/**
 * A class that represents one data error result from an RQLite query or execute
 * API call
 */
export default class DataResultError extends Error {
  constructor (...args) {
    super(...args)
    this.name = this.constructor.name
    this.code = this.constructor.name
  }

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
