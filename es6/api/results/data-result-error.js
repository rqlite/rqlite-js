/**
 * Class for handling RQLite data api result error
 * @module api/results/data-result-error
 * @see https://rqlite.io/docs/api/api/
 */
import { RESULT_FIELD_ERROR, RESULT_FIELD_ERROR_V2 } from './result-fields'

/**
 * A class that represents one data error result from an RQLite query or execute
 * API call
 * @see https://rqlite.io/docs/api/api/
 */
export default class DataResultError extends Error {
  /**
   * Structured error object from rqlite v10+ when present
   * @type {Object|undefined}
   */
  errorV2

  /**
   * @param {String} message The error message (legacy `error` field)
   * @param {Object} [errorV2] Optional structured `error_v2` payload from rqlite v10+
   */
  constructor (message, errorV2) {
    super(message)
    this.name = this.constructor.name
    this.code = this.constructor.name
    if (errorV2) {
      this.errorV2 = errorV2
    }
  }

  /**
   * Get the structured error_v2 object when present
   * @returns {Object|undefined}
   * @see https://rqlite.io/docs/api/api/
   */
  getErrorV2 () {
    return this.errorV2
  }

  /**
   * Get the result data error as plain object
   * @returns {Object} The data as an object
   */
  toObject () {
    const obj = { [RESULT_FIELD_ERROR]: this.message }
    if (this.errorV2) {
      obj[RESULT_FIELD_ERROR_V2] = this.errorV2
    }
    return obj
  }

  /**
   * Convert the result data error to a JSON string
   * @returns {String} The JSON string for the data object
   */
  toString () {
    return JSON.stringify(this.toObject())
  }
}
