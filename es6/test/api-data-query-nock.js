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

export const QUERY_MULTIPLE_SUCCESS_RESPONSE = {
  results: [
    {
      columns: ['id', 'name'],
      types: ['integer', 'text'],
      values: [[1, 'fiona']]
    },
    {
      columns: ['id', 'value'],
      types: ['integer', 'text'],
      values: [[1, 'test']]
    }
  ]
}

/**
 * Creates a nock that represents a succesful call to data query endpoint.
 */
export function querySuccess (options) {
  const {url, path, auth, response = QUERY_SUCCESS_RESPONSE} = options
  const scope = nock(url)
    .matchHeader('Accept', CONTENT_TYPE_APPLICATION_JSON)
    .get(path)
    .query(() => true)
  if (auth) {
    scope.basicAuth(auth)
  }
  return scope.reply(200, response)
}

export function queryMultipleSuccess (options) {
  const {url, path, auth, response = QUERY_MULTIPLE_SUCCESS_RESPONSE} = options
  const scope = nock(url)
    .matchHeader('Accept', CONTENT_TYPE_APPLICATION_JSON)
    .post(path)
    .query(() => true)
  if (auth) {
    scope.basicAuth(auth)
  }
  return scope.reply(200, response)
}
