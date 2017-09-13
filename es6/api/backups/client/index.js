import _isString from 'lodash/isString'
import _isFunction from 'lodash/isFunction'
import _merge from 'lodash/merge'
import _omit from 'lodash/omit'
import _partial from 'lodash/partial'
import backupApi from '../backup'
import restoreApi from '../restore'
import {Promise as PromiseRsvp} from 'rsvp'

/**
 * Creates a promise which on success provides a client that can talk to a rqlite data api.
 * @param {object|string} options - Options for that will be used on all connections or the url if it is a string.
 * @param {string} options.url - The url for all connections i.e. http://localhost:4001.
 * @param {object} options.httpOptions - The default options that are applied to all HTTP clients.
 * @param {object} options.httpOptions.agent - An agent to be used instead of the default http agent, this is useful for keep alive.
 */
export default function connect (options = {}) {
  return new PromiseRsvp(function handlePromise (resolve, reject) {
    options = _isString(options) ? {url: options} : options
    const {url} = options
    if (!url) {
      reject(new Error('The url option is required to connect to a data api.'))
      return
    }
    resolve({
      backup: _partial(clientConnect, options, backupApi),
      restore: _partial(clientConnect, options, restoreApi)
    })
  })
}

/**
 * Wraps the client functions with connectOptions so defaults can be applied
 * @param {object} connectOptions - Options that were supplied to the connect function.
 * @param {function} clientMethod - The client method to be called.
 * @param {string} path - The path this request i.e. /db/query.
 * @param {object} options - Options for this request that will me merged with connectOptions.
 */
function clientConnect (connectOptions, clientMethod, options = {}) {
  const {url} = connectOptions
  if (!_isString(url)) {
    throw new Error('The url argument is required to be a string.')
  }
  if (!_isFunction(clientMethod)) {
    throw new Error('The clientMethod argument is required to be a function.')
  }
  options = _merge({}, _omit(connectOptions, ['url']), options)
  return clientMethod(url, options)
}
