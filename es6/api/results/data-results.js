/**
 * Class for handling many RQLite data api results
 * @module api/results/data-results
 */
import DataResult from './data-result'
import DataResultError from './data-result-error'

/**
 * A class to manage a list of results from an RQLite query or execute API response
 */
export default class DataResults {
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
  hasErro () {
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
    return this.results.map((result) => result.toObject())
  }

  /**
   * Convert the result data list to a JSON string that is an
   * array of objects
   * @returns {String} A JSON string
   */
  toString () {
    const list = this.results.map((result) => result.toString())
    return JSON.stringify(list)
  }
}
