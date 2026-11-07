/**
 * Backup api client to perform RQLite back and load operations
 * @module api/backup
 * @see https://rqlite.io/docs/guides/backup/
 */
import HttpRequest from '../../http-request'
import {
  CONTENT_TYPE_APPLICATION_OCTET_STREAM,
  CONTENT_TYPE_TEXT_PLAIN,
} from '../../http-request/content-types'
import {
  HTTP_HEADER_ACCEPT,
  HTTP_HEADER_CONTENT_TYPE,
} from '../../http-request/http-headers'
import { PATH_BACKUP, PATH_LOAD } from '../paths'
import { BACKUP_DATA_FORMAT_DUMP, BACKUP_DATA_FORMAT_SQL } from '../backup-formats'
import { QUERY_PARAM_FMT } from '../query-params'

export { PATH_LOAD, PATH_BACKUP } from '../paths'
export { BACKUP_DATA_FORMAT_SQL, BACKUP_DATA_FORMAT_DUMP } from '../backup-formats'

/**
 * Backup api client to perform RQLite back up and load operations
 */
export default class BackupApiClient extends HttpRequest {
  /**
   * Perform a SQL dump backup from the RQLite server
   * @param {String} [format=BACKUP_DATA_FORMAT_DUMP] The backup data format
   * @returns {Promise<*>} The response stream
   * @see https://rqlite.io/docs/guides/backup/
   * @see module:api/backup-formats
   */
  async backup (format = BACKUP_DATA_FORMAT_DUMP) {
    return super.get({
      headers: {
        // Always sends application/octet-stream from the server in RQLite v4.x
        [HTTP_HEADER_ACCEPT]: CONTENT_TYPE_APPLICATION_OCTET_STREAM,
      },
      query: {
        [QUERY_PARAM_FMT]: format === BACKUP_DATA_FORMAT_SQL ? format : undefined,
      },
      json: false,
      stream: true,
      uri: PATH_BACKUP,
      useLeader: true,
    })
  }

  /**
   * Perform a SQL restore by sending data the RQLite server
   * @param {Buffer|String} data The data to be loaded
   * @param {String} [format=BACKUP_DATA_FORMAT_SQL] The backup data format
   * @returns {Promise<*>} The response stream
   * @see https://rqlite.io/docs/guides/backup/
   * @see module:api/backup-formats
   */
  async load (data, format = BACKUP_DATA_FORMAT_SQL) {
    return super.post({
      body: data,
      headers: {
        [HTTP_HEADER_CONTENT_TYPE]: format === BACKUP_DATA_FORMAT_SQL
          ? CONTENT_TYPE_TEXT_PLAIN
          : CONTENT_TYPE_APPLICATION_OCTET_STREAM,
      },
      json: false,
      stream: true,
      uri: PATH_LOAD,
      useLeader: true,
    })
  }
}
