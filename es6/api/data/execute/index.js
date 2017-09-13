import _assign from 'lodash/assign'
import _isArray from 'lodash/isArray'
import {post} from '../../client'

export const PATH = '/db/execute'

/**
 * Get an api request to execute SQL on an rqlite server.
 * @param {string} url - The full url for the request i.e. http://localhost:4001
 * @param {array|string} sql - The SQL string or an array of string to excute on the server.
 * @param {object=} options - HTTP client options.
 */
export default function (url, sql, options = {}) {
  let {httpOptions={}} = options
  const body = _isArray(sql) ? sql : [sql]
  // Add the body which is used for UPDATE, INSERT, DELETE, CREATE, DROP, etc. statements.
  httpOptions = _assign({}, httpOptions, {body})
  // Put the httpOptions back on the options
  options = _assign({}, options, {httpOptions})
  return post(url, PATH, options)
}
