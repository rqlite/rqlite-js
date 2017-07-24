import nock from 'nock'
import {CONTENT_TYPE_APPLICATION_JSON} from '../http/content-types'

export const EXECUTE_SUCCESS_RESPONSE = {
  results: [
    {
      last_insert_id: 1,
      rows_affected: 1
    }
  ]
}

/**
 * Creates a nock that represents a succesful call to data query endpoint.
 */
export function executeSuccess (options) {
  const {url, path, response = EXECUTE_SUCCESS_RESPONSE} = options
  return nock(url)
    .matchHeader('Accept', CONTENT_TYPE_APPLICATION_JSON)
    .matchHeader('Content-Type', CONTENT_TYPE_APPLICATION_JSON)
    .post(path)
    .reply(200, response)
}
