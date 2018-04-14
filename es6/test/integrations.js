export const URL = 'http://localhost:4001'

/**
 * Get the URL for integration tests, which can be changed
 * using the RQLITE_URL environment variable.
 */
export function getUrl() {
  return process.env.RQLITE_URL || URL
}
