import nock from 'nock'
import { CONTENT_TYPE_APPLICATION_JSON } from '../../http/content-types'

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
    url, path, auth, response = RESTORE_SUCCESS_RESPONSE,
  } = options
  const scope = nock(url)
    .matchHeader('Accept', CONTENT_TYPE_APPLICATION_JSON)
    .post(path)
  if (auth) {
    scope.basicAuth(auth)
  }
  return scope.reply(200, response)
}
