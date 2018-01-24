import nock from 'nock'
import { CONTENT_TYPE_APPLICATION_JSON } from '../http/content-types'

export const QUERY_SUCCESS_RESPONSE = {
  results: [
    {
      columns: ['id', 'name'],
      types: ['integer', 'text'],
      values: [[1, 'fiona']],
    },
  ],
}

export const QUERY_MULTIPLE_SUCCESS_RESPONSE = {
  results: [
    {
      columns: ['id', 'name'],
      types: ['integer', 'text'],
      values: [[1, 'fiona']],
    },
    {
      columns: ['id', 'value'],
      types: ['integer', 'text'],
      values: [[1, 'test']],
    },
  ],
}

function queryAllowAll() {
  return true
}

/**
 * Creates a nock that represents a successful call to data query endpoint.
 */
export function querySuccess(options) {
  const {
    url, path, auth, response = QUERY_SUCCESS_RESPONSE, query = queryAllowAll,
  } = options
  const scope = nock(url)
    .matchHeader('Accept', CONTENT_TYPE_APPLICATION_JSON)
    .get(path)
    .query(query)
  if (auth) {
    scope.basicAuth(auth)
  }
  return scope.reply(200, response)
}

export function queryMultipleSuccess(options) {
  const {
    url, path, auth, response = QUERY_MULTIPLE_SUCCESS_RESPONSE, query = queryAllowAll,
  } = options
  const scope = nock(url)
    .matchHeader('Accept', CONTENT_TYPE_APPLICATION_JSON)
    .post(path)
    .query(query)
  if (auth) {
    scope.basicAuth(auth)
  }
  return scope.reply(200, response)
}
