import _assign from 'lodash/assign'
import _isArray from 'lodash/isArray'
import { post } from '../../client'

export const PATH = '/db/execute'

/**
 * Get an api request to execute SQL on an rqlite server.
 * @param {String} url The full url for the request i.e. http://localhost:4001
 * @param {String[]|String} sql The SQL string or an array of string to excute on the server.
 * @param {Object} [options={}] HTTP client options.
 */
export default function execute (url, sql, options = {}) {
  let { httpOptions = {} } = options
  const body = _isArray(sql) ? sql : [sql]
  // Add the body which is used for UPDATE, INSERT, DELETE, CREATE, DROP, etc. statements.
  httpOptions = _assign({}, httpOptions, { body })
  // Put the httpOptions back on the options
  const opts = _assign({}, options, { httpOptions })
  return post(url, PATH, opts)
}
