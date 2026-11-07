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
} from './result-fields.js'

export type RqliteSingleResult = {
  [RESULT_FIELD_TIME]?: number | string
  [RESULT_FIELD_ROWS_AFFECTED]?: number | string
  [RESULT_FIELD_LAST_INSERT_ID]?: number
  [RESULT_FIELD_COLUMNS]?: string[]
  [RESULT_FIELD_VALUES]?: unknown[][]
  [key: string]: unknown
}

/**
 * A class that represents one data result from an RQLite query or execute API call
 * @see https://rqlite.io/docs/api/api/
 */
export default class DataResult {
  time = 0.0

  lastInsertId?: number

  rowsAffected = 0

  data: Record<string, unknown> = {}

  constructor (result: RqliteSingleResult, valuesIndex?: number) {
    if (typeof result !== 'object' || result === null) {
      throw new Error('The result argument is required to be an object')
    }
    if (typeof valuesIndex !== 'undefined' && !Number.isFinite(valuesIndex)) {
      throw new Error('The valuesIndex argument is required to be a finite number when provided')
    }
    this.time = parseFloat(String(result[RESULT_FIELD_TIME] || 0.0))
    this.rowsAffected = parseInt(String(result[RESULT_FIELD_ROWS_AFFECTED] || 0), 10)
    this.lastInsertId = result[RESULT_FIELD_LAST_INSERT_ID] as number | undefined
    if (Number.isFinite(valuesIndex)) {
      const columns = result[RESULT_FIELD_COLUMNS] as string[]
      const resultValues = (result[RESULT_FIELD_VALUES] as unknown[][])[valuesIndex as number]
      if (resultValues) {
        this.data = resultValues.reduce<Record<string, unknown>>((acc, val, i) => {
          const col = columns[i]
          acc[col] = val
          return acc
        }, {})
      }
    }
  }

  get (property: string): unknown {
    return this.data[property]
  }

  getTime (): number {
    return this.time
  }

  getLastInsertId (): number | undefined {
    return this.lastInsertId
  }

  getRowsAffected (): number {
    return this.rowsAffected
  }

  toObject (): Record<string, unknown> {
    return JSON.parse(JSON.stringify(this.data)) as Record<string, unknown>
  }

  toArray (): unknown[] {
    return Object.values(this.data)
  }

  toColumnsArray (): string[] {
    return Object.keys(this.data)
  }

  toString (): string {
    return JSON.stringify(this.data)
  }
}
