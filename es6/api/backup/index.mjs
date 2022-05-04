/**
 * Backup api client to perform RQLite back and load operations
 * @module api/backup
 */
import HttpRequest from '../../http-request/index.mjs'
import { CONTENT_TYPE_APPLICATION_OCTET_STREAM, CONTENT_TYPE_TEXT_PLAIN } from '../../http-request/content-types.mjs'

/**
 * The RQLite load api path
 */
export const PATH_LOAD = '/db/load'

/**
 * The RQLite backup api path
 */
export const PATH_BACKUP = '/db/backup'

/**
 * Use plain SQL dump as the back up format
 */
export const BACKUP_DATA_FORMAT_SQL = 'sql'

/**
 * Use sqlite3 dump as the back up format
 */
export const BACKUP_DATA_FORMAT_DUMP = 'dump'

/**
 * Backup api client to perform RQLite back up and load operations
 */
export default class BackupApiClient extends HttpRequest {
  /**
   * Perform a SQL dump backup from the RQLite server
   * @param {String} [format=BACKUP_DATA_FORMAT_DUMP] The backup data format
   * @returns {Stream} The response stream
   */
  async backup (format = BACKUP_DATA_FORMAT_DUMP) {
    const stream = super.get({
      headers: {
        // Always sends application/octet-stream from the server in RQLite v4.x
        Accept: CONTENT_TYPE_APPLICATION_OCTET_STREAM,
      },
      query: { fmt: format === BACKUP_DATA_FORMAT_SQL ? format : undefined },
      json: false,
      stream: true,
      uri: PATH_BACKUP,
      useLeader: true,
    })
    return stream
  }

  /**
   * Perform a SQL restore by sending data the RQLite server
   * @param {Buffer|String} data The data to be loaded
   * @param {String} [format=BACKUP_DATA_FORMAT_SQL] The backup data format
   * @returns {Stream} The response stream
   */
  async load (data, format = BACKUP_DATA_FORMAT_SQL) {
    return super.post({
      body: data,
      headers: {
        // eslint-disable-next-line max-len
        'Content-Type': format === BACKUP_DATA_FORMAT_SQL ? CONTENT_TYPE_TEXT_PLAIN : CONTENT_TYPE_APPLICATION_OCTET_STREAM,
      },
      json: false,
      stream: true,
      uri: PATH_LOAD,
      useLeader: true,
    })
  }
}
