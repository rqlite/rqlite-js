/**
 * Class for handling many RQLite data api results
 * @module api/results/data-results
 * @see https://rqlite.io/docs/api/api/
 * @see module:api/results/result-fields
 */
import DataResult from './data-result.js'
import type { RqliteSingleResult } from './data-result.js'
import DataResultError from './data-result-error.js'
import {
  RESULT_FIELD_ERROR,
  RESULT_FIELD_ERROR_V2,
  RESULT_FIELD_RESULTS,
  RESULT_FIELD_TIME,
  RESULT_FIELD_VALUES,
} from './result-fields.js'

export type RqliteApiData = {
  [RESULT_FIELD_TIME]?: number | string
  [RESULT_FIELD_RESULTS]: RqliteSingleResult[]
}

/**
 * A class to manage a list of results from an RQLite query or execute API response
 * @see https://rqlite.io/docs/api/api/
 */
export default class DataResults {
  time = 0.0

  results: Array<DataResult | DataResultError> = []

  constructor (data: RqliteApiData) {
    this.setApiData(data)
  }

  setApiData (data: RqliteApiData): void {
    if (typeof data !== 'object' || data === null) {
      throw new Error('The data argument is required to be an object')
    }
    if (!data[RESULT_FIELD_RESULTS]) {
      throw new Error('The data object is required to have a results property')
    }
    this.time = parseFloat(String(data[RESULT_FIELD_TIME] || 0.0))
    const results = data[RESULT_FIELD_RESULTS] || []
    this.results = results.reduce<Array<DataResult | DataResultError>>((acc, result) => {
      if (typeof result === 'object' && result !== null && result[RESULT_FIELD_ERROR]) {
        return acc.concat(
          new DataResultError(
            String(result[RESULT_FIELD_ERROR]),
            result[RESULT_FIELD_ERROR_V2] as Record<string, unknown> | undefined,
          ),
        )
      }
      const vals = result[RESULT_FIELD_VALUES]
      if (!vals) {
        return acc.concat(new DataResult(result))
      }
      const dataResults = vals.map((_v, valuesIndex) => new DataResult(result, valuesIndex))
      return acc.concat(dataResults)
    }, [])
  }

  hasError (): boolean {
    return !!this.getFirstError()
  }

  getFirstError (): DataResultError | undefined {
    return this.results.find((v) => v instanceof DataResultError) as DataResultError | undefined
  }

  getTime (): number {
    return this.time
  }

  get (index: number): DataResult | DataResultError | undefined {
    return this.results[index]
  }

  getResults (): Array<DataResult | DataResultError> {
    return this.results
  }

  toArray (): Record<string, unknown>[] {
    return this.results.map((result) => result.toObject())
  }

  toString (): string {
    const list = this.results.map((result) => result.toObject())
    return JSON.stringify(list)
  }
}
