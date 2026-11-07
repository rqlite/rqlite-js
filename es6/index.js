/**
 * RQLite JS client which export all of the api clients
 * @module rqlite-js
 * @see https://rqlite.io/docs/api/api/
 */
import DataApiClient from './api/data'
import BackupApiClient from './api/backup'
import StatusApiClient from './api/status'

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
} from './api/data'

export {
  PATH_BACKUP,
  PATH_LOAD,
  BACKUP_DATA_FORMAT_SQL,
  BACKUP_DATA_FORMAT_DUMP,
} from './api/backup'

export { PATH_STATUS } from './api/status'

export default {
  DataApiClient,
  BackupApiClient,
  StatusApiClient,
}
