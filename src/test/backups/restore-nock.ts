import nock from 'nock'
import { CONTENT_TYPE_APPLICATION_JSON, CONTENT_TYPE_TEXT_PLAIN } from '../../http-request/content-types'
import { HTTP_HEADER_ACCEPT, HTTP_HEADER_CONTENT_TYPE } from '../../http-request/http-headers'

export const RESTORE_SUCCESS_RESPONSE = {
  results: [
    {
      last_insert_id: 2,
      rows_affected: 1,
    },
  ],
}

/**
 * Creates a nock that represents a successful call to data query endpoint.
 */
export function restoreSuccess (options) {
  const {
    url, path, auth, response = RESTORE_SUCCESS_RESPONSE, body,
  } = options
  const scope = nock(url)
    .matchHeader(HTTP_HEADER_ACCEPT, CONTENT_TYPE_APPLICATION_JSON)
    .matchHeader(HTTP_HEADER_CONTENT_TYPE, CONTENT_TYPE_TEXT_PLAIN)
    .post(path, body)
  if (auth) {
    scope.basicAuth(auth)
  }
  return scope.reply(200, response)
}
