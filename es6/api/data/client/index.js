import _isString from 'lodash/isString'
import _isFunction from 'lodash/isFunction'
import _merge from 'lodash/merge'
import _omit from 'lodash/omit'
import _partial from 'lodash/partial'
import queryDataApi from '../query'
import executeDataApi from '../execute'

/**
 * Creates a promise which on success provides a client that can talk to a rqlite data api.
 * @param {object|string} options Options for that will be used on all connections or the url if it is a string.
 * @param {string} options.url The url for all connections i.e. http://localhost:4001.
 * @param {object} options.httpOptions The default options that are applied to all HTTP clients.
 * @param {object} options.httpOptions.agent An agent to be used instead of the default http agent, this is useful for keep alive.
 */
export default function connect(options = {}) {
  return new Promise(((resolve, reject) => {
    options = _isString(options) ? {url: options} : options
    const {url} = options
    if (!url) {
      reject(new Error('The url option is required to connect to a data api.'))
      return
    }
    const queryDataApiPartial = _partial(clientConnect, options, queryDataApi)
    const executeDataApiPartial = _partial(clientConnect, options, executeDataApi)
    resolve({
      select: queryDataApiPartial,
      update: executeDataApiPartial,
      insert: executeDataApiPartial,
      delete: executeDataApiPartial,
      table: {
        create: executeDataApiPartial,
        drop: executeDataApiPartial,
      },
    })
  }))
}

/**
 * Wraps the client functions with connectOptions so defaults can be applied
 * @param {object} connectOptions Options that were supplied to the connect function.
 * @param {function} clientMethod The client method to be called.
 * @param {array}string} sql String or array of string containing SQL queries.
 * @param {object} options Options for this request that will me merged with connectOptions.
 */
function clientConnect(connectOptions, clientMethod, sql, options = {}) {
  const {url} = connectOptions
  if (!_isString(url)) {
    throw new Error('The url argument is required to be a string.')
  }
  if (!_isFunction(clientMethod)) {
    throw new Error('The clientMethod argument is required to be a function.')
  }
  options = _merge({}, _omit(connectOptions, ['url']), options)
  return clientMethod(url, sql, options)
}
