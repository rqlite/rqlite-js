/**
 * Base API client for RQLite which abstracts the HTTP calls
 * @module api/client
 */
import omitBy from 'lodash/omitBy'
import isUndefined from 'lodash/isUndefined'
import assign from 'lodash/assign'
import HttpRequest from '../../http-request'

/**
 * Create the base HTTP query options from RQLite API options
 * @param {Object} query The RQLite API options
 * @returns {Object} The HTTP query
 */
export function createQuery (query = {}, options = {}) {
  const { level, pretty, timings, transaction } = options
  // Create the API query and remove any undefined values.
  return assign(
    {},
    query,
    omitBy({ level, pretty, timings, transaction }, isUndefined),
  )
}

/**
 * Base API client for RQLite which abstracts the HTTP calls
 * from the user
 */
export default class ApiClient extends HttpRequest {
  /**
   * Wrapper around HttpRequest.fetch() to create default queries
   */
  // async fetch (options = {}) {
  //   const { query = {} } = options
  //   const query = createQuery(query, )
  //   return super.fetch(assign({}, options, { query }))
  // }
}
