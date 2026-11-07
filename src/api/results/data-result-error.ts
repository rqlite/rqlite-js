/**
 * Class for handling RQLite data api result error
 * @module api/results/data-result-error
 * @see https://rqlite.io/docs/api/api/
 */
import { RESULT_FIELD_ERROR, RESULT_FIELD_ERROR_V2 } from './result-fields.js'

/**
 * A class that represents one data error result from an RQLite query or execute API call
 * @see https://rqlite.io/docs/api/api/
 */
export default class DataResultError extends Error {
  code: string

  errorV2?: Record<string, unknown>

  constructor (message: string, errorV2?: Record<string, unknown>) {
    super(message)
    this.name = this.constructor.name
    this.code = this.constructor.name
    if (errorV2) {
      this.errorV2 = errorV2
    }
  }

  getErrorV2 (): Record<string, unknown> | undefined {
    return this.errorV2
  }

  toObject (): Record<string, unknown> {
    const obj: Record<string, unknown> = { [RESULT_FIELD_ERROR]: this.message }
    if (this.errorV2) {
      obj[RESULT_FIELD_ERROR_V2] = this.errorV2
    }
    return obj
  }

  toString (): string {
    return JSON.stringify(this.toObject())
  }
}
