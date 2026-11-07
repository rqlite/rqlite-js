/**
 * RQLite JS client which export all of the api clients
 * @module rqlite-js
 * @see https://rqlite.io/docs/api/api/
 */
import DataApiClient from './api/data/index.js'
import BackupApiClient from './api/backup/index.js'
import StatusApiClient from './api/status/index.js'

export {
  DataApiClient,
  BackupApiClient,
  StatusApiClient,
}

export {
  PATH_QUERY,
  PATH_EXECUTE,
  CONSISTENCY_LEVEL_NONE,
  CONSISTENCY_LEVEL_STRONG,
  CONSISTENCY_LEVEL_LINEARIZABLE,
  CONSISTENCY_LEVEL_WEAK,
} from './api/data/index.js'

export {
  PATH_BACKUP,
  PATH_LOAD,
  BACKUP_DATA_FORMAT_SQL,
  BACKUP_DATA_FORMAT_DUMP,
} from './api/backup/index.js'

export { PATH_STATUS } from './api/status/index.js'

export default {
  DataApiClient,
  BackupApiClient,
  StatusApiClient,
}
