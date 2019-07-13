import _assign from 'lodash/assign'
import { post } from '../../client'
import { CONTENT_TYPE_TEXT_PLAIN } from '../../../http/content-types'

export const PATH = '/db/load'

/**
 * Get an api request to query SQL on an rqlite server.
 * @param {String} url The full url for the request i.e. http://localhost:4001/db/query
 * @param {String} [backupString] An optional body string is that is how you want to
 * send the backup string.
 * @param {Object} [options={}] HTTP client options.
 */
export default function restore (url, options = {}) {
  let { httpOptions = {} } = options
  let { headers = {} } = httpOptions
  headers = _assign({}, headers, {
    'Content-Type': CONTENT_TYPE_TEXT_PLAIN,
  })
  httpOptions = _assign({}, httpOptions, { headers })
  const opts = _assign({}, options, { httpOptions })
  return post(url, PATH, opts)
}
