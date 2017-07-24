import nock from 'nock'
import {CONTENT_TYPE_APPLICATION_JSON} from '../http/content-types'

export const QUERY_SUCCESS_RESPONSE = {
  results: [
    {
      columns: ['id', 'name'],
      types: ['integer', 'text'],
      values: [[1, 'fiona']]
    }
  ]
}

/**
 * Creates a nock that represents a succesful call to data query endpoint.
 */
export function querySuccess (options) {
  const {url, path, response = QUERY_SUCCESS_RESPONSE} = options
  return nock(url)
    .matchHeader('Accept', CONTENT_TYPE_APPLICATION_JSON)
    .get(path)
    .query(() => true)
    .reply(200, response)
}
