/**
 * Helpers for multi-node rqlite integration tests (Compose cluster).
 * @module test/cluster
 */
import { StatusApiClient } from '../index.js'
import { DEFAULT_RQLITE_HOST, ENV_RQLITE_HOSTS } from './env.js'

export type ClusterStoreStatus = {
  ready?: boolean
  /** On rqlite 10 this is usually `{ addr, node_id }` for the cluster leader, not a boolean. */
  leader?: boolean | { addr?: string, node_id?: string }
  raft?: { state?: string, num_peers?: number }
  nodes?: unknown[]
  servers?: unknown[]
}

export type ClusterNodeSnapshot = {
  host: string
  ready: boolean
  isLeader: boolean
  body: Record<string, unknown>
  store: ClusterStoreStatus
}

export function getIntegrationHosts (): string[] {
  const raw = process.env[ENV_RQLITE_HOSTS] || DEFAULT_RQLITE_HOST
  return String(raw)
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean)
}

export function sleep (ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function asObject (value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function readStore (body: Record<string, unknown>): ClusterStoreStatus {
  return asObject(body.store) as ClusterStoreStatus
}

function nodeIsLeader (store: ClusterStoreStatus): boolean {
  // rqlite 10 exposes raft.state as Leader/Follower; store.leader is leader identity metadata.
  return store.raft?.state === 'Leader' || store.leader === true
}

/**
 * Fetch /status from every configured host (no leader redirect).
 */
export async function snapshotClusterNodes (
  statusApiClient: StatusApiClient,
): Promise<ClusterNodeSnapshot[]> {
  const hosts = statusApiClient.getHosts()
  const rows = await statusApiClient.statusAllHosts()
  return rows.map((row, index) => {
    const body = asObject(row.response.body)
    const store = readStore(body)
    return {
      host: row.host || hosts[index],
      ready: store.ready === true,
      isLeader: nodeIsLeader(store),
      body,
      store,
    }
  })
}

export type WaitForClusterOptions = {
  expectedNodes?: number
  attempts?: number
  delayMs?: number
}

/**
 * Poll until every host is reachable, ready, and exactly one leader is visible.
 */
export async function waitForClusterReady (
  statusApiClient: StatusApiClient,
  options: WaitForClusterOptions = {},
): Promise<ClusterNodeSnapshot[]> {
  const expectedNodes = options.expectedNodes ?? statusApiClient.getHosts().length
  const attempts = options.attempts ?? 40
  const delayMs = options.delayMs ?? 500
  let lastError: unknown

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const nodes = await snapshotClusterNodes(statusApiClient)
      if (nodes.length !== expectedNodes) {
        throw new Error(`expected ${expectedNodes} status rows, got ${nodes.length}`)
      }
      const notReady = nodes.filter((node) => !node.ready)
      if (notReady.length > 0) {
        throw new Error(`nodes not ready: ${notReady.map((n) => n.host).join(', ')}`)
      }
      const leaders = nodes.filter((node) => node.isLeader)
      if (leaders.length !== 1) {
        throw new Error(`expected 1 leader, found ${leaders.length}`)
      }
      return nodes
    } catch (error) {
      lastError = error
      await sleep(delayMs)
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`cluster not ready: ${String(lastError)}`)
}

export function findLeaderHost (nodes: ClusterNodeSnapshot[]): string {
  const leader = nodes.find((node) => node.isLeader)
  if (!leader) {
    throw new Error('no leader in cluster snapshot')
  }
  return leader.host
}

export function findFollowerHosts (nodes: ClusterNodeSnapshot[]): string[] {
  return nodes.filter((node) => !node.isLeader).map((node) => node.host)
}
