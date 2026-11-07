/**
 * RQLite backup data format constants
 * @module api/backup-formats
 * @see https://rqlite.io/docs/guides/backup/
 */

/**
 * Use plain SQL dump as the back up format
 */
export const BACKUP_DATA_FORMAT_SQL = 'sql'

/**
 * Use sqlite3 dump as the back up format (default binary backup)
 */
export const BACKUP_DATA_FORMAT_DUMP = 'dump'
