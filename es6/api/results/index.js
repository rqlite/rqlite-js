import _find from 'lodash/find'
import _map from 'lodash/map'
import _reduce from 'lodash/reduce'
import _set from 'lodash/set'
import _has from 'lodash/has'
import _get from 'lodash/get'

/**
 * Get the first error or undefined if one does not exist from
 * an array of results that was a response from an rqlite server.
 * @param {array} results - A array from the results fields of sqlite response.
 */
export function getError (results = []) {
  const errorData = _find(results, (result) => _has(result, 'error'))
  if (errorData) {
    return new Error(_get(errorData, 'error'))
  }
  return undefined
}

/**
 * Create a plain object for application use from a results object.
 * @param {array} results - A array from the results fields of sqlite response.
 */
export function toPlainJs (results = []) {
  return _map(results, function mapResults (result) {
    const columns = _get(result, 'columns', [])
    const values = _get(result, 'values', [])
    const columnDepth = 0
    const columnDepthValues = _get(values, columnDepth, [])
    return _reduce(columns, function mapColumns (reduction, column, index) {
      return _set(reduction, column, _get(columnDepthValues, index))
    }, {})
  })
}
