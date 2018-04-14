import _omitBy from 'lodash/omitBy'
import _isUndefined from 'lodash/isUndefined'
import _assign from 'lodash/assign'
import _get from 'lodash/get'
import {get as getHttp, post as postHttp} from '../../http'

function createApiUrl(url, path) {
  return `${url}${path}`
}

/**
 * Create the HTTP options object to be used in HTTP requests.
 * @param {object} options HTTP client options.
 */
export function createHttpOptions(options) {
  const {httpOptions = {}} = options
  let {query = {}} = httpOptions
  // Create the API query and remove any undefined values.
  const queryApiOptions = _omitBy({
    level: _get(options, 'level'),
    pretty: _get(options, 'pretty'),
    timings: _get(options, 'timings'),
    transaction: _get(options, 'transaction'),
  }, _isUndefined)
  query = _assign({}, query, queryApiOptions)
  return _assign({}, httpOptions, {query})
}

/**
 * Get an api client for a HTTP GET request.  This is the base for other more specific clients.
 * @param {string} url The base url for the request i.e. http://localhost:4001
 * @param {string} path The path for the request i.e. /db/query
 * @param {object} options HTTP client options.
 */
export function get(url, path, options) {
  return getHttp(createApiUrl(url, path), createHttpOptions(options))
}


/**
 * Get an api client for a HTTP POST request.  This is the base for other more specific clients.
 * @param {string} url The base url for the request i.e. http://localhost:4001
 * @param {string} path The path for the request i.e. /db/execute
 * @param {object} options HTTP client options.
 */
export function post(url, path, options) {
  return postHttp(createApiUrl(url, path), createHttpOptions(options))
}
