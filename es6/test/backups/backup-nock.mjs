import nock from 'nock'
import { CONTENT_TYPE_APPLICATION_OCTET_STREAM } from '../../http-request/content-types.mjs'

export const BACKUP_SUCCESS_RESPONSE = [
  'CREATE TABLE foo (id integer not null primary key, name text);',
  'INSERT INTO foo(name) VALUES("fiona");',
  'INSERT INTO foo(name) VALUES("justin");',
].join('')

/**
 * Creates a nock that represents a successful call to data query endpoint.
 */
export function backupSuccess (options) {
  const {
    url, path, auth, response = BACKUP_SUCCESS_RESPONSE,
  } = options
  const scope = nock(url)
    .defaultReplyHeaders({
      'Content-Type': CONTENT_TYPE_APPLICATION_OCTET_STREAM,
    })
    .matchHeader('Accept', CONTENT_TYPE_APPLICATION_OCTET_STREAM)
    .get(path)
  if (auth) {
    scope.basicAuth(auth)
  }
  return scope.reply(200, response)
}
