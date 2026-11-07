/**
 * Backup api client to perform RQLite backup and load operations
 * @module api/backup
 * @see https://rqlite.io/docs/guides/backup/
 */
import type { Readable } from 'node:stream'
import HttpRequest from '../../http-request/index.js'
import {
  CONTENT_TYPE_APPLICATION_OCTET_STREAM,
  CONTENT_TYPE_TEXT_PLAIN,
} from '../../http-request/content-types.js'
import {
  HTTP_HEADER_ACCEPT,
  HTTP_HEADER_CONTENT_TYPE,
} from '../../http-request/http-headers.js'
import { PATH_BACKUP, PATH_LOAD } from '../paths.js'
import { BACKUP_DATA_FORMAT_DUMP, BACKUP_DATA_FORMAT_SQL } from '../backup-formats.js'
import { QUERY_PARAM_FMT } from '../query-params.js'

export { PATH_LOAD, PATH_BACKUP } from '../paths.js'
export { BACKUP_DATA_FORMAT_SQL, BACKUP_DATA_FORMAT_DUMP } from '../backup-formats.js'

/**
 * Backup api client to perform RQLite back up and load operations
 */
export default class BackupApiClient extends HttpRequest {
  /**
   * Perform a SQL dump backup from the RQLite server
   * @see https://rqlite.io/docs/guides/backup/
   * @see module:api/backup-formats
   */
  async backup (format: string = BACKUP_DATA_FORMAT_DUMP): Promise<Readable> {
    return super.get({
      headers: {
        [HTTP_HEADER_ACCEPT]: CONTENT_TYPE_APPLICATION_OCTET_STREAM,
      },
      query: {
        [QUERY_PARAM_FMT]: format === BACKUP_DATA_FORMAT_SQL ? format : undefined,
      },
      json: false,
      stream: true,
      uri: PATH_BACKUP,
      useLeader: true,
    }) as Promise<Readable>
  }

  /**
   * Perform a SQL restore by sending data the RQLite server
   * @see https://rqlite.io/docs/guides/backup/
   * @see module:api/backup-formats
   */
  async load (
    data: Buffer | string,
    format: string = BACKUP_DATA_FORMAT_SQL,
  ): Promise<Readable> {
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
    }) as Promise<Readable>
  }
}
