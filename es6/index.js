/**
 * RQLite JS client which export all of the api clients
 * @module rqlite-js
 */
import DataApiClient from './api/data'
import BackupApiClient from './api/backup'
import StatusApiClient from './api/status'

export {
  DataApiClient,
  BackupApiClient,
  StatusApiClient,
}

export default {
  DataApiClient,
  BackupApiClient,
  StatusApiClient,
}
