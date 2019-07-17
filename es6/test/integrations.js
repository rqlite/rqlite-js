/**
 * Integration test helpers
 * @module test/integrations
 */
import { delay } from 'bluebird'
import StatusApiClient from '../api/status'

export const URL = 'http://localhost:4001'

// eslint-disable-next-line prefer-destructuring
const RQLITE_HOSTS = process.env.RQLITE_HOSTS

/**
 * Get the URL for integration tests, which can be changed
 * using the RQLITE_URL environment variable.
 */
export function getUrl () {
  return RQLITE_HOSTS || URL
}

let statusApiClient

export async function checkRqliteServerReady (attempt = 0, wait = 500, maxAttempts = 10) {
  if (!statusApiClient) {
    statusApiClient = new StatusApiClient(getUrl())
  }
  try {
    const { body } = await statusApiClient.status({ useMaster: true, raw: true })
    return body
  } catch (e) {
    if (attempt < maxAttempts) {
      await delay(wait)
      return checkRqliteServerReady(attempt + 1)
    }
    throw e
  }
}
