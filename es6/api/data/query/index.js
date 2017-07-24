import _assign from 'lodash/assign'
import {get} from '../../client'

export const PATH = '/db/query'

/**
 * Get an api request to query SQL on an rqlite server.
 * @param {string} url - The full url for the request i.e. http://localhost:4001/db/query
 * @param {string} sql - The SQL string to excute on the server.
 * @param {object=} options - HTTP client options.
 */
export default function (url, sql, options = {}) {
  let {httpOptions={}} = options
  let {query={}} = httpOptions
  // Add the q parameter which is used for SELECT statements.
  query = _assign({}, query, {q: sql})
  // Put the query back on the httpOptions
  httpOptions = _assign({}, httpOptions, {query})
  // Put the httpOptions back on the options
  options = _assign({}, options, {httpOptions})
  return get(url, PATH, options)
}
