// import _isString from 'lodash/isString'
// import _isFunction from 'lodash/isFunction'
// import _merge from 'lodash/merge'
// import _omit from 'lodash/omit'
// import _partial from 'lodash/partial'
// import queryDataApi from '../query'
// import executeDataApi from '../execute'

// /**
//  * Wraps the client functions with connectOptions so defaults can be applied
//  * @param {Object} connectOptions Options that were supplied to the connect function.
//  * @param {Function} clientMethod The client method to be called.
//  * @param {String[]|String} sql String or array of string containing SQL queries.
//  * @param {Object} options Options for this request that will me merged with connectOptions.
//  */
// function clientConnect (connectOptions, clientMethod, sql, options = {}) {
//   const { url } = connectOptions
//   if (!_isString(url)) {
//     throw new Error('The url argument is required to be a string.')
//   }
//   if (!_isFunction(clientMethod)) {
//     throw new Error('The clientMethod argument is required to be a function.')
//   }
//   const opts = _merge({}, _omit(connectOptions, ['url']), options)
//   return clientMethod(url, sql, opts)
// }

// /**
//  * Creates a promise which on success provides a client that can talk to a rqlite data api.
//  * @param {Object|String} options Options for that will be used on all connections or
//  * the url if it is a string.
//  * @param {String} options.url The url for all connections i.e. http://localhost:4001.
//  * @param {Object} options.httpOptions The default options that are applied to all HTTP clients.
//  * @param {Object} options.httpOptions.agent An agent to be used instead of the default
//  * http agent, this is useful for keep alive.
//  */
// export default async function connect (options = {}) {
//   const opts = _isString(options) ? { url: options } : options
//   const { url } = opts
//   if (!url) {
//     throw new Error('The url option is required to connect to a data api.')
//   }
//   const queryDataApiPartial = _partial(clientConnect, opts, queryDataApi)
//   const executeDataApiPartial = _partial(clientConnect, opts, executeDataApi)
//   return {
//     select: queryDataApiPartial,
//     update: executeDataApiPartial,
//     insert: executeDataApiPartial,
//     delete: executeDataApiPartial,
//     table: {
//       create: executeDataApiPartial,
//       drop: executeDataApiPartial,
//     },
//   }
// }
