/**
 * RQLite JS client which export all of the api clients
 * @module rqlite-js
 */
import DataApiClient from './api/data/index.mjs'
import BackupApiClient from './api/backup/index.mjs'
import StatusApiClient from './api/status/index.mjs'

export default {
  DataApiClient,
  BackupApiClient,
  StatusApiClient,
}
