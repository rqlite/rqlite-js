/**
 * Backup api client to perform RQLite back and load operations
 * @module api/backup
 */
import HttpRequest from '../../http-request'
import { CONTENT_TYPE_APPLICATION_OCTET_STREAM, CONTENT_TYPE_TEXT_PLAIN } from '../../http-request/content-types'

/**
 * The RQLite load api path
 */
export const PATH_LOAD = '/db/load'

/**
 * The RQLite backup api path
 */
export const PATH_BACKUP = '/db/backup'

/**
 * Backup api client to perform RQLite back up and load operations
 */
export default class BackupApiClient extends HttpRequest {
  /**
   * Perform a SQL dump backup from the RQLite server
   */
  async backup () {
    return super.get({
      headers: {
        Accept: CONTENT_TYPE_APPLICATION_OCTET_STREAM,
        'Content-Type': CONTENT_TYPE_APPLICATION_OCTET_STREAM,
      },
      json: false,
      stream: true,
      uri: PATH_BACKUP,
    })
  }

  /**
   * Perform a SQL dump restore by sending data the RQLite server
   * @param {Buffer|String} data The data to be loaded
   */
  async load (data) {
    return super.post({
      body: data,
      headers: {
        'Content-Type': CONTENT_TYPE_TEXT_PLAIN,
      },
      json: false,
      stream: true,
      uri: PATH_LOAD,
    })
  }
}
