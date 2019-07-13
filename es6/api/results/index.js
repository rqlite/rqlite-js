import _find from 'lodash/find'
import _concat from 'lodash/concat'
import _reduce from 'lodash/reduce'
import _map from 'lodash/map'
import _mapKeys from 'lodash/mapKeys'
import _has from 'lodash/has'
import _set from 'lodash/set'
import _get from 'lodash/get'

/**
 * Get the first error or undefined if one does not exist from
 * an array of results that was a response from an rqlite server.
 * @param {array} results A array from the results fields of rqlite response.
 */
export function getError(results = []) {
  const errorData = _find(results, result => _has(result, 'error'))
  if (errorData) {
    return new Error(_get(errorData, 'error'))
  }
  return undefined
}

/**
 * Create a plain javascript array containing objects
 * representing name value pairs of the results.
 * @param {array} results An array from the results fields
 * of rqlite response.
 * @param {object} options Options for the function
 * @param {boolen} options.valuesAsArrays Preserve
 * the values as an array of arrays, defaults to a single
 * array of objects.
 */
export function toPlainJs(results = [], options = {}) {
  const { valuesAsArrays } = options
  return _reduce(results, (reduction, result, resultIndex) => {
    const columns = _get(result, 'columns', [])
    const values = _get(result, 'values', [])
    // Map each of the values onto an object with the
    // column name as the key and the values as the value
    const nvpResults = _map(
      values,
      value => _mapKeys(value, (val, index) => _get(columns, index)),
    )
    // Keep the orginal array of arrays of objects result structure
    if (valuesAsArrays) {
      _set(reduction, resultIndex, nvpResults)
      return reduction
    }
    // Collapse results to an array of objects
    return _concat(reduction, nvpResults)
  }, [])
}
