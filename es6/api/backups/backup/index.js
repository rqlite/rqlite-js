import _assign from 'lodash/assign'
import {get} from '../../client'
import {CONTENT_TYPE_APPLICATION_OCTET_STREAM} from '../../../http/content-types'

export const PATH = '/db/backup'

/**
 * Get an api request to for backup SQL data on an rqlite server. This will return
 * a buffer by default.
 * @param {string} url The full url for the request i.e. http://localhost:4001
 * @param {object=} options HTTP client options.
 */
export default function (url, options = {}) {
  let {httpOptions = {}} = options
  let {headers = {}} = httpOptions
  headers = _assign({}, headers, {
    Accept: CONTENT_TYPE_APPLICATION_OCTET_STREAM,
    'Content-Type': CONTENT_TYPE_APPLICATION_OCTET_STREAM,
  })
  httpOptions = _assign({}, httpOptions, {
    headers,
    buffer: true, // Create a buffer
  })
  const opts = _assign({}, options, {httpOptions})
  return get(url, PATH, opts)
}
